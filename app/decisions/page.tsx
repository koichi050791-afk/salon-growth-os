import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthGuard } from '@/lib/components/AuthGuard'
import PersonalNavigation from '@/lib/components/PersonalNavigation'
import { listAirtableDecisionRecords, type AirtableDecisionRecord } from '@/lib/repositories/airtable-decisions'

export const metadata: Metadata = {
  title: 'Decision | 池田航一｜美容師OS',
  description: '現場で残したDecisionの時間軸',
}

const TEST_PREFIXES = ['【TEST】', '【VERCEL TEST】', '【PRODUCTION TEST】']

function isTestDecision(decision: AirtableDecisionRecord) {
  const consultation = decision.values.consultationConcern ?? ''
  return TEST_PREFIXES.some((prefix) => consultation.startsWith(prefix))
}

function ValueBlock({ label, value, accent = false }: { label: string; value: string | null; accent?: boolean }) {
  if (!value) return null

  return (
    <div className={`border-l-2 pl-3 ${accent ? 'border-[#D4AF37]/60' : 'border-white/10'}`}>
      <p className="text-[11px] text-[#7F8AA0]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#CDD5E2]">{value}</p>
    </div>
  )
}

export default async function DecisionsPage() {
  const result = await listAirtableDecisionRecords(30)
  const decisions = result.data.filter((decision) => !isTestDecision(decision))

  return (
    <AuthGuard>
      <main className="min-h-dvh bg-[#0B1220] pb-24 text-[#E6ECF5]">
        <div className="mx-auto w-full max-w-lg px-4 py-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#D4AF37]">LEARNING STREAM</p>
              <h1 className="mt-2 text-2xl font-bold">Decision</h1>
              <p className="mt-2 text-sm leading-relaxed text-[#8B94A7]">何を選び、何を選ばず、次に何を見るかの時間軸。</p>
            </div>
            <Link
              href="/decision-input"
              className="shrink-0 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-black"
            >
              ＋ 記録
            </Link>
          </header>

          {result.error ? (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              AirtableからDecisionを読み込めませんでした。記録機能には影響ありません。
            </div>
          ) : decisions.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-[#111A2B] p-6 text-center">
              <p className="text-sm text-[#8B94A7]">実運用のDecisionはまだありません。</p>
              <Link href="/decision-input" className="mt-4 inline-flex rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black">
                最初のDecisionを残す
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {decisions.map((decision) => (
                <article key={decision.id} className="rounded-3xl border border-white/10 bg-[#111A2B] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-[#7F8AA0]">{decision.title || 'Decision記録'}</p>
                    {decision.status && (
                      <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-[#AEB7C8]">
                        {decision.status}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-4">
                    <ValueBlock label="相談" value={decision.values.consultationConcern} />
                    <ValueBlock label="確認した事実" value={decision.values.customerTruth} />
                    <ValueBlock label="今回の判断" value={decision.values.chosenDecision} accent />
                    <ValueBlock label="あえてしなかったこと" value={decision.values.notChosen} />
                    <ValueBlock label="次回確認" value={decision.values.nextObservation} accent />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <PersonalNavigation />
      </main>
    </AuthGuard>
  )
}
