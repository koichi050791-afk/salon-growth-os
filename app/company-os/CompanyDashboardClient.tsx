'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const salesSeries = [
  { date: '9/1', sales: 41100, guests: 3, next: 1 },
  { date: '9/3', sales: 48800, guests: 3, next: 0 },
  { date: '9/4', sales: 30300, guests: 2, next: 1 },
  { date: '9/5', sales: 47800, guests: 4, next: 2 },
  { date: '9/6', sales: 67900, guests: 4, next: 1 },
  { date: '9/8', sales: 14800, guests: 1, next: 0 },
]

const roles = [
  { name: 'Chief of Staff', unit: 'Chat', task: '収益・顧客創出・経験資産を統合', state: '稼働', tone: 'green' },
  { name: 'Revenue Ops', unit: 'KPI', task: '売上・客数・予約未充足を観測', state: '観測', tone: 'green' },
  { name: 'Growth Intelligence', unit: 'Search / Web / Social', task: 'GSC・GA4・note等の死角を可視化', state: 'DATA GAP', tone: 'amber' },
  { name: 'Customer & Case', unit: 'Case / Cohort', task: 'Outcomeと再来コホートを接続', state: '稼働', tone: 'green' },
  { name: 'Knowledge & Content', unit: 'Knowledge', task: '候補4件をValidation待ちで維持', state: 'REVIEW', tone: 'amber' },
  { name: 'Research', unit: 'Evidence', task: '現場判断を変える問いだけ調査', state: '待機', tone: 'gray' },
  { name: 'Operations', unit: 'Work', task: 'GA4・GSC・note等の実画面確認', state: '待機', tone: 'gray' },
  { name: 'Systems', unit: 'Codex', task: '比較・検査・反復・自動化', state: '稼働', tone: 'green' },
  { name: '2028 Strategy', unit: 'Business', task: '開業条件は重要論点のみ保持', state: '低優先', tone: 'gray' },
] as const

const sources = [
  { name: 'Google Sheets / 美容師OS', status: '取得確認済', freshness: '9/8', confidence: 'High', tone: 'green' },
  { name: 'Metricool / Threads', status: '取得確認済', freshness: '9/7まで返却', confidence: 'Medium-High', tone: 'green' },
  { name: 'GA4', status: '未接続', freshness: '—', confidence: '—', tone: 'gray' },
  { name: 'Google Search Console', status: '未接続', freshness: '—', confidence: '—', tone: 'gray' },
  { name: 'note analytics', status: '未接続', freshness: '—', confidence: '—', tone: 'gray' },
  { name: 'Google Business Profile', status: '未接続', freshness: '—', confidence: '—', tone: 'gray' },
  { name: 'BeautyMerit', status: '未接続', freshness: '—', confidence: '—', tone: 'gray' },
  { name: 'LINE', status: '未接続', freshness: '—', confidence: '—', tone: 'gray' },
] as const

const funnel = [
  { label: '発見', detail: 'Google / Maps / Threads / note', state: '一部観測', tone: 'green' },
  { label: '検索', detail: 'Search Console', state: '未接続', tone: 'gray' },
  { label: '理解', detail: '公式Web / GA4', state: '未接続', tone: 'gray' },
  { label: '相談', detail: '相談開始 / 完了 / LINE', state: '未接続', tone: 'gray' },
  { label: '予約', detail: 'BeautyMerit', state: '未接続', tone: 'gray' },
  { label: '来店', detail: 'KPI日報', state: '観測中', tone: 'green' },
  { label: '再来 / 紹介', detail: '新規コホート', state: '発生待ち', tone: 'amber' },
] as const

const toneClass = {
  green: 'bg-[var(--green)]',
  amber: 'bg-[var(--gold)]',
  red: 'bg-[var(--danger)]',
  gray: 'bg-[var(--muted)]',
} as const

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(media.matches)
    const handler = () => setReduced(media.matches)
    media.addEventListener?.('change', handler)
    return () => media.removeEventListener?.('change', handler)
  }, [])
  return reduced
}

function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? value : 0)
  useEffect(() => {
    if (reduced) {
      setShown(value)
      return
    }
    let frame = 0
    const started = performance.now()
    const duration = 760
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(value * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, reduced])
  return <>{prefix}{shown.toLocaleString('ja-JP')}{suffix}</>
}

