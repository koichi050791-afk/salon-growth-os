import { timingSafeEqual } from 'node:crypto'
import {
  saveDecisionCapture as saveDecisionCaptureService,
  type DecisionCaptureSaveFields,
  type SaveDecisionCaptureResult,
} from '@/lib/services/decision-capture-save'
import type {
  DecisionCaptureSource,
} from '@/lib/types/decision'
import type { EvidenceRef, WorkGraphSource } from '@/lib/types/ai-operations'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 16 * 1024
const MAX_FIELD_CHARS = 2_000
const MAX_SOURCE_REFS = 5
const MAX_SOURCE_REF_TEXT_CHARS = 500

const API_FIELDS = [
  'consultationConcern',
  'customerTruth',
  'chosenDecision',
  'notChosen',
  'nextObservation',
  'professionalHypothesis',
  'treatmentAction',
  'notChosenReason',
] as const

const TOP_LEVEL_KEYS = ['source', 'fields', 'sourceRefs'] as const
const CAPTURE_SOURCES: readonly DecisionCaptureSource[] = [
  'DECISION_INPUT',
  'CHATGPT',
  'API',
  'UNKNOWN',
]
const WORK_GRAPH_SOURCES: readonly WorkGraphSource[] = [
  'airtable',
  'drive',
  'notion',
  'github',
  'internal',
  'chatgpt',
]
const SOURCE_REF_KEYS = [
  'id',
  'source',
  'label',
  'recordId',
  'field',
  'observedAt',
  'url',
] as const

type ApiFieldKey = typeof API_FIELDS[number]
type ApiPayload = {
  source: DecisionCaptureSource
  fields: DecisionCaptureSaveFields
  sourceRefs: readonly EvidenceRef[]
}
type ApiValidationResult =
  | { ok: true; payload: ApiPayload }
  | { ok: false; status: number; code: string }
type AuthDiagnostics = {
  authorizationHeaderPresent: boolean
  bearerTokenPresent: boolean
  expectedTokenConfigured: boolean
  actualTokenLength: number | null
  expectedTokenLength: number | null
  tokenLengthMatches: boolean
  authResult: 'PASS' | 'FAIL'
}
type HandleDecisionCapturePostDependencies = {
  saveDecisionCapture?: typeof saveDecisionCaptureService
  logAuthDiagnostics?: (diagnostics: AuthDiagnostics) => void
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status })
}

function unauthorized(): Response {
  return jsonResponse({ success: false, error: 'authentication_error' }, 401)
}

function validationError(code: string, status = 400): Response {
  return jsonResponse({ success: false, error: 'validation_error', code }, status)
}

function readBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  const match = header?.match(/^Bearer\s+(.+)$/i)
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
  const matched = timingSafeEqual(actualPadded, expectedPadded)
  return matched && actualBuffer.length === expectedBuffer.length
}

function buildAuthDiagnostics(request: Request): AuthDiagnostics {
  const expected = process.env.DECISION_CAPTURE_API_TOKEN?.trim()
  const authorizationHeaderPresent = request.headers.has('authorization')
  const actual = readBearerToken(request)
  const expectedTokenConfigured = Boolean(expected)
  const actualTokenLength = actual?.length ?? null
  const expectedTokenLength = expected?.length ?? null
  const tokenLengthMatches = (
    actualTokenLength !== null
    && expectedTokenLength !== null
    && actualTokenLength === expectedTokenLength
  )
  const authResult = expected && actual && compareTokens(actual, expected) ? 'PASS' : 'FAIL'

  return {
    authorizationHeaderPresent,
    bearerTokenPresent: Boolean(actual),
    expectedTokenConfigured,
    actualTokenLength,
    expectedTokenLength,
    tokenLengthMatches,
    authResult,
  }
}

function shouldLogPreviewAuthDiagnostics(): boolean {
  return process.env.VERCEL_ENV === 'preview'
}

function logPreviewAuthDiagnostics(
  diagnostics: AuthDiagnostics,
  logger: (diagnostics: AuthDiagnostics) => void,
) {
  if (!shouldLogPreviewAuthDiagnostics()) return
  logger(diagnostics)
}

