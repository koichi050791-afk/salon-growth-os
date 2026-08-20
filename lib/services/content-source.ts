import type {
  BodySyncStatus,
  BodySyncStatusInput,
  BodySyncStatusResult,
  CanonicalBodySource,
  ContentAccount,
  ContentBodyRoute,
  ContentProductizationGate,
  ContentRegistryItem,
  ContentSourceStatusFilter,
  ContentSourceStatusModel,
  EvidenceState,
  SourceAcquisitionRequest,
  SourceAcquisitionResult,
} from '@/lib/types/content-source'

const CUSTOMER_NOTE_FOLDER_ID = '1xYfhLdshQDolyrRkRGXrEeeSyBIm2RLF'
const PROFESSIONAL_NOTE_FOLDER_ID = '1dVYYfDg4qdodGb1NMPfl-gTXXIozwEO0'
const NOTE_ASSET_FOLDER_ID = '1n5Llw0SZEshT__7itrUrV1EBPenxOQyS'
const CUSTOMER_TEMPLATE_DOCUMENT_ID = '1blCn5cEb_EJuaZHUjLnfmXZFd_Woe5ouiL38s4KzS9E'
const PROFESSIONAL_TEMPLATE_DOCUMENT_ID = '1blUfD4Ly24xzhz1JKxIrwsCXcNfwmLe35QBamiBwcd0'

const BODY_SYNC_STATUSES: readonly BodySyncStatus[] = [
  'BODY_SOURCE_MISSING',
  'SOURCE_CAPTURED',
  'MATCHED',
  'DRAFT_UPDATED',
  'APPROVED',
  'APPLIED',
  'SYNC_DRIFT',
]

const FILTER_STATUS_VALUES: readonly BodySyncStatus[] = [
  'BODY_SOURCE_MISSING',
  'SOURCE_CAPTURED',
  'SYNC_DRIFT',
]

type SourceAcquisitionAdapter = (
  request: SourceAcquisitionRequest,
) => Promise<SourceAcquisitionResult>

export function getContentBodyRoute(account: ContentAccount): ContentBodyRoute {
  if (account === 'customer') {
    return {
      account,
      folderId: CUSTOMER_NOTE_FOLDER_ID,
      folderName: '01_顧客向けnote正本',
      templateDocumentId: CUSTOMER_TEMPLATE_DOCUMENT_ID,
      assetFolderId: NOTE_ASSET_FOLDER_ID,
    }
  }

  return {
    account,
    folderId: PROFESSIONAL_NOTE_FOLDER_ID,
    folderName: '02_業界向けnote正本',
    templateDocumentId: PROFESSIONAL_TEMPLATE_DOCUMENT_ID,
    assetFolderId: NOTE_ASSET_FOLDER_ID,
  }
}

export function isBodySyncStatus(value: string | null | undefined): value is BodySyncStatus {
  return BODY_SYNC_STATUSES.includes(value as BodySyncStatus)
}

export function normalizeContentSourceStatusFilter(
  value: string | string[] | undefined,
): ContentSourceStatusFilter {
  const rawValue = Array.isArray(value) ? value[0] : value
  if (rawValue === 'all') return 'all'
  if (FILTER_STATUS_VALUES.includes(rawValue as BodySyncStatus)) {
    return rawValue as ContentSourceStatusFilter
  }
  return 'all'
}

export function detectBodySyncStatus(input: BodySyncStatusInput): BodySyncStatusResult {
  const reasons: string[] = []
  const hasPublicUrl = Boolean(input.publicUrl)
  const hasCanonicalSource = Boolean(input.canonicalBodySource?.documentId || input.canonicalBodySource?.documentUrl)

  if (hasPublicUrl && !hasCanonicalSource) {
    return {
      status: 'BODY_SOURCE_MISSING',
      reasons: ['public_url_exists_without_canonical_body_source'],
    }
  }

  if (!hasCanonicalSource) {
    return {
      status: 'BODY_SOURCE_MISSING',
      reasons: ['canonical_body_source_missing'],
    }
  }

  if (input.publicFingerprint && input.canonicalFingerprint) {
    if (input.publicFingerprint !== input.canonicalFingerprint) {
      return {
        status: 'SYNC_DRIFT',
        reasons: ['public_and_canonical_fingerprints_differ'],
      }
    }

    return {
      status: 'MATCHED',
      reasons: ['public_and_canonical_fingerprints_match'],
    }
  }

  if (input.currentStatus && input.currentStatus !== 'BODY_SOURCE_MISSING') {
    return {
      status: input.currentStatus,
      reasons: ['existing_status_preserved_without_comparable_fingerprints'],
    }
  }

  reasons.push('canonical_body_source_captured_without_public_comparison')
  return { status: 'SOURCE_CAPTURED', reasons }
}