function AnimatedProgress({ value }: { value: number }) {
  const reduced = useReducedMotion()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[color:rgba(36,35,31,0.08)]">
      <div
        className="h-full rounded-full bg-[var(--green)]"
        style={{
          width: `${reduced || ready ? value : 0}%`,
          transition: reduced ? 'none' : 'width 900ms cubic-bezier(.2,.8,.2,1)',
        }}
      />
    </div>
  )
}

function Sparkline({ values, labels, accent = 'green', fill = true }: { values: number[]; labels?: string[]; accent?: 'green' | 'gold'; fill?: boolean }) {
  const reduced = useReducedMotion()
  const [ready, setReady] = useState(false)
  const width = 320
  const height = 88
  const pad = 8
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1, max - min)
  const points = values.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(1, values.length - 1)
    const y = pad + ((max - v) / range) * (height - pad * 2)
    return [x, y] as const
  })
  const line = points.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`
  const stroke = accent === 'green' ? 'var(--green)' : 'var(--gold)'
  const fillColor = accent === 'green' ? 'rgba(104,123,99,.10)' : 'rgba(168,139,80,.12)'
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[86px] w-full overflow-visible" role="img" aria-label="推移グラフ">
        {fill && <polygon points={area} fill={fillColor} opacity={ready || reduced ? 1 : 0} style={{ transition: reduced ? 'none' : 'opacity 600ms ease 300ms' }} />}
        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={ready || reduced ? 0 : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: reduced ? 'none' : 'stroke-dashoffset 1000ms cubic-bezier(.2,.8,.2,1)' }}
        />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="var(--paper-soft)" stroke={stroke} strokeWidth="2" opacity={ready || reduced ? 1 : 0} style={{ transition: reduced ? 'none' : `opacity 250ms ease ${450 + i * 70}ms` }}>
            <title>{labels?.[i] ? `${labels[i]}: ` : ''}{values[i].toLocaleString('ja-JP')}</title>
          </circle>
        ))}
      </svg>
      {labels && <div className="grid text-[8px] text-[var(--muted)]" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>{labels.map((label) => <span key={label} className="text-center">{label}</span>)}</div>}
    </div>
  )
}

function TrendChart() {
  const [mode, setMode] = useState<'daily' | 'cumulative'>('daily')
  const daily = salesSeries.map((d) => d.sales)
  const cumulative = salesSeries.reduce<number[]>((acc, d) => {
    acc.push((acc.at(-1) ?? 0) + d.sales)
    return acc
  }, [])
  const values = mode === 'daily' ? daily : cumulative
  const latest = values.at(-1) ?? 0
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 shadow-[0_10px_30px_rgba(36,35,31,.035)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Revenue Performance</p>
          <h2 className="mt-2 text-base font-medium">9月 技術売上推移</h2>
          <p className="mt-1 text-[10px] text-[var(--muted)]">実記録6営業日 / 9月8日時点</p>
        </div>
        <div className="flex rounded-full border border-[var(--line)] bg-[var(--paper)] p-1 text-[9px]">
          <button onClick={() => setMode('daily')} className={`rounded-full px-3 py-1.5 transition ${mode === 'daily' ? 'bg-[var(--charcoal)] text-[var(--paper-soft)]' : 'text-[var(--muted)]'}`}>日次</button>
          <button onClick={() => setMode('cumulative')} className={`rounded-full px-3 py-1.5 transition ${mode === 'cumulative' ? 'bg-[var(--charcoal)] text-[var(--paper-soft)]' : 'text-[var(--muted)]'}`}>累計</button>
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <p className="text-2xl font-medium"><AnimatedNumber value={latest} suffix="円" /></p>
        <p className="text-[9px] text-[var(--muted)]">目標 1,300,000円</p>
      </div>
      <div className="mt-2"><Sparkline key={mode} values={values} labels={salesSeries.map((d) => d.date)} accent={mode === 'daily' ? 'green' : 'gold'} /></div>
      <div className="mt-3"><AnimatedProgress value={19.3} /></div>
      <div className="mt-2 flex justify-between text-[9px] text-[var(--muted)]"><span>進捗 19.3%</span><span>残り 1,049,300円</span></div>
    </section>
  )
}

function MiniChartCard({ label, value, unit, values, note, accent = 'green' }: { label: string; value: number; unit: string; values: number[]; note: string; accent?: 'green' | 'gold' }) {
  return (
    <section className="group rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(36,35,31,.055)]">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p><p className="mt-2 text-xl font-medium"><AnimatedNumber value={value} /><span className="ml-1 text-[9px] font-normal text-[var(--muted)]">{unit}</span></p></div>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${accent === 'green' ? 'bg-[var(--green)]' : 'bg-[var(--gold)]'}`} />
      </div>
      <div className="mt-1"><Sparkline values={values} accent={accent} fill={false} /></div>
      <p className="text-[9px] leading-4 text-[var(--muted)]">{note}</p>
    </section>
  )
}

