import Link from 'next/link'
import { AuthGuard } from '@/lib/components/AuthGuard'
import PersonalNavigation from '@/lib/components/PersonalNavigation'
import { listAirtableDecisionRecords } from '@/lib/repositories/airtable-decisions'

function shortText(value: string | null, fallback: string) {
  if (!value) return fallback
  return value.length > 72 ? `${value.slice(0, 72)}…` : value
}

export default async function Home() {
  const recent = await listAirtableDecisionRecords(3)

  return (
    <AuthGuard>
      <main className="min-h-dvh bg-[#0B1220] text-[#E6ECF5] pb-24">
        <div className="mx-auto w-full max-w-lg px-4 py-6 space-y-5">
          <header>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#D4AF37]">IKEDA PERSONAL OS</p>
            <h1 className="mt-2 text-2xl font-bold">池田航一｜美容師OS</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#8B94A7]">
              サロンワークから判断を残し、次回来店・Knowledge・発信・経営へ学習をつなげる。
            </p>
          </header>

          <section className="rounded-3xl border border-[#D4AF37]/25 bg-[#111A2B] p-5">
            <p className="text-xs font-bold text-[#D4AF37]">今いちばん大事なこと</p>
            <h2 className="mt-2 text-xl font-bold">Decisionを3分以内で残す</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9AA4B7]">
              機能を増やすより、現場で判断を残すほど本当に学習が深くなるかを検証する。
            </p>
            <Link
              href="/decision-input"
              className="mt-5 flex min-h-[58px] w-full items-center justify-center rounded-2xl bg-[#D4AF37] px-5 text-base font-bold text-black active:scale-[0.99]"
            >
              Decisionを記録する
            </Link>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#111A2B] p-4">
              <p className="text-xs text-[#7F8AA0]">現在フェーズ</p>
              <p className="mt-2 font-bold">ホップ</p>
              <p className="mt-1 text-xs leading-relaxed text-[#9AA4B7]">観察・記録・小さな実験・勝ち筋の発見</p>
            </div>
            <Link href="/project" className="rounded-2xl border border-white/10 bg-[#111A2B] p-4 active:scale-[0.99]">
              <p className="text-xs text-[#7F8AA0]">最上位目標</p>
              <p className="mt-2 font-bold">月間技術売上130万円</p>
              <p className="mt-1 text-xs leading-relaxed text-[#9AA4B7]">9:00〜18:00と家族時間を守って安定達成</p>
            </Link>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111A2B] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#7F8AA0]">Learning Stream</p>
                <h2 className="mt-1 text-lg font-bold">直近のDecision</h2>
              </div>
              <Link href="/decisions" className="text-sm font-semibold text-[#D4AF37]">すべて見る →</Link>
            </div>

            {recent.error ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#0B1220] p-4 text-sm text-[#8B94A7]">
                Decisionを読み込めませんでした。記録機能には影響ありません。
              </div>
            ) : recent.data.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#0B1220] p-4 text-sm text-[#8B94A7]">
                まだDecisionがありません。最初の1件を残してください。
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {recent.data.map((decision) => (
                  <article key={decision.id} className="rounded-2xl border border-white/10 bg-[#0B1220] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs text-[#7F8AA0]">{decision.title || 'Decision記録'}</p>
                      {decision.status && (
                        <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-[10px] text-[#AEB7C8]">
                          {decision.status}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-relaxed">
                      {shortText(decision.values.consultationConcern, '相談未入力')}
                    </p>
                    <div className="mt-3 border-l-2 border-[#D4AF37]/50 pl-3">
                      <p className="text-[11px] text-[#7F8AA0]">今回の判断</p>
                      <p className="mt-1 text-sm leading-relaxed text-[#C9D1DE]">
                        {shortText(decision.values.chosenDecision, '未入力')}
                      </p>
                    </div>
                    <div className="mt-3 border-l-2 border-emerald-400/40 pl-3">
                      <p className="text-[11px] text-[#7F8AA0]">次回確認</p>
                      <p className="mt-1 text-sm leading-relaxed text-[#C9D1DE]">
                        {shortText(decision.values.nextObservation, '未入力')}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111A2B] p-4">
            <p className="text-xs text-[#7F8AA0]">OSの判断基準</p>
            <p className="mt-2 text-sm leading-relaxed text-[#C9D1DE]">
              何をするかより先に、何が必要かを判断する。事実と仮説を分け、選んだことだけでなく、しなかったことと次回観察を残す。
            </p>
          </section>
        </div>
        <PersonalNavigation />
      </main>
    </AuthGuard>
  )
}