export function buildCanonicalGoogleDocSource(input: {
  documentId?: string | null
  documentUrl?: string | null
  folderId?: string | null
  lastVerifiedAt?: string | null
}): CanonicalBodySource | null {
  const documentId = input.documentId?.trim() || null
  const documentUrl = input.documentUrl?.trim() || null
  const folderId = input.folderId?.trim() || null

  if (!documentId && !documentUrl) return null

  return {
    provider: 'GOOGLE_DRIVE',
    documentId,
    documentUrl,
    folderId,
    sourceType: documentId || documentUrl ? 'GOOGLE_DOC' : 'UNKNOWN',
    lastVerifiedAt: input.lastVerifiedAt?.trim() || null,
  }
}

export function getContentProductizationGate(input: {
  evidenceState: EvidenceState | null
  evidenceRefsCount: number
}): ContentProductizationGate {
  if (input.evidenceState !== 'VERIFIED') {
    return {
      state: 'HOLD',
      reason: 'verified_evidence_required_before_productization',
    }
  }

  if (input.evidenceRefsCount < 2) {
    return {
      state: 'HOLD',
      reason: 'multiple_evidence_refs_required_before_productization',
    }
  }

  return {
    state: 'REVIEW_CANDIDATE',
    reason: 'verified_evidence_available_for_human_review',
  }
}

export async function acquireCanonicalBodySource(
  request: SourceAcquisitionRequest,
  adapter?: SourceAcquisitionAdapter,
): Promise<SourceAcquisitionResult> {
  if (request.item.canonicalBodySource) {
    return {
      status: 'SOURCE_CAPTURED',
      canonicalBodySource: request.item.canonicalBodySource,
    }
  }

  if (!adapter) {
    return {
      status: 'HUMAN_REQUIRED',
      reason: 'google_drive_source_adapter_not_configured',
    }
  }

  try {
    return await adapter(request)
  } catch {
    return {
      status: 'HUMAN_REQUIRED',
      reason: 'source_acquisition_failed_closed',
    }
  }
}

export function applyContentSourceFilter(
  items: readonly ContentRegistryItem[],
  filter: ContentSourceStatusFilter,
): readonly ContentRegistryItem[] {
  if (filter === 'all') return items
  return items.filter((item) => item.bodySyncStatus === filter)
}

export function buildContentSourceStatusModel(input: {
  items: readonly ContentRegistryItem[]
  source: ContentSourceStatusModel['source']
  filter: ContentSourceStatusFilter
  error: ContentSourceStatusModel['error']
}): ContentSourceStatusModel {
  const filteredItems = applyContentSourceFilter(input.items, input.filter)
  const counts = BODY_SYNC_STATUSES.reduce((result, status) => {
    result[status] = input.items.filter((item) => item.bodySyncStatus === status).length
    return result
  }, {} as Record<BodySyncStatus, number>)

  return {
    source: input.source,
    items: filteredItems,
    customerItems: filteredItems.filter((item) => item.account === 'customer'),
    professionalItems: filteredItems.filter((item) => item.account === 'professional'),
    counts,
    humanRequiredCount: input.items.filter((item) =>
      item.bodySyncStatus === 'BODY_SOURCE_MISSING'
      || item.bodySyncStatus === 'SYNC_DRIFT'
      || item.productizationGate.state === 'HOLD',
    ).length,
    filter: input.filter,
    error: input.error,
  }
}
