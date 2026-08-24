import { timingSafeEqual } from 'node:crypto'
import {
  listOpenDecisionValidations,
  saveDecisionValidation,
  type DecisionValidationInput,
} from '@/lib/services/decision-validation'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 16 * 1024

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status })
}

function readBearerToken(request: Request): string | null {
  const match = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

function compareTokens(actual: string, expected: string): boolean {
  const a = Buffer.from(actual)
  const e = Buffer.from(expected)
  const length = Math.max(a.length, e.length)
  const ap = Buffer.alloc(length)
  const ep = Buffer.alloc(length)
  a.copy(ap)
  e.copy(ep)
  return timingSafeEqual(ap, ep) && a.length === e.length
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.DECISION_CAPTURE_API_TOKEN?.trim()
  const actual = readBearerToken(request)
  return Boolean(expected && actual && compareTokens(actual, expected))
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function readPayload(request: Request): Promise<DecisionValidationInput | null> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('application/json')) return null

  const text = await request.text()
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) return null

  try {
    const value = JSON.parse(text)
    if (!isObject(value)) return null
    const allowed = new Set(['decisionId', 'outcomeObserved', 'validationState', 'validationNote'])
    if (!Object.keys(value).every((key) => allowed.has(key))) return null

    return {
      decisionId: value.decisionId,
      outcomeObserved: value.outcomeObserved,
      validationState: value.validationState,
      validationNote: value.validationNote,
    }
  } catch {
    return null
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) return jsonResponse({ success: false, error: 'authentication_error' }, 401)

  const result = await listOpenDecisionValidations()
  if (result.error) {
    return jsonResponse(
      { success: false, error: result.error === 'missing_config' ? 'configuration_error' : 'source_error' },
      result.error === 'missing_config' ? 503 : 502,
    )
  }

  return jsonResponse({ success: true, count: result.data.length, items: result.data }, 200)
}

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorized(request)) return jsonResponse({ success: false, error: 'authentication_error' }, 401)

  const payload = await readPayload(request)
  if (!payload) return jsonResponse({ success: false, error: 'validation_error' }, 400)

  const result = await saveDecisionValidation(payload)
  if (result.ok) {
    return jsonResponse({
      success: true,
      saved: true,
      decisionId: result.decisionId,
      validationState: result.validationState,
    }, 200)
  }

  const statusByError = {
    invalid_input: 400,
    missing_config: 503,
    not_found: 404,
    not_real: 422,
    not_open: 409,
    already_validated: 409,
    persistence_failed: 502,
  } as const

  return jsonResponse({ success: false, saved: false, error: result.error }, statusByError[result.error])
}
