import type { EvidenceRef } from '@/lib/types/ai-operations'

export type ContentAccount = 'customer' | 'professional'

export type BodySyncStatus =
  | 'BODY_SOURCE_MISSING'
  | 'SOURCE_CAPTURED'
  | 'MATCHED'
  | 'DRAFT_UPDATED'
  | 'APPROVED'
  | 'APPLIED'
  | 'SYNC_DRIFT'

export type ContentMonetization = 'FREE' | 'PAID' | 'UNKNOWN'

export type CanonicalBodyProvider = 'GOOGLE_DRIVE'

export type CanonicalBodySourceType = 'GOOGLE_DOC' | 'UNKNOWN'

export type CanonicalBodySource = {
  provider: CanonicalBodyProvider
  documentId: string | null
  documentUrl: string | null
  folderId: string | null
  sourceType: CanonicalBodySourceType
  lastVerifiedAt: string | null
}

export type EvidenceState =
  | 'VERIFIED'
  | 'SOURCE_MISSING'
  | 'ESTIMATE'
  | 'CONTRADICTED'
  | 'RETIRED'

export type ContentProductizationGate = {
  state: 'HOLD' | 'REVIEW_CANDIDATE'
  reason: string
}

export type ContentRegistryItem = {
  id: string
  title: string
  publicUrl: string | null
  account: ContentAccount
  role: string | null
  relatedCaseIds: readonly string[]
  relatedKnowledgeIds: readonly string[]
  canonicalBodySource: CanonicalBodySource | null
  bodySyncStatus: BodySyncStatus
  monetization: ContentMonetization
  evidenceState: EvidenceState | null
  evidenceRefs: readonly EvidenceRef[]
  productizationGate: ContentProductizationGate
  updatedAt: string | null
}

export type ContentBodyRoute = {
  account: ContentAccount
  folderId: string
  folderName: string
  templateDocumentId: string
  assetFolderId: string
}

export type ContentRegistrySource = {
  provider: 'GOOGLE_SHEETS'
  spreadsheetId: string
  sheetName: string
}

export type ContentRegistryReadResult = {
  data: readonly ContentRegistryItem[]
  source: ContentRegistrySource
  error: 'adapter_not_configured' | 'read_failed' | null
}

export type ContentRegistryRow = Record<string, string | null | undefined>

export type SourceAcquisitionRequest = {
  item: ContentRegistryItem
  route: ContentBodyRoute
  proposedTitle?: string | null
}

export type SourceAcquisitionResult =
  | {
      status: 'SOURCE_CAPTURED'
      canonicalBodySource: CanonicalBodySource
    }
  | {
      status: 'SOURCE_UNAVAILABLE'
      reason: string
    }
  | {
      status: 'HUMAN_REQUIRED'
      reason: string
    }

export type BodySyncStatusInput = {
  publicUrl: string | null
  canonicalBodySource: CanonicalBodySource | null
  currentStatus?: BodySyncStatus | null
  publicFingerprint?: string | null
  canonicalFingerprint?: string | null
}

export type BodySyncStatusResult = {
  status: BodySyncStatus
  reasons: readonly string[]
}

export type ContentSourceStatusFilter =
  | 'all'
  | 'BODY_SOURCE_MISSING'
  | 'SOURCE_CAPTURED'
  | 'SYNC_DRIFT'

export type ContentSourceStatusModel = {
  source: ContentRegistrySource
  items: readonly ContentRegistryItem[]
  customerItems: readonly ContentRegistryItem[]
  professionalItems: readonly ContentRegistryItem[]
  counts: Record<BodySyncStatus, number>
  humanRequiredCount: number
  filter: ContentSourceStatusFilter
  error: ContentRegistryReadResult['error']
}
