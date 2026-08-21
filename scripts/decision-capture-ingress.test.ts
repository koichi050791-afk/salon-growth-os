import assert from 'node:assert/strict'
import { handleDecisionCapturePost } from '@/app/api/decision-captures/route'
import {
  saveDecisionCapture,
  type DecisionCaptureSaveFields,
  type SaveDecisionCaptureResult,
} from '@/lib/services/decision-capture-save'
import type {
  CreateAirtableDecisionInput,
} from '@/lib/repositories/airtable-decisions'
import type { WorkGraphDispatchResult, WorkGraphEvent } from '@/lib/types/ai-operations'
import type { DecisionCaptureSource } from '@/lib/types/decision'

const now = new Date('2026-08-21T01:23:00.000Z')
const testToken = 'unit_test_decision_capture_token'

const baseFields: DecisionCaptureSaveFields = {
  consultationConcern: 'shorter and lighter',
  customerTruth: 'confirmed facts only',
  chosenDecision: 'short style',
  notChosen: 'over-thinning',
  nextObservation: 'check handling next visit',
}

function request(input: {
  token?: string | null
  body: string
  contentType?: string
}): Request {
  const headers = new Headers()
  if (typeof input.token === 'string') {
    headers.set('authorization', `Bearer ${input.token}`)
  }
  headers.set('content-type', input.contentType ?? 'application/json')

  return new Request('https://example.com/api/decision-captures', {
    method: 'POST',
    headers,
    body: input.body,
  })
}

function dispatchResult(event: WorkGraphEvent, ok = true): WorkGraphDispatchResult {
  return {
    ok,
    event,
    routedAgentIds: [],
    sharedCapabilityIds: [],
    agentRuns: [],
    approvalQueueItems: [],
    autoWorkCount: 0,
    error: ok ? null : 'dispatch_failed',
  }
}

function decisionEvent(input: {
  decisionRecordId: string | null
  title: string
  captureSource?: DecisionCaptureSource
}): WorkGraphEvent {
  return {
    id: 'event_decision',
    type: 'DecisionCaptured',
    occurredAt: now.toISOString(),
    source: 'airtable',
    sourceRefs: [],
    payload: {
      decisionRecordId: input.decisionRecordId,
      title: input.title,
      fieldState: {
        consultationConcern: 'known',
        customerTruth: 'known',
        chosenDecision: 'known',
        notChosen: 'known',
        nextObservation: 'known',
      },
      containsProfessionalHypothesis: false,
      captureSource: input.captureSource,
    },
  }
}

function nextObservationEvent(decisionId: string): WorkGraphEvent {
  return {
    id: 'event_next_observation',
    type: 'NextObservationCreated',
    occurredAt: now.toISOString(),
    source: 'airtable',
    sourceRefs: [],
    payload: { decisionId },
  }
}

