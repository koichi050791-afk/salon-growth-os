import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import { EditorialPage, QuietPanel, SectionLabel } from '@/lib/components/EditorialPage'
import { getServerUser } from '@/lib/auth/server-user'
import { listAirtableDecisionRecords } from '@/lib/repositories/airtable-decisions'
import { listCustomerGrowthRecords } from '@/lib/repositories/airtable-customer-growth'
import { listContentRegistryItems } from '@/lib/repositories/content-registry'
import {
  googleSheetsContentRegistryReader,
  isGoogleSheetsContentRegistryReaderConfigured,
} from '@/lib/repositories/google-sheets-content-registry'
import { buildRevenueIntelligenceProjection } from '@/lib/services/revenue-intelligence'
import type {
  RevenueSignal,
  RevenueSourceCoverage,
  RevenueSourceCoverageStatus,
} from '@/lib/types/revenue-intelligence'

export const metadata: Metadata = {
  title: 'Revenue Intelligence | 池田航一｜美容師OS',
  description: 'REAL Evidenceから経済価値の兆候だけを読み取る',
}

export const runtime = 'nodejs'

const coverageStatusLabel: Record<RevenueSourceCoverageStatus, string> = {
  CONNECTED: 'Connected',
  NOT_CONNECTED: 'Not Connected',
  ERROR: 'Error',
}

function formatObservedAt(value: string | null): string {
  if (!value) return '未確認'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function CountBlock({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-t border-[var(--line)] py-4 pr-3">
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-medium">{value}</p>
    </div>
  )
}

function SignalRow({ signal }: { signal: RevenueSignal }) {
  return (
    <article className="border-b border-[var(--line)] py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-[var(--muted)]">{signal.sourceType}</p>
          <h3 className="mt-1 font-medium leading-7">{signal.signalType}</h3>
        </div>
        <span className="border border-[var(--line)] px-2.5 py-1 text-[10px] text-[var(--muted)]">
          {signal.status}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-xs leading-6 sm:grid-cols-3">
        <div>
          <dt className="text-[var(--muted)]">Confidence</dt>
          <dd className="mt-1 text-[var(--ink-soft)]">{signal.confidence}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Evidence</dt>
          <dd className="mt-1 text-[var(--ink-soft)]">
            {signal.evidenceClass} / {signal.evidenceRefs.length}件
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Observed At</dt>
          <dd className="mt-1 text-[var(--ink-soft)]">{formatObservedAt(signal.observedAt)}</dd>
        </div>
      </dl>
    </article>
  )
}

function CoverageRow({ coverage }: { coverage: RevenueSourceCoverage }) {
  const countLabel = coverage.totalCount === null
    ? '未接続'
    : `${coverage.realCount ?? 0} / ${coverage.totalCount}`

  return (
    <article className="border-b border-[var(--line)] py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-[var(--muted)]">{coverage.sourceType}</p>
          <h3 className="mt-1 text-sm font-medium">{coverage.label}</h3>
        </div>
        <span className="border border-[var(--line)] px-2.5 py-1 text-[10px] text-[var(--muted)]">
          {coverageStatusLabel[coverage.status]}
        </span>
      </div>
      <dl className="mt-3 grid gap-3 text-xs leading-6 sm:grid-cols-3">
        <div>
          <dt className="text-[var(--muted)]">REAL / Total</dt>
          <dd className="mt-1 text-[var(--ink-soft)]">{countLabel}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Evidence Class</dt>
          <dd className="mt-1 text-[var(--ink-soft)]">{coverage.evidenceClass}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Excluded</dt>
          <dd className="mt-1 text-[var(--ink-soft)]">
            {coverage.sampleTestExcludedCount + coverage.unknownExcludedCount}
          </dd>
        </div>
      </dl>
    </article>
  )
}

export default async function RevenueIntelligencePage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const contentReader = isGoogleSheetsContentRegistryReaderConfigured()
    ? googleSheetsContentRegistryReader
    : undefined
  const [contentRegistry, decisions, customerGrowth] = await Promise.all([
    listContentRegistryItems(contentReader),
    listAirtableDecisionRecords(50),
    listCustomerGrowthRecords(500),
  ])
  const projection = buildRevenueIntelligenceProjection({
    contentRegistry,
    decisions,
    customerGrowth,
  })

  return (
    <AuthGuard>
      <EditorialPage containerClassName="space-y-8">
        <header className="border-b border-[var(--line)] pb-5">
          <SectionLabel>Revenue Intelligence</SectionLabel>
          <h1 className="mt-2 text-[34px] font-medium leading-tight">REAL Evidence Projection</h1>
          <p className="mt-3 max-w-[36rem] text-sm leading-7 text-[var(--muted)]">
            既存Sourceから、経済価値の兆候だけを読み取る。
          </p>
        </header>

        <section className="grid grid-cols-2 border-b border-[var(--line)] sm:grid-cols-4">
          <CountBlock label="REAL Signals" value={projection.realSignalCount} />
          <CountBlock label="Needs Validation" value={projection.needsValidationCount} />
          <CountBlock label="Productization Signal" value={projection.productizationSignalCount} />
          <CountBlock
            label="Source Coverage"
            value={`${projection.sourceCoverage.filter((source) => source.status === 'CONNECTED').length}/${projection.sourceCoverage.length}`}
          />
        </section>

        {projection.errors.length > 0 ? (
          <section className="border border-[var(--danger)]/25 bg-[var(--danger)]/10 p-5 text-sm leading-7 text-[var(--danger)]">
            {projection.errors.join(' / ')}
          </section>
        ) : null}

        <QuietPanel>
          <SectionLabel>Boundary</SectionLabel>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            相談Signalは顧客関心の観測です。売上因果、商品化、価格、営業判断には変換しません。
          </p>
        </QuietPanel>

        <section>
          <div className="border-b border-[var(--line)] pb-4">
            <SectionLabel>Recent Signals</SectionLabel>
            <h2 className="mt-2 text-2xl font-medium">{projection.signals.length}件</h2>
          </div>
          {projection.signals.length === 0 ? (
            <div className="border-b border-[var(--line)] py-7 text-sm leading-7 text-[var(--muted)]">
              REAL Evidenceが蓄積されるとここに価値兆候が表示されます。
            </div>
          ) : (
            <div>
              {projection.signals.map((signal) => (
                <SignalRow key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="border-b border-[var(--line)] pb-4">
            <SectionLabel>Source Coverage</SectionLabel>
            <h2 className="mt-2 text-2xl font-medium">接続状況</h2>
          </div>
          <div>
            {projection.sourceCoverage.map((coverage) => (
              <CoverageRow key={coverage.sourceType} coverage={coverage} />
            ))}
          </div>
        </section>

        {projection.dataQualityNotes.length > 0 ? (
          <QuietPanel>
            <SectionLabel>Data Quality</SectionLabel>
            <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--ink-soft)]">
              {projection.dataQualityNotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </QuietPanel>
        ) : null}
      </EditorialPage>
    </AuthGuard>
  )
}
