import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import { EditorialPage, QuietPanel, SectionLabel } from '@/lib/components/EditorialPage'
import { getServerUser } from '@/lib/auth/server-user'
import { listContentRegistryItems } from '@/lib/repositories/content-registry'
import {
  buildContentSourceStatusModel,
  getContentBodyRoute,
  normalizeContentSourceStatusFilter,
} from '@/lib/services/content-source'
import type {
  BodySyncStatus,
  ContentAccount,
  ContentRegistryItem,
  ContentSourceStatusFilter,
} from '@/lib/types/content-source'

export const metadata: Metadata = {
  title: 'Content Intelligence | 池田航一｜美容師OS',
  description: '公開コンテンツの本文正本と同期状態を確認する',
}

const statusLabel: Record<BodySyncStatus, string> = {
  BODY_SOURCE_MISSING: 'BODY SOURCE MISSING',
  SOURCE_CAPTURED: 'SOURCE CAPTURED',
  MATCHED: 'MATCHED',
  DRAFT_UPDATED: 'DRAFT UPDATED',
  APPROVED: 'APPROVED',
  APPLIED: 'APPLIED',
  SYNC_DRIFT: 'SYNC DRIFT',
}

const accountLabel: Record<ContentAccount, string> = {
  customer: '顧客向け',
  professional: '業界向け',
  unknown: '未分類',
}

const filters: Array<{ value: ContentSourceStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'BODY_SOURCE_MISSING', label: 'Missing' },
  { value: 'SOURCE_CAPTURED', label: 'Captured' },
  { value: 'SYNC_DRIFT', label: 'Drift' },
]

function StatusPill({ status }: { status: BodySyncStatus }) {
  const tone = status === 'BODY_SOURCE_MISSING' || status === 'SYNC_DRIFT'
    ? 'border-[var(--danger)]/25 bg-[var(--danger)]/10 text-[var(--danger)]'
    : status === 'SOURCE_CAPTURED' || status === 'DRAFT_UPDATED'
      ? 'border-[var(--gold)]/30 bg-[var(--gold-soft)] text-[var(--gold)]'
      : 'border-[var(--line)] bg-[var(--paper-soft)] text-[var(--muted)]'

  return (
    <span className={`shrink-0 border px-2.5 py-1 text-[10px] font-medium ${tone}`}>
      {statusLabel[status]}
    </span>
  )
}

function FilterLink({
  value,
  label,
  active,
}: {
  value: ContentSourceStatusFilter
  label: string
  active: boolean
}) {
  const href = value === 'all' ? '/content-intelligence' : `/content-intelligence?status=${value}`

  return (
    <Link
      href={href}
      className={`min-h-[40px] border px-3 py-2 text-xs ${
        active
          ? 'border-[var(--charcoal)] bg-[var(--charcoal)] text-[var(--paper-soft)]'
          : 'border-[var(--line)] bg-[var(--paper-soft)] text-[var(--muted)]'
      }`}
    >
      {label}
    </Link>
  )
}

function BodySourceLabel({ item }: { item: ContentRegistryItem }) {
  if (!item.canonicalBodySource) return <span>未接続</span>

  const source = item.canonicalBodySource
  if (source.documentUrl) {
    return (
      <a
        href={source.documentUrl}
        className="underline decoration-[var(--line)] underline-offset-4"
        target="_blank"
        rel="noreferrer"
      >
        Google Doc
      </a>
    )
  }

  return <span>{source.sourceType}</span>
}

function ContentItemRow({ item }: { item: ContentRegistryItem }) {
  return (
    <article className="border-b border-[var(--line)] py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-[var(--muted)]">{accountLabel[item.account]}</p>
          <h3 className="mt-1 font-medium leading-7">{item.title}</h3>
        </div>
        <StatusPill status={item.bodySyncStatus} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm leading-7 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] text-[var(--muted)]">Public URL</dt>
          <dd className="text-[var(--ink-soft)]">
            {item.publicUrl ? (
              <a
                href={item.publicUrl}
                className="underline decoration-[var(--line)] underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                公開URL
              </a>
            ) : '未接続'}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-[var(--muted)]">Body Source</dt>
          <dd className="text-[var(--ink-soft)]"><BodySourceLabel item={item} /></dd>
        </div>
        <div>
          <dt className="text-[11px] text-[var(--muted)]">Related Knowledge</dt>
          <dd className="text-[var(--ink-soft)]">
            {item.relatedKnowledgeIds.length > 0 ? item.relatedKnowledgeIds.join(' / ') : '未接続'}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-[var(--muted)]">Monetization</dt>
          <dd className="text-[var(--ink-soft)]">{item.monetization}</dd>
        </div>
      </dl>

    </article>
  )
}

