import { timingSafeEqual } from 'node:crypto'
import {
  listOpenDecisionValidations as listOpenDecisionValidationsService,
  saveDecisionValidation as saveDecisionValidationService,
  type DecisionValidationInput,
  type ListOpenDecisionValidationsResult,
  type SaveDecisionValidationResult,
} from '@/lib/services/decision-validation'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 16 * 1024
const PAYLOAD_KEYS = [
  'decisionId',
  'outcomeObserved',
  'validationState',
  'validationNote',
] as const

type DecisionValidationRouteDependencies = {
  listOpenDecisionValidations?: typeof listOpenDecisionValidationsService
  saveDecisionValidation?: typeof saveDecisionValidationService
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status })
}

function readBearerToken(request: Request): string | null {
  const match = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

function compareTokens(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  const length = Math.max(actualBuffer.length, expectedBuffer.length)
  const actualPadded = Buffer.alloc(length)
  const expectedPadded = Buffer.alloc(length)

  actualBuffer.copy(actualPadded)
  expectedBuffer.copy(expectedPadded)
  return timingSafeEqual(actualPadded, expectedPadded)
    && actualBuffer.length === expectedBuffer.length
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.DECISION_CAPTURE_API_TOKEN?.trim()
  const actual = readBearerToken(request)
  return Boolean(expected && actual && compareTokens(actual, expected))
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parsePayload(value: unknown): DecisionValidationInput | null {
  if (!isObject(value)) return null
  if (!Object.keys(value).every((key) => PAYLOAD_KEYS.includes(key as typeof PAYLOAD_KEYS[number]))) {
    return null
  }

  return {
    decisionId: value.decisionId,
    outcomeObserved: value.outcomeObserved,
    validationState: value.validationState,
    validationNote: value.validationNote,
  }
}

async function readPayload(request: Request): Promise<DecisionValidationInput | null> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('application/json')) return null

  const text = await request.text()
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) return null

  try {
    return parsePayload(JSON.parse(text))
  } catch {
    return null
  }
}

function listResponse(result: ListOpenDecisionValidationsResult): Response {
  if (result.error) {
    return jsonResponse({
      success: false,
      error: result.error === 'missing_config' ? 'configuration_error' : 'source_error',
    }, result.error === 'missing_config' ? 503 : 502)
  }

  return jsonResponse({
    success: true,
    count: result.data.length,
    items: result.data,
  }, 200)
}

function saveResponse(result: SaveDecisionValidationResult): Response {
  if (result.ok) {
    return jsonResponse({
      success: true,
      saved: true,
      decisionId: result.decisionId,
      validationState: result.validationState,
    }, 200)
  }

  const statusByError: Record<Extract<SaveDecisionValidationResult, { ok: false }>['error'], number> = {
    invalid_input: 400,
    missing_config: 503,
    not_found: 404,
    not_real: 422,
    not_open: 409,
    already_validated: 409,
    persistence_failed: 502,
  }

  return jsonResponse({
    success: false,
    saved: false,
    error: result.error,
  }, statusByError[result.error])
}

export async function handleDecisionValidationGet(
  request: Request,
  dependencies: DecisionValidationRouteDependencies = {},
): Promise<Response> {
  if (!isAuthorized(request)) {
    return jsonResponse({ success: false, error: 'authentication_error' }, 401)
  }

  const list = dependencies.listOpenDecisionValidations ?? listOpenDecisionValidationsService
  return listResponse(await list())
}

export async function handleDecisionValidationPost(
  request: Request,
  dependencies: DecisionValidationRouteDependencies = {},
): Promise<Response> {
  if (!isAuthorized(request)) {
    return jsonResponse({ success: false, error: 'authentication_error' }, 401)
  }

  const payload = await readPayload(request)
  if (!payload) {
    return jsonResponse({ success: false, error: 'validation_error' }, 400)
  }

  const save = dependencies.saveDecisionValidation ?? saveDecisionValidationService
  return saveResponse(await save(payload))
}

export async function GET(request: Request): Promise<Response> {
  return handleDecisionValidationGet(request)
}

export async function POST(request: Request): Promise<Response> {
  return handleDecisionValidationPost(request)
}
