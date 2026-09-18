'use client'

import { useState } from 'react'

const salesSeries = [
  { date: '9/1', sales: 41100, guests: 3, next: 1 },
  { date: '9/3', sales: 48800, guests: 3, next: 0 },
  { date: '9/4', sales: 30300, guests: 2, next: 1 },
  { date: '9/5', sales: 47800, guests: 4, next: 2 },
  { date: '9/6', sales: 67900, guests: 4, next: 1 },
  { date: '9/8', sales: 14800, guests: 1, next: 0 },
  { date: '9/10', sales: 42100, guests: 4, next: 0 },
]

const smallSteps = [
  {
    no: '01',
    title: '日報を残す',
    detail: '日付・技術売上・客数・次回予約・メニューを自然文で1回。計算・比較・重複確認はAI側。',
  },
  {
    no: '02',
    title: '判断価値のあるCaseだけ残す',
    detail: '全施術は記録しない。「なぜした／なぜしなかった／次回何を見る」があるCaseだけ。',
  },
  {
    no: '03',
    title: '新規が来た理由を拾う',
    detail: '何で知ったか、何を見たか、何が決め手だったか。実来店と検索・note・Webをつなぐ。',
  },
  {
    no: '04',
    title: '週1回だけ振り返る',
    detail: '毎日分析しすぎない。変化、継続、停止、次に見ることだけを短く確認する。',
  },
] as const

const phases = [
  ['01', 'AI利用', '単発作業をAIへ渡す'],
  ['02', '事業OS', '正本・権限・Workflowを整える'],
  ['03', 'Closed Loop', '過去を次の仕事で再利用する'],
  ['04', 'Portable', '会社・場所・AIから切り離せる'],
  ['05', 'Assetization', '反復価値を資産へ変える'],
  ['06', 'Selective Scale', '人を増やさず価値を複製する'],
  ['07', 'Compounding', '時間とともに複利で強くなる'],
  ['08', 'Sovereignty', '続ける・減らす・変えるを選べる'],
  ['09', 'Stewardship', '価値ある知識だけ未来へ渡す'],
  ['10', 'Re-Founding', '必要なら事業を作り直せる'],
  ['11', 'Constitution', '変化しても原則を失わない'],
  ['12', 'Life Portfolio', '事業を人生全体の資本配分へ統合'],
] as const

const humanCore = [
  '顧客との対話・観察',
  '施術判断・技術',
  '顧客心理の最終解釈',
  'ブランド判断',
  'Knowledge正式採用',
  '重要な経営判断',
]

const aiCore = [
  '記録・整理・集計',
  '検索・比較・検査',
  'Case構造化・類似検索',
  '仮説・戦略・優先順位',
  'コンテンツ変換',
  '反復・定型業務',
]

const guardrails = [
  '新しいAI社員・Agentを増やすこと自体を目的にしない。',
  '全Caseを記録しない。判断価値のあるものだけ。',
  '新しいDB・ダッシュボード・管理項目を安易に増やさない。',
  '勤務先BeautyMeritの顧客データを2028事業OSへ接続しない。',
  '単発結果から因果関係やKnowledgeを確定しない。',
  'AIで池田の確認・管理時間が増えるなら、その仕組みは失敗。',
]

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4">
      <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-medium tracking-tight">{value}</p>
      <p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">{note}</p>
    </div>
  )
}

