import {
  buildCanonicalGoogleDocSource,
  detectBodySyncStatus,
  getContentBodyRoute,
  getContentProductizationGate,
  isBodySyncStatus,
} from '@/lib/services/content-source'
import type { EvidenceRef } from '@/lib/types/ai-operations'
import type {
  ContentAccount,
  ContentMonetization,
  ContentRegistryItem,
  ContentRegistryReadResult,
  ContentRegistryRow,
  ContentRegistrySource,
  EvidenceState,
} from '@/lib/types/content-source'

export type ContentRegistryReader = () => Promise<readonly ContentRegistryRow[]>

export const CONTENT_REGISTRY_SOURCE: ContentRegistrySource = {
  provider: 'GOOGLE_SHEETS',
  spreadsheetId: '1edIhDrQ-cZFB6_QvX1nOD29MBLKgQ5RvE55s_sra3G0',
  sheetName: '公開コンテンツ接続',
}

const EVIDENCE_STATES: readonly EvidenceState[] = [
  'VERIFIED',
  'SOURCE_MISSING',
  'ESTIMATE',
  'CONTRADICTED',
  'RETIRED',
]

function stableHash(value: string): string {
  let hash = 5381

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}

function readCell(row: ContentRegistryRow, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = row[key]?.trim()
    if (value) return value
  }

  return null
}

function parseList(value: string | null): readonly string[] {
  if (!value) return []

  return value
    .split(/[\n,、/]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseContentAccount(value: string | null): ContentAccount {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'professional' || normalized === 'industry' || normalized?.includes('業界')) {
    return 'professional'
  }

  return 'customer'
}

function parseMonetization(value: string | null): ContentMonetization {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'FREE' || normalized === 'PAID') return normalized
  return 'UNKNOWN'
}

function parseEvidenceState(value: string | null): EvidenceState | null {
  const normalized = value?.trim().toUpperCase()
  return EVIDENCE_STATES.includes(normalized as EvidenceState)
    ? normalized as EvidenceState
    : null
}

function parseGoogleDocumentId(value: string | null): string | null {
  if (!value) return null
  const match = value.match(/\/document\/d\/([^/]+)/)
  return match?.[1] ?? value
}

function buildEvidenceRefs(row: ContentRegistryRow): readonly EvidenceRef[] {
  return parseList(readCell(row, ['Evidence Refs', 'EvidenceRefs', 'Evidence', '根拠', 'Evidence Provenance']))
    .map((label) => ({
      id: `content_evidence_${stableHash(label)}`,
      source: 'drive',
      label,
    }))
}

export function normalizeContentRegistryRow(
  row: ContentRegistryRow,
  index: number,
): ContentRegistryItem {
  const title = readCell(row, ['Title', '記事タイトル', 'タイトル']) ?? `Untitled content ${index + 1}`
  const publicUrl = readCell(row, ['Public URL', 'PublicUrl', '公開URL', 'note URL'])
  const account = parseContentAccount(readCell(row, ['Account', 'アカウント']))
  const route = getContentBodyRoute(account)
  const canonicalBodyValue = readCell(row, ['Canonical Body Source', 'CanonicalBodySource', '本文正本'])
  const documentUrl = canonicalBodyValue?.startsWith('http') ? canonicalBodyValue : readCell(row, ['Document URL', 'Google Doc URL'])
  const documentId = readCell(row, ['Document ID', 'Google Doc ID'])
    ?? parseGoogleDocumentId(documentUrl)
    ?? (canonicalBodyValue && !canonicalBodyValue.startsWith('http') ? canonicalBodyValue : null)
  const canonicalBodySource = buildCanonicalGoogleDocSource({
    documentId,
    documentUrl,
    folderId: readCell(row, ['Folder ID', 'Google Drive Folder ID']) ?? route.folderId,
    lastVerifiedAt: readCell(row, ['Last Verified At', 'lastVerifiedAt', '最終確認']),
  })
  const rawStatus = readCell(row, ['Body Sync Status', 'BodySyncStatus', '同期状態'])
  const currentStatus = isBodySyncStatus(rawStatus) ? rawStatus : null
  const bodySyncStatus = detectBodySyncStatus({
    publicUrl,
    canonicalBodySource,
    currentStatus,
    publicFingerprint: readCell(row, ['Public Fingerprint', '公開Fingerprint']),
    canonicalFingerprint: readCell(row, ['Canonical Fingerprint', '正本Fingerprint']),
  }).status
  const evidenceRefs = buildEvidenceRefs(row)
  const evidenceState = parseEvidenceState(readCell(row, ['Evidence State', 'EvidenceState', '根拠状態']))

  return {
    id: readCell(row, ['ID', 'Content ID', 'ContentRegistry ID'])
      ?? `content_${stableHash(`${title}:${publicUrl ?? index}`)}`,
    title,
    publicUrl,
    account,
    role: readCell(row, ['Role', '役割']),
    relatedCaseIds: parseList(readCell(row, ['Related Case IDs', 'Related Cases', '関連Case'])),
    relatedKnowledgeIds: parseList(readCell(row, ['Related Knowledge IDs', 'Related Knowledge', '関連Knowledge'])),
    canonicalBodySource,
    bodySyncStatus,
    monetization: parseMonetization(readCell(row, ['Monetization', '収益化'])),
    evidenceState,
    evidenceRefs,
    productizationGate: getContentProductizationGate({
      evidenceState,
      evidenceRefsCount: evidenceRefs.length,
    }),
    updatedAt: readCell(row, ['Updated At', 'updatedAt', '更新日']),
  }
}

export function normalizeContentRegistryRows(
  rows: readonly ContentRegistryRow[],
): readonly ContentRegistryItem[] {
  return rows.map(normalizeContentRegistryRow)
}

export async function listContentRegistryItems(
  reader?: ContentRegistryReader,
): Promise<ContentRegistryReadResult> {
  if (!reader) {
    return {
      data: [],
      source: CONTENT_REGISTRY_SOURCE,
      error: 'adapter_not_configured',
    }
  }

  try {
    return {
      data: normalizeContentRegistryRows(await reader()),
      source: CONTENT_REGISTRY_SOURCE,
      error: null,
    }
  } catch {
    return {
      data: [],
      source: CONTENT_REGISTRY_SOURCE,
      error: 'read_failed',
    }
  }
}
