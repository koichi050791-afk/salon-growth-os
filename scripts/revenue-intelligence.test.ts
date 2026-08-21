import assert from 'node:assert/strict'
import { buildRevenueIntelligenceProjection } from '@/lib/services/revenue-intelligence'
import type { ListAirtableDecisionsResult } from '@/lib/repositories/airtable-decisions'
import type { ListCustomerGrowthResult } from '@/lib/repositories/airtable-customer-growth'
import type { ContentRegistryReadResult } from '@/lib/types/content-source'

const decisionValues = {
  consultationConcern: null,
  customerTruth: null,
  chosenDecision: null,
  notChosen: null,
  nextObservation: null,
}

function decisions(data: ListAirtableDecisionsResult['data']): ListAirtableDecisionsResult {
  return { data, error: null }
}

function customerGrowth(data: ListCustomerGrowthResult['data']): ListCustomerGrowthResult {
  return { data, error: null }
}

function contentRegistry(): ContentRegistryReadResult {
  return {
    data: [],
    error: null,
    source: {
      provider: 'GOOGLE_SHEETS',
      spreadsheetId: 'synthetic_sheet',
      sheetName: 'synthetic_registry',
    },
  }
}

const unknownDecision = {
  id: 'rec_unknown_decision',
  title: 'Synthetic Decision',
  status: 'recorded',
  customerId: null,
  visitId: null,
  createdAt: '2026-08-21T00:00:00.000Z',
  values: {
    ...decisionValues,
    consultationConcern: 'shorter and lighter',
  },
  outcome: null,
  validation: null,
}

const sampleDecision = {
  ...unknownDecision,
  id: 'rec_sample_decision',
  values: {
    ...unknownDecision.values,
    consultationConcern: '【SAMPLE】sample consultation',
  },
}

const testDecision = {
  ...unknownDecision,
  id: 'rec_test_decision',
  values: {
    ...unknownDecision.values,
    consultationConcern: '【TEST】test consultation',
  },
}

const realBookedCustomer = {
  id: 'rec_real_customer',
  name: 'Synthetic Customer',
  customerId: 'C-SYN-REAL',
  state: 'CORE',
  expectedCycleDays: 45,
  lastVisitDate: '2026-08-20',
  expectedReturnDate: '2026-10-04',
  nextPlanStatus: 'BOOKED',
  dataKind: 'real',
} as const

const sampleBookedCustomer = {
  ...realBookedCustomer,
  id: 'rec_sample_customer',
  customerId: 'C-SYN-SAMPLE',
  dataKind: 'sample',
}

const unknownBookedCustomer = {
  ...realBookedCustomer,
  id: 'rec_unknown_customer',
  customerId: 'C-SYN-UNKNOWN',
  dataKind: null,
}

const unknownRevenue = buildRevenueIntelligenceProjection({
  contentRegistry: contentRegistry(),
  decisions: decisions([unknownDecision]),
  customerGrowth: customerGrowth([]),
})
assert.equal(unknownRevenue.realSignalCount, 0)
assert.equal(unknownRevenue.unknownExcludedCount, 1)
assert.equal(unknownRevenue.signals.length, 0)

const excludedRevenue = buildRevenueIntelligenceProjection({
  contentRegistry: contentRegistry(),
  decisions: decisions([sampleDecision, testDecision]),
  customerGrowth: customerGrowth([sampleBookedCustomer, unknownBookedCustomer]),
})
assert.equal(excludedRevenue.realSignalCount, 0)
assert.equal(excludedRevenue.sampleExcludedCount, 2)
assert.equal(excludedRevenue.testExcludedCount, 1)
assert.equal(excludedRevenue.unknownExcludedCount, 1)
assert.equal(excludedRevenue.signals.length, 0)

const bookingRevenue = buildRevenueIntelligenceProjection({
  contentRegistry: contentRegistry(),
  decisions: decisions([]),
  customerGrowth: customerGrowth([realBookedCustomer]),
})
assert.equal(bookingRevenue.realSignalCount, 1)
assert.equal(bookingRevenue.signals[0]?.signalType, 'BOOKING')
assert.equal(bookingRevenue.signals[0]?.evidenceClass, 'REAL')

const realZeroRevenue = buildRevenueIntelligenceProjection({
  contentRegistry: contentRegistry(),
  decisions: decisions([]),
  customerGrowth: customerGrowth([]),
})
assert.equal(realZeroRevenue.realSignalCount, 0)
assert.equal(realZeroRevenue.errors.length, 0)

console.log('Revenue Intelligence checks passed')
