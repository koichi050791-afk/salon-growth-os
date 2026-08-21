import assert from 'node:assert/strict'
import {
  handleDecisionValidationGet,
  handleDecisionValidationPost,
} from '@/app/api/decision-validations/route'
import type { AirtableDecisionRecord } from '@/lib/repositories/airtable-decisions'
import {
  listOpenDecisionValidations,
  normalizeDecisionValidationInput,
  saveDecisionValidation,
} from '@/lib/services/decision-validation'
import type { DataKind } from '@/lib/types/data-kind'

const token = 'unit_test_decision_validation_token'
const decisionId = 'rec12345678901234'

function decisionRecord(input: {
  id?: string
  dataKind?: DataKind
  validationState?: AirtableDecisionRecord['validation']['validationState']
  nextObservation?: string | null
} = {}): AirtableDecisionRecord {
  return {
    id: input.id ?? decisionId,
    title: '2026-08-21 Synthetic Decision',
    status: '記録済み',
    dataKind: input.dataKind ?? 'REAL',
    values: {
      consultationConcern: 'synthetic concern',
      customerTruth: 'synthetic confirmed facts',
      chosenDecision: 'synthetic decision',
      notChosen: 'synthetic not chosen',
      nextObservation: input.nextObservation === undefined
        ? 'check handling next visit'
        : input.nextObservation,
    },
    validation: {
      outcomeObserved: null,
      validationState: input.validationState ?? 'UNVALIDATED',
      validationNote: null,
    },
  }
}

function request(input: {
  method: 'GET' | 'POST'
  token?: string | null
  body?: unknown
}): Request {
  const headers = new Headers()
  if (typeof input.token === 'string') {
    headers.set('authorization', `Bearer ${input.token}`)
  }
  if (input.method === 'POST') {
    headers.set('content-type', 'application/json')
  }

  return new Request('https://example.com/api/decision-validations', {
    method: input.method,
    headers,
    body: input.method === 'POST' ? JSON.stringify(input.body) : undefined,
  })
}

async function main() {
  const normalized = normalizeDecisionValidationInput({
    decisionId,
    outcomeObserved: '  customer reported easier morning handling  ',
    validationState: 'confirmed',
    validationNote: '  prior decision was supported  ',
  })
  assert.deepEqual(normalized, {
    decisionId,
    outcomeObserved: 'customer reported easier morning handling',
    validationState: 'CONFIRMED',
    validationNote: 'prior decision was supported',
  })
  assert.equal(normalizeDecisionValidationInput({
    decisionId,
    outcomeObserved: '',
    validationState: 'CONFIRMED',
  }), null)
  assert.equal(normalizeDecisionValidationInput({
    decisionId,
    outcomeObserved: 'observed',
    validationState: 'UNVALIDATED',
  }), null)

  const updatedInputs: unknown[] = []
  const saved = await saveDecisionValidation({
    decisionId,
    outcomeObserved: '  easier to handle at home  ',
    validationState: 'PARTIAL',
    validationNote: '',
  }, {
    getDecision: async () => ({ data: decisionRecord(), error: null }),
    updateValidation: async (input) => {
      updatedInputs.push(input)
      return { ok: true, error: null }
    },
  })
  assert.equal(saved.ok, true)
  assert.deepEqual(updatedInputs[0], {
    decisionId,
    outcomeObserved: 'easier to handle at home',
    validationState: 'PARTIAL',
    validationNote: null,
  })

  const notReal = await saveDecisionValidation({
    decisionId,
    outcomeObserved: 'synthetic outcome',
    validationState: 'CONFIRMED',
  }, {
    getDecision: async () => ({
      data: decisionRecord({ dataKind: 'TEST' }),
      error: null,
    }),
    updateValidation: async () => {
      throw new Error('TEST must never be updated as REAL validation')
    },
  })
  assert.equal(notReal.ok, false)
  assert.equal(notReal.error, 'not_real')

  const notOpen = await saveDecisionValidation({
    decisionId,
    outcomeObserved: 'observed outcome',
    validationState: 'CONFIRMED',
  }, {
    getDecision: async () => ({
      data: decisionRecord({ nextObservation: null }),
      error: null,
    }),
    updateValidation: async () => {
      throw new Error('Decision without Next Observation must not be updated')
    },
  })
  assert.equal(notOpen.ok, false)
  assert.equal(notOpen.error, 'not_open')

  const alreadyValidated = await saveDecisionValidation({
    decisionId,
    outcomeObserved: 'replacement outcome',
    validationState: 'CONTRADICTED',
  }, {
    getDecision: async () => ({
      data: decisionRecord({ validationState: 'CONFIRMED' }),
      error: null,
    }),
    updateValidation: async () => {
      throw new Error('Completed validation must not be overwritten')
    },
  })
  assert.equal(alreadyValidated.ok, false)
  assert.equal(alreadyValidated.error, 'already_validated')

  const open = await listOpenDecisionValidations(50, {
    listDecisions: async () => ({
      data: [
        decisionRecord(),
        decisionRecord({ id: 'recABCDEFGHIJKLMN', dataKind: 'TEST' }),
        decisionRecord({ id: 'recZYXWVUTSRQPONM', validationState: 'CONFIRMED' }),
        decisionRecord({ id: 'rec00000000000000', nextObservation: null }),
      ],
      error: null,
    }),
  })
  assert.equal(open.error, null)
  assert.equal(open.data.length, 1)
  assert.equal(open.data[0]?.decisionId, decisionId)

  process.env.DECISION_CAPTURE_API_TOKEN = token

  const unauthorized = await handleDecisionValidationGet(request({
    method: 'GET',
    token: null,
  }), {
    listOpenDecisionValidations: async () => {
      throw new Error('list must not run without authentication')
    },
  })
  assert.equal(unauthorized.status, 401)

  const listed = await handleDecisionValidationGet(request({
    method: 'GET',
    token,
  }), {
    listOpenDecisionValidations: async () => open,
  })
  assert.equal(listed.status, 200)
  assert.equal((await listed.json()).count, 1)

  const invalidPost = await handleDecisionValidationPost(request({
    method: 'POST',
    token,
    body: { decisionId, outcomeObserved: 'observed', validationState: 'INVALID' },
  }), {
    saveDecisionValidation: async (input) => saveDecisionValidation(input, {
      getDecision: async () => ({ data: decisionRecord(), error: null }),
      updateValidation: async () => ({ ok: true, error: null }),
    }),
  })
  assert.equal(invalidPost.status, 400)

  const savedPost = await handleDecisionValidationPost(request({
    method: 'POST',
    token,
    body: {
      decisionId,
      outcomeObserved: 'observed outcome',
      validationState: 'CONFIRMED',
      validationNote: 'supported point',
    },
  }), {
    saveDecisionValidation: async () => ({
      ok: true,
      saved: true,
      decisionId,
      validationState: 'CONFIRMED',
    }),
  })
  assert.equal(savedPost.status, 200)
  assert.equal((await savedPost.json()).validationState, 'CONFIRMED')

  delete process.env.DECISION_CAPTURE_API_TOKEN
  console.log('decision validation tests passed')
}

await main()