async function main() {
  const createdInputs: CreateAirtableDecisionInput[] = []
  const dispatchInputs: Array<{ captureSource?: unknown }> = []
  const nextObservationInputs: Array<{ decisionId?: unknown }> = []

  const result = await saveDecisionCapture({
    source: 'CHATGPT',
    fields: {
      ...baseFields,
      professionalHypothesis: 'unsupported hypothesis',
      treatmentAction: 'unsupported treatment',
      notChosenReason: 'unsupported reason',
    },
    sourceRefs: [{
      id: 'chatgpt_message_synthetic',
      source: 'chatgpt',
      label: 'Synthetic ChatGPT source',
    }],
    now,
  }, {
    createDecisionRecord: async (input) => {
      createdInputs.push(input)
      return { ok: true, error: null, recordId: 'rec_decision_saved' }
    },
    dispatchDecisionCaptured: async (input) => {
      dispatchInputs.push(input)
      return dispatchResult(decisionEvent(input))
    },
    dispatchNextObservationCreated: async (input) => {
      nextObservationInputs.push(input)
      return dispatchResult(nextObservationEvent(input.decisionId))
    },
  })

  assert.equal(result.ok, true)
  assert.equal(result.saved, true)
  assert.equal(result.decisionId, 'rec_decision_saved')
  assert.equal(result.downstream.decisionCaptured, 'dispatched')
  assert.equal(result.downstream.nextObservation, 'dispatched')
  assert.equal(result.unsupportedFields.length, 3)
  assert.equal(result.warnings.filter((warning) =>
    warning.code === 'UNSUPPORTED_FIELD_NOT_PERSISTED',
  ).length, 3)
  assert.equal(createdInputs[0]?.values.consultationConcern, 'shorter and lighter')
  assert.equal(createdInputs[0]?.values.customerTruth, 'confirmed facts only')
  assert.equal('professionalHypothesis' in (createdInputs[0]?.values ?? {}), false)
  assert.equal(dispatchInputs[0]?.captureSource, 'CHATGPT')
  assert.equal(nextObservationInputs[0]?.decisionId, 'rec_decision_saved')

  const unknownResult = await saveDecisionCapture({
    source: 'API',
    fields: {
      consultationConcern: ' unknown ',
      customerTruth: '',
      chosenDecision: null,
      notChosen: undefined,
      nextObservation: '  UNKNOWN  ',
    },
    now,
  }, {
    createDecisionRecord: async (input) => {
      createdInputs.push(input)
      return { ok: true, error: null, recordId: 'rec_unknown_saved' }
    },
    dispatchDecisionCaptured: async () =>
      dispatchResult(decisionEvent({
        decisionRecordId: 'rec_unknown_saved',
        title: 'Synthetic',
      })),
    dispatchNextObservationCreated: async () => {
      throw new Error('next observation should not dispatch when unknown')
    },
  })
  assert.equal(unknownResult.ok, true)
  assert.equal(createdInputs[1]?.values.consultationConcern, null)
  assert.equal(createdInputs[1]?.values.customerTruth, null)
  assert.equal(createdInputs[1]?.values.nextObservation, null)
  assert.equal(unknownResult.downstream.nextObservation, 'skipped')

  const testDecisionResult = await saveDecisionCapture({
    source: 'CHATGPT',
    fields: {
      ...baseFields,
      consultationConcern: '【TEST】synthetic production-readiness check',
    },
    now,
  }, {
    createDecisionRecord: async (input) => {
      createdInputs.push(input)
      return { ok: true, error: null, recordId: 'rec_test_saved' }
    },
    dispatchDecisionCaptured: async () =>
      dispatchResult(decisionEvent({
        decisionRecordId: 'rec_test_saved',
        title: 'Synthetic',
      })),
    dispatchNextObservationCreated: async () =>
      dispatchResult(nextObservationEvent('rec_test_saved')),
  })
  assert.equal(testDecisionResult.ok, true)
  assert.equal(
    createdInputs[2]?.values.consultationConcern,
    '【TEST】synthetic production-readiness check',
  )

  const failedPersistence = await saveDecisionCapture({
    source: 'API',
    fields: baseFields,
    now,
  }, {
    createDecisionRecord: async () => ({ ok: false, error: 'request_failed', recordId: null }),
    dispatchDecisionCaptured: async () => {
      throw new Error('dispatch must not run after failed persistence')
    },
  })
  assert.equal(failedPersistence.ok, false)
  assert.equal(failedPersistence.saved, false)
  assert.equal(failedPersistence.error, 'persistence_failed')

  const failedDownstream = await saveDecisionCapture({
    source: 'API',
    fields: baseFields,
    now,
  }, {
    createDecisionRecord: async () => ({ ok: true, error: null, recordId: 'rec_saved_dispatch_failed' }),
    dispatchDecisionCaptured: async () =>
      dispatchResult(decisionEvent({
        decisionRecordId: 'rec_saved_dispatch_failed',
        title: 'Synthetic',
      }), false),
    dispatchNextObservationCreated: async () =>
      dispatchResult(nextObservationEvent('rec_saved_dispatch_failed')),
  })
  assert.equal(failedDownstream.ok, true)
  assert.equal(failedDownstream.saved, true)
  assert.equal(failedDownstream.downstream.decisionCaptured, 'failed')
  assert.equal(failedDownstream.warnings.some((warning) =>
    warning.code === 'DOWNSTREAM_DISPATCH_FAILED',
  ), true)

  process.env.DECISION_CAPTURE_API_TOKEN = testToken
  const noAuth = await handleDecisionCapturePost(request({
    token: null,
    body: JSON.stringify({ fields: baseFields }),
  }), {
    saveDecisionCapture: async () => {
      throw new Error('save must not run without auth')
    },
  })
  assert.equal(noAuth.status, 401)
  assert.equal(await noAuth.text(), '{"success":false,"error":"authentication_error"}')

  const wrongAuth = await handleDecisionCapturePost(request({
    token: 'wrong_token',
    body: JSON.stringify({ fields: baseFields }),
  }), {
    saveDecisionCapture: async () => {
      throw new Error('save must not run with wrong auth')
    },
  })
  assert.equal(wrongAuth.status, 401)
  assert.equal(await wrongAuth.text(), '{"success":false,"error":"authentication_error"}')

  const malformed = await handleDecisionCapturePost(request({
    token: testToken,
    body: '{',
  }))
  assert.equal(malformed.status, 400)

  const invalidPayload = await handleDecisionCapturePost(request({
    token: testToken,
    body: JSON.stringify({ fields: { customerName: 'redacted' } }),
  }))
  assert.equal(invalidPayload.status, 400)

  const oversized = await handleDecisionCapturePost(request({
    token: testToken,
    body: JSON.stringify({ fields: { consultationConcern: 'x'.repeat(16 * 1024) } }),
  }))
  assert.equal(oversized.status, 413)

  const validApi = await handleDecisionCapturePost(request({
    token: testToken,
    body: JSON.stringify({
      source: 'CHATGPT',
      fields: {
        ...baseFields,
        professionalHypothesis: 'unsupported hypothesis',
      },
      sourceRefs: [{
        id: 'chatgpt_message_synthetic',
        source: 'chatgpt',
        label: 'Synthetic ChatGPT source',
      }],
    }),
  }), {
    saveDecisionCapture: async (input): Promise<SaveDecisionCaptureResult> => {
      assert.equal(input.source, 'CHATGPT')
      assert.equal(input.fields.professionalHypothesis, 'unsupported hypothesis')
      assert.equal(input.sourceRefs?.[0]?.source, 'chatgpt')
      return {
        ok: true,
        saved: true,
        decisionId: 'rec_api_saved',
        title: 'Synthetic title',
        savedAt: now.toISOString(),
        captureSource: 'CHATGPT',
        downstream: {
          decisionCaptured: 'dispatched',
          nextObservation: 'dispatched',
        },
        warnings: [{
          code: 'UNSUPPORTED_FIELD_NOT_PERSISTED',
          field: 'professionalHypothesis',
          message: 'professionalHypothesis is not persisted by the Decision-centered Case v0.1 save boundary.',
        }],
        unsupportedFields: ['professionalHypothesis'],
      }
    },
  })
  assert.equal(validApi.status, 201)
  const validApiText = await validApi.text()
  assert.equal(validApiText.includes(testToken), false)
  assert.equal(validApiText.includes('rec_api_saved'), true)
  assert.equal(validApiText.includes('UNSUPPORTED_FIELD_NOT_PERSISTED'), true)

  console.log('Decision capture ingress checks passed')
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