function FlowNode({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2 text-center text-[10px] leading-5 ${accent ? 'border-[var(--green)] bg-[rgba(104,123,99,.08)]' : 'border-[var(--line)] bg-[var(--paper)]'}`}>
      {children}
    </div>
  )
}

export default function CompanyDashboardClient() {
  const [showFuture, setShowFuture] = useState(false)
  const sales = salesSeries.reduce((sum, row) => sum + row.sales, 0)
  const guests = salesSeries.reduce((sum, row) => sum + row.guests, 0)
  const next = salesSeries.reduce((sum, row) => sum + row.next, 0)
  const avg = Math.round(sales / guests)
  const progress = Math.round((sales / 1300000) * 1000) / 10

  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--charcoal)] p-5 text-[var(--paper-soft)] shadow-[0_20px_50px_rgba(36,35,31,.08)] sm:p-7">
        <div className="grid gap-7 xl:grid-cols-[1.35fr_.65fr] xl:items-end">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/50">North Star</p>
            <h2 className="mt-4 max-w-4xl text-[26px] font-medium leading-[1.5] sm:text-[34px]">
              家族との時間を守りながら、池田航一の時間・判断・経験が、本人の労働時間以上の価値と収入を生み続ける事業をつくる。
            </h2>
            <p className="mt-5 max-w-3xl text-[11px] leading-6 text-white/60">
              店舗・AI・SNS・130万円は目的ではない。現在収益と知的資産が同じ仕事から同時に残る構造をつくる。
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/45">Current Position</p>
            <p className="mt-2 text-xl font-medium">観察・記録・小さな実験</p>
            <p className="mt-2 text-[10px] leading-5 text-white/55">今は完成させる時期ではない。勝ち筋を壊さず、実データで再現性を確認する。</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-2xl border border-[var(--green)] bg-[rgba(104,123,99,.07)] p-5">
          <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--green)]">Winning Thesis / 仮説</p>
          <h2 className="mt-3 text-xl font-medium leading-8">相談型ポジショニング × 自前検索資産 × 池田固有の判断力 × 少数高適合顧客 × AIによる経験資産化</h2>
          <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">
            「池田航一」を知らない人が、髪やヘアスタイルの迷いから入り、「自分の場合を相談できる美容師」として池田へ到達する流れを検証する。
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-5">
          <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">Current Experiment</p>
          <h2 className="mt-3 text-xl font-medium">130万円は目的ではなく実験</h2>
          <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">9:00〜18:00・家族時間を守りながら、1人で無理なく安定収益を作れる条件を発見する。</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="September Sales" value={`${sales.toLocaleString('ja-JP')}円`} note="9/10までの確認済み7営業日。推定値は含めない。" />
        <Metric label="Guests" value={`${guests}名`} note="新規0名。現在は客数・予約充足を優先観測。" />
        <Metric label="Avg Ticket" value={`${avg.toLocaleString('ja-JP')}円`} note="単価だけでなく、少数高適合顧客との両立を見る。" />
        <Metric label="Goal Progress" value={`${progress}%`} note={`次回予約 ${next}件。130万円への進捗は結果指標として扱う。`} />
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">Two Engines</p>
            <h2 className="mt-2 text-lg font-medium">美容室＋副業ではなく、ひとつの事業</h2>
          </div>
          <p className="text-[9px] text-[var(--muted)]">1回の仕事 → 現在収益 + 将来資産</p>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <p className="text-[10px] font-medium">現在収益エンジン</p>
            <p className="mt-2 text-sm leading-7">美容師として、顧客との対話・観察・判断・技術で価値を提供する。</p>
            <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">施術 → 売上 → 再来・紹介・信頼</p>
          </div>
          <div className="rounded-2xl border border-[var(--green)] bg-[rgba(104,123,99,.06)] p-4">
            <p className="text-[10px] font-medium">知的資産エンジン</p>
            <p className="mt-2 text-sm leading-7">同じ現場からCase・Decision・Knowledge候補・検索資産・Workflow改善を残す。</p>
            <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">経験 → 再利用 → 次の仕事の質を上げる</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-5">
        <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">Learning Loop</p>
        <h2 className="mt-2 text-lg font-medium">働くほど「仕事量」ではなく「組織能力」が残る</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FlowNode accent>Salon Work</FlowNode><span className="text-[var(--muted)]">→</span>
          <FlowNode>Case</FlowNode><span className="text-[var(--muted)]">→</span>
          <FlowNode>Decision</FlowNode><span className="text-[var(--muted)]">→</span>
          <FlowNode>Reuse</FlowNode><span className="text-[var(--muted)]">→</span>
          <FlowNode>Knowledge候補</FlowNode><span className="text-[var(--muted)]">→</span>
          <FlowNode accent>次の施術 / 集客 / 経営</FlowNode>
        </div>
        <p className="mt-4 text-[10px] leading-5 text-[var(--muted)]">Case→Knowledgeへ直行しない。次の仕事で実際に使われ、役に立ったかを見て初めてKnowledge候補を強める。</p>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-5">
          <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">Human Core</p>
          <h2 className="mt-2 text-lg font-medium">池田航一に残す仕事</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {humanCore.map((item) => <div key={item} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-[10px] leading-5">{item}</div>)}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-5">
          <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">AI Organization</p>
          <h2 className="mt-2 text-lg font-medium">AIたちへ渡す仕事</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {aiCore.map((item) => <div key={item} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-[10px] leading-5">{item}</div>)}
          </div>
          <p className="mt-4 text-[10px] leading-5 text-[var(--muted)]">AIを増やすことが目的ではない。池田が確認しなくても回る範囲を増やし、重要な例外だけ上げる。</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--green)] bg-[rgba(104,123,99,.05)] p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--green)]">Now / Small Steps</p>
            <h2 className="mt-2 text-lg font-medium">これからコツコツやることは4つだけ</h2>
          </div>
          <span className="rounded-full border border-[var(--green)] px-3 py-1.5 text-[9px] text-[var(--green)]">DO NOT EXPAND</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {smallSteps.map((step) => (
            <div key={step.no} className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4">
              <p className="text-[9px] text-[var(--green)]">{step.no}</p>
              <p className="mt-2 text-sm font-medium">{step.title}</p>
              <p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">{step.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-5">
          <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">Guardrails</p>
          <h2 className="mt-2 text-lg font-medium">今は、増やさない</h2>
          <div className="mt-4 space-y-2">
            {guardrails.map((item) => <p key={item} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-[10px] leading-5 text-[var(--muted)]">{item}</p>)}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-5">
          <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">2028 Question</p>
          <h2 className="mt-2 text-lg font-medium">これは2028年以降の池田航一に何を残すのか？</h2>
          <div className="mt-4 space-y-2 text-[10px] leading-5 text-[var(--muted)]">
            <p>残らないなら減らす。</p>
            <p>残るなら蓄積する。</p>
            <p>再利用できるならKnowledge化する。</p>
            <p>繰り返すならWorkflow化する。</p>
            <p>AIへ渡せるなら渡す。</p>
            <p className="font-medium text-[var(--ink)]">池田にしかできない判断だけを池田に残す。</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">Long-term Map</p>
            <h2 className="mt-2 text-lg font-medium">Phase 1–12は「今やるToDo」ではなく、長期設計の地図</h2>
          </div>
          <button type="button" onClick={() => setShowFuture((value) => !value)} className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-[10px] transition active:scale-[.98]">
            {showFuture ? '閉じる' : '未来地図を見る'}
          </button>
        </div>
        {showFuture && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {phases.map(([no, title, note]) => (
              <div key={no} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3">
                <div className="flex items-center justify-between"><span className="text-[9px] text-[var(--muted)]">PHASE {no}</span><span className="h-2 w-2 rounded-full bg-[var(--green)] opacity-50" /></div>
                <p className="mt-2 text-[11px] font-medium">{title}</p>
                <p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">{note}</p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-[10px] leading-5 text-[var(--muted)]">先に遠くまで構想した価値は「今やることを増やした」ことではなく、「何を今やらなくていいか」と「今日の小さな記録が将来どこへつながるか」を明確にしたこと。</p>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-5">
        <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">Current Data Trust</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="KPI Source" value="Sheets" note="現在のKPI正本。計算値を別台帳へ二重入力しない。" />
          <Metric label="Case" value="Meaningful only" note="顧客PIIを持ち込まず、判断価値のあるCaseだけ。" />
          <Metric label="Employer Data" value="Disconnected" note="勤務先BeautyMerit等を2028事業OSへ接続しない。" />
          <Metric label="Unknown" value="Unknown" note="未確認値を推定で埋めない。事実と仮説を分ける。" />
        </div>
      </section>
    </div>
  )
}