function isAuthorized(diagnostics: AuthDiagnostics): boolean {
  return diagnostics.authResult === 'PASS'
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAllowedKey(value: string, allowedKeys: readonly string[]): boolean {
  return allowedKeys.includes(value)
}

function validateTextValue(value: unknown): value is string | null | undefined {
  if (value === null || typeof value === 'undefined') return true
  if (typeof value !== 'string') return false
  return value.length <= MAX_FIELD_CHARS
}

function parseSource(value: unknown): DecisionCaptureSource | null {
  if (typeof value === 'undefined') return 'API'
  if (typeof value !== 'string') return null
  return CAPTURE_SOURCES.includes(value as DecisionCaptureSource)
    ? value as DecisionCaptureSource
    : null
}

function parseFieldValues(value: unknown): DecisionCaptureSaveFields | null {
  if (!isObject(value)) return null
  const fieldKeys = Object.keys(value)
  if (!fieldKeys.every((key) => isAllowedKey(key, API_FIELDS))) return null

  const fields: DecisionCaptureSaveFields = {}
  for (const key of fieldKeys) {
    const fieldValue = value[key]
    if (!validateTextValue(fieldValue)) return null
    fields[key as ApiFieldKey] = fieldValue
  }

  return fields
}

function parseOptionalString(value: unknown): string | null | undefined {
  if (typeof value === 'undefined' || value === null) return null
  return typeof value === 'string' && value.length <= MAX_SOURCE_REF_TEXT_CHARS
    ? value
    : undefined
}

function parseSourceRef(value: unknown): EvidenceRef | null {
  if (!isObject(value)) return null
  if (!Object.keys(value).every((key) => isAllowedKey(key, SOURCE_REF_KEYS))) return null

  const { id, source, label } = value
  if (
    typeof id !== 'string'
    || id.length > MAX_SOURCE_REF_TEXT_CHARS
    || typeof source !== 'string'
    || !WORK_GRAPH_SOURCES.includes(source as WorkGraphSource)
    || typeof label !== 'string'
    || label.length > MAX_SOURCE_REF_TEXT_CHARS
  ) {
    return null
  }

  const recordId = parseOptionalString(value.recordId)
  const field = parseOptionalString(value.field)
  const observedAt = parseOptionalString(value.observedAt)
  const url = parseOptionalString(value.url)
  if (
    typeof recordId === 'undefined'
    || typeof field === 'undefined'
    || typeof observedAt === 'undefined'
    || typeof url === 'undefined'
  ) {
    return null
  }

  return {
    id,
    source: source as WorkGraphSource,
    label,
    recordId,
    field,
    observedAt,
    url,
  }
}

function parseSourceRefs(value: unknown): readonly EvidenceRef[] | null {
  if (typeof value === 'undefined') return []
  if (!Array.isArray(value) || value.length > MAX_SOURCE_REFS) return null

  const refs = value.map(parseSourceRef)
  return refs.every((ref): ref is EvidenceRef => ref !== null) ? refs : null
}

function validatePayload(value: unknown): ApiValidationResult {
  if (!isObject(value)) return { ok: false, status: 400, code: 'INVALID_PAYLOAD' }
  if (!Object.keys(value).every((key) => isAllowedKey(key, TOP_LEVEL_KEYS))) {
    return { ok: false, status: 400, code: 'INVALID_PAYLOAD' }
  }

  const source = parseSource(value.source)
  const fields = parseFieldValues(value.fields)
  const sourceRefs = parseSourceRefs(value.sourceRefs)
  if (!source || !fields || !sourceRefs) {
    return { ok: false, status: 400, code: 'INVALID_PAYLOAD' }
  }

  return {
    ok: true,
    payload: {
      source,
      fields,
      sourceRefs,
    },
  }
}

async function parseJsonRequest(request: Request): Promise<ApiValidationResult> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('application/json')) {
    return { ok: false, status: 415, code: 'JSON_REQUIRED' }
  }

  const text = await request.text()
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) {
    return { ok: false, status: 413, code: 'PAYLOAD_TOO_LARGE' }
  }

  try {
    return validatePayload(JSON.parse(text))
  } catch {
    return { ok: false, status: 400, code: 'MALFORMED_JSON' }
  }
}

function successResponse(result: Extract<SaveDecisionCaptureResult, { ok: true }>): Response {
  return jsonResponse({
    success: true,
    saved: true,
    decisionId: result.decisionId,
    savedAt: result.savedAt,
    downstream: result.downstream,
    warnings: result.warnings,
  }, 201)
}

function persistenceErrorResponse(result: Extract<SaveDecisionCaptureResult, { ok: false }>): Response {
  return jsonResponse({
    success: false,
    saved: false,
    error: result.error === 'missing_config' ? 'configuration_error' : 'persistence_error',
  }, result.error === 'missing_config' ? 503 : 502)
}

export async function handleDecisionCapturePost(
  request: Request,
  dependencies: HandleDecisionCapturePostDependencies = {},
): Promise<Response> {
  const authDiagnostics = buildAuthDiagnostics(request)
  logPreviewAuthDiagnostics(
    authDiagnostics,
    dependencies.logAuthDiagnostics ?? ((diagnostics) => {
      console.info('decision_capture_auth_diagnostics', diagnostics)
    }),
  )

  if (!isAuthorized(authDiagnostics)) {
    return unauthorized()
  }

  const parsed = await parseJsonRequest(request)
  if (!parsed.ok) {
    return validationError(parsed.code, parsed.status)
  }

  const save = dependencies.saveDecisionCapture ?? saveDecisionCaptureService
  const result = await save({
    source: parsed.payload.source,
    fields: parsed.payload.fields,
    sourceRefs: parsed.payload.sourceRefs,
  })

  return result.ok ? successResponse(result) : persistenceErrorResponse(result)
}

export async function POST(request: Request): Promise<Response> {
  return handleDecisionCapturePost(request)
}