function FunnelFlow() {
  const reduced = useReducedMotion()
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Customer Creation</p><h2 className="mt-2 text-base font-medium">顧客創出ファネル</h2></div>
        <span className="text-[9px] text-[var(--muted)]">発見 → 再来 / 紹介</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {funnel.map((stage, i) => (
          <div key={stage.label} className="relative rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 transition duration-300 hover:border-[var(--line-strong)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] text-[var(--muted)]">0{i + 1}</span>
              <span className={`h-2 w-2 rounded-full ${toneClass[stage.tone]} ${!reduced && stage.tone === 'green' ? 'animate-pulse' : ''}`} />
            </div>
            <p className="mt-3 text-sm font-medium">{stage.label}</p>
            <p className="mt-2 min-h-8 text-[9px] leading-4 text-[var(--muted)]">{stage.detail}</p>
            <p className={`mt-3 text-[9px] font-medium ${stage.tone === 'green' ? 'text-[var(--green)]' : stage.tone === 'amber' ? 'text-[var(--gold)]' : 'text-[var(--muted)]'}`}>{stage.state}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ExperienceCapital() {
  const nodes = ['現場', 'Case', 'Decision', 'Knowledge候補', 'Outcome / Validation', '正式Knowledge', 'Reuse']
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Experience Capital</p><h2 className="mt-2 text-base font-medium">経験資産 Learning Loop</h2></div><span className="text-[9px] text-[var(--muted)]">Validation-first</span></div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[9px]">
        {nodes.map((node, i) => <span key={node} className="flex items-center gap-2"><span className={`rounded-lg border px-3 py-2 ${node === 'Outcome / Validation' ? 'border-[var(--gold)] bg-[var(--gold-soft)]' : 'border-[var(--line)] bg-[var(--paper)]'}`}>{node}</span>{i < nodes.length - 1 && <span className="text-[var(--muted)]">→</span>}</span>)}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[['Case', 15], ['Knowledge候補', 4], ['正式Knowledge', 0], ['Usage Rate', null]].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3">
            <p className="text-[9px] text-[var(--muted)]">{label}</p>
            <p className="mt-1 text-lg font-medium">{typeof value === 'number' ? <AnimatedNumber value={value} /> : '—'}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">次の優先：K-0004のOutcome / 反証 / 適用条件。単一Case・即時満足だけで正式Knowledgeへ昇格しない。</p>
    </section>
  )
}

function ActivityRail() {
  const reduced = useReducedMotion()
  return (
    <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 shadow-[0_10px_30px_rgba(36,35,31,.035)]">
        <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">AI Operations</p><h2 className="mt-2 text-base font-medium">稼働状況</h2></div><span className="text-[9px] text-[var(--green)]">4 ACTIVE</span></div>
        <div className="mt-3 space-y-1.5">
          {roles.map((role) => (
            <div key={role.name} className="rounded-xl border border-transparent p-2.5 transition duration-200 hover:border-[var(--line)] hover:bg-[var(--paper)]">
              <div className="flex items-start gap-2.5">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${toneClass[role.tone]} ${!reduced && role.tone === 'green' ? 'animate-pulse' : ''}`} />
                <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="truncate text-[10px] font-medium">{role.name}</p><p className="mt-0.5 text-[8px] text-[var(--muted)]">{role.unit}</p></div><span className="shrink-0 text-[8px] text-[var(--muted)]">{role.state}</span></div><p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">{role.task}</p></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4">
        <div className="flex items-center justify-between"><h2 className="text-sm font-medium">Human Gate</h2><span className="rounded-full border border-[var(--gold)] bg-[var(--gold-soft)] px-2 py-1 text-[8px] text-[var(--gold)]">3 TYPES</span></div>
        <div className="mt-3 space-y-2 text-[9px] leading-4 text-[var(--muted)]">
          <div className="rounded-xl border border-[var(--gold)] bg-[var(--gold-soft)] p-3"><strong className="text-[var(--ink)]">Knowledge正式採用</strong><p className="mt-1">Outcome・反証・成立条件を見て昇格。</p></div>
          <div className="rounded-xl border border-[var(--gold)] bg-[var(--gold-soft)] p-3"><strong className="text-[var(--ink)]">外部公開・顧客送信</strong><p className="mt-1">不可逆な外部変更はHuman Gate。</p></div>
          <div className="rounded-xl border border-[var(--gold)] bg-[var(--gold-soft)] p-3"><strong className="text-[var(--ink)]">重要経営判断</strong><p className="mt-1">開業・価格・投資・大きな方針変更。</p></div>
        </div>
      </section>
    </aside>
  )
}

function DataTrust() {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Data Trust</p><h2 className="mt-2 text-base font-medium">Source / Freshness / Confidence</h2></div><span className="text-[9px] text-[var(--muted)]">2 / 8 sources connected</span></div>
      <div className="mt-4 divide-y divide-[var(--line)] text-[9px]">
        <div className="grid grid-cols-[1.4fr_.8fr_.8fr_.7fr] gap-2 pb-2 text-[var(--muted)]"><span>Source</span><span>Status</span><span>Freshness</span><span>Confidence</span></div>
        {sources.map((source) => <div key={source.name} className="grid grid-cols-[1.4fr_.8fr_.8fr_.7fr] gap-2 py-2"><span className="font-medium">{source.name}</span><span className={source.tone === 'green' ? 'text-[var(--green)]' : 'text-[var(--muted)]'}>{source.status}</span><span>{source.freshness}</span><span>{source.confidence}</span></div>)}
      </div>
    </section>
  )
}

function StopNoAction() {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-5">
      <div><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Governance</p><h2 className="mt-2 text-base font-medium">Stop / No Action</h2></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          '新しいREAL Decision / Outcome / 一次Sourceが増えていないのに、同じ資産を再分類しない。',
          '既存記事をReuse / Updateできるなら、新規記事を増やさない。',
          'Approval Queueを増やすことを成功とみなさない。',
          'データ不足・観測期間不足なら「今は変えない」を正常な結論にする。',
        ].map((text) => <p key={text} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-[9px] leading-5 text-[var(--muted)]">{text}</p>)}
      </div>
    </section>
  )
}

export default function CompanyDashboardClient() {
  const topRef = useRef<HTMLDivElement>(null)
  const avgTicketValues = salesSeries.map((d) => Math.round(d.sales / d.guests))
  const nextRates = salesSeries.map((d) => Math.round((d.next / d.guests) * 100))
  const openMinutes = [0, 0, 240, 240, 0, 300]

  return (
    <div ref={topRef} className="space-y-3">
      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <MiniChartCard label="Sales" value={250700} unit="円" values={salesSeries.map((d) => d.sales)} note="9月8日時点 / 6営業日記録" />
        <MiniChartCard label="Guests" value={17} unit="名" values={salesSeries.map((d) => d.guests)} note="新規0名。客数・予約充足を優先観測" accent="gold" />
        <MiniChartCard label="Avg Ticket" value={14747} unit="円" values={avgTicketValues} note="単価は現時点で大きく崩れていない" />
        <MiniChartCard label="Next Booking" value={5} unit="件" values={nextRates} note="累計 29.4% / 日次率は構成差あり" accent="gold" />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <section className="grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
            <TrendChart />
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-5">
              <div><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Capacity Signal</p><h2 className="mt-2 text-base font-medium">予約未充足 / 空き</h2></div>
              <p className="mt-4 text-2xl font-medium"><AnimatedNumber value={780} suffix="分" /></p>
              <p className="mt-1 text-[9px] text-[var(--muted)]">記録済み4営業日の合計。未記録日は推定しない。</p>
              <div className="mt-3"><Sparkline values={openMinutes} labels={salesSeries.map((d) => d.date)} accent="gold" /></div>
              <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-[9px] leading-5 text-[var(--muted)]"><strong className="text-[var(--ink)]">現在の優先観測</strong><br/>単価より「顧客数・予約充足・新規0」を先に見る。</div>
            </section>
          </section>

          <FunnelFlow />

          <section className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Threads / Metricool</p><h2 className="mt-2 text-base font-medium">発見チャネル</h2></div><span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2 py-1 text-[8px] text-[var(--muted)]">9/7 latest</span></div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['Followers', 12], ['Posts', 7], ['Post Views', 427], ['Profile Views', 129],
                ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3"><p className="text-[8px] text-[var(--muted)]">{label}</p><p className="mt-1 text-lg font-medium"><AnimatedNumber value={Number(value)} /></p></div>)}
              </div>
              <p className="mt-3 text-[9px] leading-5 text-[var(--muted)]">Interactions 6。予約投稿9件（9/11〜9/28・20:45）。短期スナップショットなので因果判定は保留。</p>
            </section>

            <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Search / Web / note</p><h2 className="mt-2 text-base font-medium">主要Data Gap</h2></div><span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-2 py-1 text-[8px] text-[var(--muted)]">P0 CONNECT</span></div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{['GSC表示', 'GSCクリック', 'Web相談完了', 'note→Web送客'].map((label) => <div key={label} className="rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--paper)] p-3"><p className="text-[8px] text-[var(--muted)]">{label}</p><p className="mt-1 text-lg font-medium text-[var(--muted)]">—</p></div>)}</div>
              <p className="mt-3 text-[9px] leading-5 text-[var(--muted)]">アクセス数を増やすことではなく、検索→Web→相談→予約→来店の詰まり位置を特定するために接続する。</p>
            </section>
          </section>

          <ExperienceCapital />

          <section className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-5">
              <div><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Customer Quality</p><h2 className="mt-2 text-base font-medium">新規コホート</h2></div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[9px]">{['初回 0', '2回目 —', '3回目 —', '固定客 —', '紹介 —'].map((x, i) => <span key={x} className="flex items-center gap-2"><span className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2">{x}</span>{i < 4 && <span className="text-[var(--muted)]">→</span>}</span>)}</div>
              <p className="mt-3 text-[9px] leading-5 text-[var(--muted)]">新規が発生するまで空欄を維持。件数より2回目→3回目→紹介の「残り方」を見る。</p>
            </section>

            <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-5">
              <div><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">AI Productivity</p><h2 className="mt-2 text-base font-medium">AIが池田の仕事を減らしたか</h2></div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{['削減時間', '差戻し率', 'Human Gate率', 'No Action率'].map((label) => <div key={label} className="rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--paper)] p-3"><p className="text-[8px] text-[var(--muted)]">{label}</p><p className="mt-1 text-lg font-medium text-[var(--muted)]">—</p></div>)}</div>
              <p className="mt-3 text-[9px] leading-5 text-[var(--muted)]">AIタスク数ではなく、本人作業・確認・転記・巡回が減ったかで評価。</p>
            </section>
          </section>

          <section className="grid gap-3 lg:grid-cols-2"><DataTrust /><StopNoAction /></section>

          <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Portable Assets', 'Case / Decision / Knowledge / 判断ルール / Web構造 / AI運用'],
                ['Local Assets', '三田検索語 / 現店舗立地 / 地域反応 / 店舗固有条件'],
                ['Owner Time', '未計測。時間当たり価値の主要Data Gap。'],
                ['Family Time', '短期成果のために犠牲にしない最上位制約。'],
              ].map(([label, note]) => <div key={label} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3"><p className="text-[9px] font-medium">{label}</p><p className="mt-2 text-[9px] leading-5 text-[var(--muted)]">{note}</p></div>)}
            </div>
          </section>
        </div>

        <ActivityRail />
      </section>
    </div>
  )
}