function ContentSection({
  title,
  items,
}: {
  title: string
  items: readonly ContentRegistryItem[]
}) {
  return (
    <section>
      <div className="border-b border-[var(--line)] pb-4">
        <SectionLabel>{title}</SectionLabel>
        <h2 className="mt-2 text-2xl font-medium">{items.length}件</h2>
      </div>
      {items.length === 0 ? (
        <div className="border-b border-[var(--line)] py-5 text-sm leading-7 text-[var(--muted)]">
          該当するContent Sourceはありません。
        </div>
      ) : (
        <div>
          {items.map((item) => (
            <ContentItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}

export default async function ContentIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>
}) {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const filter = normalizeContentSourceStatusFilter(params.status)
  const result = await listContentRegistryItems()
  const model = buildContentSourceStatusModel({
    items: result.data,
    source: result.source,
    filter,
    error: result.error,
  })
  const customerRoute = getContentBodyRoute('customer')
  const professionalRoute = getContentBodyRoute('professional')

  return (
    <AuthGuard>
      <EditorialPage containerClassName="space-y-8">
        <header className="border-b border-[var(--line)] pb-5">
          <SectionLabel>Content Intelligence</SectionLabel>
          <h1 className="mt-2 text-[34px] font-medium leading-tight">Source Status</h1>
          <p className="mt-3 max-w-[36rem] text-sm leading-7 text-[var(--muted)]">
            記事本文の正本と公開側の同期状態だけを確認する。
          </p>
        </header>

        <section className="grid grid-cols-3 border-y border-[var(--line)] text-sm">
          <div className="py-4 pr-3">
            <p className="text-[11px] text-[var(--muted)]">Registry</p>
            <p className="mt-2 font-medium">{model.items.length}件</p>
          </div>
          <div className="border-l border-[var(--line)] px-3 py-4">
            <p className="text-[11px] text-[var(--muted)]">Missing</p>
            <p className="mt-2 font-medium">{model.counts.BODY_SOURCE_MISSING}件</p>
          </div>
          <div className="border-l border-[var(--line)] py-4 pl-3">
            <p className="text-[11px] text-[var(--muted)]">Source Attention</p>
            <p className="mt-2 font-medium">{model.sourceAttentionCount}件</p>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <FilterLink
              key={item.value}
              value={item.value}
              label={item.label}
              active={model.filter === item.value}
            />
          ))}
        </div>

        {model.error ? (
          <QuietPanel>
            <SectionLabel>Source</SectionLabel>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Google Sheets adapter未接続。正本台帳は変更していません。
            </p>
            <dl className="mt-4 space-y-2 text-xs leading-6 text-[var(--muted)]">
              <div>
                <dt>Spreadsheet</dt>
                <dd>{model.source.spreadsheetId}</dd>
              </div>
              <div>
                <dt>Tab</dt>
                <dd>{model.source.sheetName}</dd>
              </div>
            </dl>
          </QuietPanel>
        ) : null}

        <QuietPanel>
          <SectionLabel>Drive Routing</SectionLabel>
          <dl className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
            <div>
              <dt className="text-[11px] text-[var(--muted)]">顧客向け</dt>
              <dd>{customerRoute.folderName}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[var(--muted)]">業界向け</dt>
              <dd>{professionalRoute.folderName}</dd>
            </div>
          </dl>
        </QuietPanel>

        <ContentSection title="Customer" items={model.customerItems} />
        <ContentSection title="Professional" items={model.professionalItems} />
        <ContentSection title="Unroutable" items={model.unknownItems} />

        <section className="space-y-2 text-xs leading-6 text-[var(--muted)]">
          <p>note公開・有料切替・本文編集・商品化判定はこの画面では実行しません。</p>
          <p>BODY_SOURCE_MISSING / SYNC_DRIFT だけをSource attentionとして扱います。</p>
        </section>
      </EditorialPage>
    </AuthGuard>
  )
}
