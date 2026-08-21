import type { AirtableDecisionRecord } from '@/lib/repositories/airtable-decisions'

const TEST_PREFIXES = ['【TEST】', '【VERCEL TEST】', '【PRODUCTION TEST】']

export function isTestDecisionRecord(decision: Pick<AirtableDecisionRecord, 'values'>): boolean {
  const consultation = decision.values.consultationConcern ?? ''
  return TEST_PREFIXES.some((prefix) => consultation.startsWith(prefix))
}

export function shouldShowDecisionInHistory(decision: AirtableDecisionRecord): boolean {
  if (isTestDecisionRecord(decision)) return false
  return decision.dataKind === 'REAL' || decision.dataKind === 'UNKNOWN'
}
