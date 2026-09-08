import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import PersonalNavigation from '@/lib/components/PersonalNavigation'
import { getServerUser } from '@/lib/auth/server-user'

const kpis = [
  ['技術売上', '250,700', '円'],
  ['客数', '17', '名'],
  ['平均客単価', '14,747', '円'],
  ['新規', '0', '名'],
  ['次回予約', '5', '件 / 29.4%'],
  ['営業日記録', '6', '日'],
]

const sources = [
  ['Google Sheets / 美容師OS', '取得確認済', '9/8', 'High', 'ok'],
  ['Metricool / Threads', '取得確認済', '9/7まで返却', 'Medium-High', 'ok'],
  ['GA4', '未接続', '—', '—', 'gap'],
  ['Google Search Console', '未接続', '—', '—', 'gap'],
  ['note analytics', '未接続', '—', '—', 'gap'],
  ['Google Business Profile', '未接続', '—', '—', 'gap'],
  ['BeautyMerit', '未接続', '—', '—', 'gap'],
  ['LINE', '未接続', '—', '—', 'gap'],
]

const roles = [
  ['Chief of Staff', 'Chat', '現在収益・顧客創出・経験資産・2028を統合し、上げる論点を絞る', '稼働'],
  ['Revenue Ops', 'KPI', '売上・客数・単価・予約未充足を観測。単日因果は断定しない', '観測'],
  ['Growth Intelligence', 'Search / Web / Social', 'Threadsは観測可能。GSC / GA4 / note / Maps / BMの死角を可視化', 'DATA GAP'],
  ['Customer & Case', 'Case / Cohort', 'Caseの次回Outcomeと、新規発生後の2回目・3回目・紹介を接続する', '稼働'],
  ['Knowledge & Content', 'Knowledge / Content', '候補4件をValidation待ちで維持。Reuse / Updateを新規制作より優先', 'REVIEW'],
  ['Research', 'External Evidence', '現場判断を変えうる問いだけを調査する', '待機'],
  ['Operations', 'Work', 'GA4 / GSC / note / GBPなど実画面の確認・操作を担う', '待機'],
  ['Systems', 'Codex', '集計・比較・検査・反復・自動化を仕組みに寄せる', '稼働'],
  ['2028 Strategy', 'Business', '現在の顧客創出実証を優先し、商圏・財務・開業条件は重要論点のみ保持', '低優先'],
]

function Dot({ tone }: { tone: 'green' | 'amber' | 'red' | 'gray' }) {
  const color = {
    green: 'bg-[var(--green)]',
    amber: 'bg-[var(--gold)]',
    red: 'bg-[var(--danger)]',
    gray: 'bg-[var(--muted)]',
  }[tone]
  return <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${color}`} />
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`border border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-5 ${className}`}>
      {children}
    </section>
  )
}

export default async function CompanyOSPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  return (
    <AuthGuard>
      <main className="min-h-dvh bg-[var(--paper)] pb-[calc(96px+env(safe-area-inset-bottom))] text-[var(--ink)]">
        <div className="mx-auto w-full max-w-[1500px] space-y-4 px-3 py-4 sm:px-6 sm:py-7">
          <header className="flex flex-col justify-between gap-4 border border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:flex-row sm:items-center sm:p-5">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Ikeda Company OS</p>
              <h1 className="mt-2 text-2xl font-medium sm:text-3xl">池田航一 × AI｜Company OS v2.0</h1>
              <p className="mt-2 text-xs leading-6 text-[var(--muted)]">Decision-first cockpit｜現在収益 × 顧客創出 × 経験資産 × 時間 × 2028</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-[var(--muted)]">
              <span className="border border-[var(--line)] px-2 py-1">2026-09-08</span>
              <span className="border border-[var(--line)] px-2 py-1">STATIC SNAPSHOT</span>
              <span className="border border-[var(--line)] px-2 py-1">未確認値は埋めない</span>
            </div>
          </header>

          <section>
            <div className="mb-2 flex items-end justify-between gap-3">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">01 Purpose / 最上位目的</h2>
              <span className="text-[10px] text-[var(--muted)]">売上だけで前進判定しない</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ['CURRENT REVENUE', '観測中', '今月の収益エンジン。130万円は検証指標。'],
                ['CUSTOMER QUALITY', '新規コホート未開始', '新規0名。2回目→3回目→紹介の質評価は来店発生後。'],
                ['EXPERIENCE CAPITAL', '候補蓄積 / Validation不足', 'Case数ではなく、Outcomeと再利用で資産価値を判定。'],
                ['OWNER TIME', '未計測', 'AIが仕事を増やしていないかを判断する主要死角。'],
                ['FAMILY TIME', '保護対象 / 定量未接続', '短期成果のために犠牲にしない最上位制約。'],
              ].map(([label, value, note]) => (
                <Card key={label} className="min-h-[126px]">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
                  <p className="mt-2 text-sm font-medium">{value}</p>
                  <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">{note}</p>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-end justify-between gap-3">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">02 Executive Signals</h2>
              <span className="text-[10px] text-[var(--muted)]">FACT / OBSERVATION / DATA GAP</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <Card><div className="flex gap-3"><Dot tone="red"/><div><p className="text-[9px] text-[var(--muted)]">FACT</p><p className="mt-1 font-medium">9月新規 0名</p><p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">新規コホートはまだ開始していない。</p></div></div></Card>
              <Card><div className="flex gap-3"><Dot tone="amber"/><div><p className="text-[9px] text-[var(--muted)]">FACT</p><p className="mt-1 font-medium">記録済み空き 780分</p><p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">9/4・9/5・9/6・9/8の記録。未記録日は推定しない。</p></div></div></Card>
              <Card><div className="flex gap-3"><Dot tone="green"/><div><p className="text-[9px] text-[var(--muted)]">OBSERVATION</p><p className="mt-1 font-medium">平均客単価 14,747円</p><p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">現時点は単価より顧客数・予約充足を優先観測。</p></div></div></Card>
              <Card><div className="flex gap-3"><Dot tone="gray"/><div><p className="text-[9px] text-[var(--muted)]">DATA GAP</p><p className="mt-1 font-medium">Web→相談→予約が見えない</p><p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">GA4 / GSC / note / Maps / BMが未接続。</p></div></div></Card>
            </div>
          </section>

          <section className="grid gap-3 xl:grid-cols-[2.1fr_.9fr]">
            <Card>
              <div className="flex items-center justify-between"><h2 className="text-sm font-medium">現在収益エンジン</h2><span className="text-[9px] text-[var(--muted)]">Sheets / 9/8</span></div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                {kpis.map(([label, value, unit]) => (
                  <div key={label} className="border border-[var(--line)] bg-[var(--paper)] p-3">
                    <p className="text-[9px] text-[var(--muted)]">{label}</p>
                    <p className="mt-1 text-xl font-medium">{value}<span className="ml-1 text-[9px] font-normal text-[var(--muted)]">{unit}</span></p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="flex items-end justify-between text-[11px]"><span>9月目標 1,300,000円</span><strong className="text-lg font-medium text-[var(--gold)]">19.3%</strong></div>
                <div className="mt-2 h-2 overflow-hidden bg-[var(--line)]"><div className="h-full w-[19.3%] bg-[var(--green)]"/></div>
                <p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">残り 1,049,300円。着地予測は月間営業日カレンダーと将来予約在庫が未接続のため表示しない。</p>
              </div>
            </Card>
            <Card>
              <h2 className="text-sm font-medium">Company Health / 4視点</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ['収益', '売上進捗19.3%。原因判定は未実施。', 'amber'],
                  ['顧客創出', '新規0。Webファネル未接続。', 'red'],
                  ['経験資産', 'Case15 / 候補4 / 正式Knowledge0。', 'amber'],
                  ['時間', 'オーナー業務時間が未計測。', 'gray'],
                ].map(([label, note, tone]) => (
                  <div key={label} className="border border-[var(--line)] bg-[var(--paper)] p-3">
                    <div className="flex items-center gap-2"><Dot tone={tone as 'green'|'amber'|'red'|'gray'}/><p className="text-[10px] font-medium">{label}</p></div>
                    <p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">{note}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">恣意的な総合点は作らず、定義できる指標だけを見る。</p>
            </Card>
          </section>

          <section>
            <div className="mb-2 flex items-end justify-between gap-3"><h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">03 Customer Creation</h2><span className="text-[10px] text-[var(--muted)]">発見 → 検索 → 理解 → 相談 → 予約 → 来店 → 再来 / 紹介</span></div>
            <Card>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                {[
                  ['発見', 'Google / Maps / Threads / note', 'Threads snapshotあり', 'ok'],
                  ['検索', 'GSC query / page / click / impression', '未接続', 'gap'],
                  ['理解', '公式Web / GA4', '未接続', 'gap'],
                  ['相談', '相談開始 / 完了 / LINE', '未接続', 'gap'],
                  ['予約', 'BeautyMerit', '未接続', 'gap'],
                  ['来店', 'KPI日報', 'Sheets snapshotあり', 'ok'],
                  ['再来 / 紹介', '新規コホート', '0 rows / 発生待ち', 'wait'],
                ].map(([label, source, state, status]) => (
                  <div key={label} className="min-h-[118px] border border-[var(--line)] bg-[var(--paper)] p-3">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-2 text-[9px] leading-4 text-[var(--muted)]">{source}</p>
                    <p className={`mt-4 text-[9px] font-medium ${status === 'ok' ? 'text-[var(--green)]' : status === 'wait' ? 'text-[var(--gold)]' : 'text-[var(--muted)]'}`}>{state}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between"><h2 className="text-sm font-medium">Threads / Metricool</h2><span className="text-[9px] text-[var(--muted)]">latest returned 9/7</span></div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[['Followers','12'],['Posts','7'],['Post Views','427'],['Profile Views','129']].map(([l,v])=><div key={l} className="border border-[var(--line)] bg-[var(--paper)] p-3"><p className="text-[9px] text-[var(--muted)]">{l}</p><p className="mt-1 text-lg font-medium">{v}</p></div>)}
              </div>
              <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">Interactions 6。予約投稿9件（9/11〜9/28・20:45）。接続後の短期間なので投稿施策の因果判定はまだしない。</p>
            </Card>
            <Card>
              <div className="flex items-center justify-between"><h2 className="text-sm font-medium">検索 / Web / note</h2><span className="text-[9px] text-[var(--muted)]">主要Data Gap</span></div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[['GSC表示','—'],['GSCクリック','—'],['Web相談完了','—'],['note→Web送客','—']].map(([l,v])=><div key={l} className="border border-[var(--line)] bg-[var(--paper)] p-3"><p className="text-[9px] text-[var(--muted)]">{l}</p><p className="mt-1 text-lg font-medium">{v}</p></div>)}
              </div>
              <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">アクセス数ではなく、検索→Web→相談→予約→来店の詰まり位置を特定するために接続する。</p>
            </Card>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between"><h2 className="text-sm font-medium">Customer Quality / 新規コホート</h2><span className="text-[9px] text-[var(--muted)]">0 rows</span></div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px]">
                {['初回 0','2回目 —','3回目 —','固定客 —','紹介 —'].map((x,i)=><span key={x} className="flex items-center gap-2"><span className="border border-[var(--line)] bg-[var(--paper)] px-3 py-2">{x}</span>{i<4&&<span className="text-[var(--muted)]">→</span>}</span>)}
              </div>
              <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">新規が発生するまで空欄のまま維持。架空コホートを作らない。</p>
            </Card>
            <Card>
              <h2 className="text-sm font-medium">顧客の質：将来の評価軸</h2>
              <div className="mt-3 divide-y divide-[var(--line)] text-[10px]">
                {[['2回目 / 3回目','「来た」ではなく「残った」か'],['180日累積売上','初回単価より顧客生涯の質'],['紹介','満足・ブランド適合の間接指標'],['選択理由 / 主訴','どんな顧客に選ばれているか']].map(([a,b])=><div key={a} className="grid grid-cols-[120px_1fr] gap-3 py-2"><span className="font-medium">{a}</span><span className="text-[var(--muted)]">{b}</span></div>)}
              </div>
            </Card>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between"><h2 className="text-sm font-medium">Experience Capital / Learning Loop</h2><span className="text-[9px] text-[var(--muted)]">Validation-first</span></div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px]">
                {['現場','Case','Decision','Knowledge候補','Outcome / Validation','正式Knowledge','Reuse'].map((x,i)=><span key={x} className="flex items-center gap-2"><span className={`border px-3 py-2 ${x==='Outcome / Validation'?'border-[var(--gold)] bg-[var(--gold-soft)]':'border-[var(--line)] bg-[var(--paper)]'}`}>{x}</span>{i<6&&<span className="text-[var(--muted)]">→</span>}</span>)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[['Case','15'],['Knowledge候補','4'],['正式Knowledge','0'],['Usage Rate','—']].map(([l,v])=><div key={l} className="border border-[var(--line)] bg-[var(--paper)] p-3"><p className="text-[9px] text-[var(--muted)]">{l}</p><p className="mt-1 text-lg font-medium">{v}</p></div>)}
              </div>
              <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">次の優先：K-0004のOutcome / 反証 / 適用条件。単一Case・即時満足だけで正式Knowledgeへ昇格しない。</p>
            </Card>
            <Card>
              <div className="flex items-center justify-between"><h2 className="text-sm font-medium">Intervention / Validation Log</h2><span className="text-[9px] text-[var(--muted)]">実験</span></div>
              <div className="mt-3 divide-y divide-[var(--line)] text-[10px]">
                <div className="grid grid-cols-[72px_80px_1fr] gap-2 py-2 text-[var(--muted)]"><span>ID</span><span>状態</span><span>テーマ / 次判断</span></div>
                <div className="grid grid-cols-[72px_80px_1fr] gap-2 py-3"><span>EXP-0001</span><span>実施予定</span><span>ケア提案＋年末プランニング。複数日・複数顧客で観察。</span></div>
                <div className="grid grid-cols-[72px_80px_1fr] gap-2 py-3"><span>EXP-0002</span><span>実施中</span><span>Evidence-to-Asset。Knowledge昇格よりOutcome接続を優先。</span></div>
              </div>
            </Card>
          </section>

          <section className="grid gap-3 xl:grid-cols-[2.1fr_.9fr]">
            <Card>
              <div className="flex items-center justify-between"><h2 className="text-sm font-medium">AI Company / Operating Roles</h2><span className="text-[9px] text-[var(--muted)]">役割 ≠ 別モデル</span></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {roles.map(([name, sub, task, state]) => (
                  <div key={name} className="border border-[var(--line)] bg-[var(--paper)] p-3">
                    <div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-medium">{name}</p><p className="mt-1 text-[9px] text-[var(--muted)]">{sub}</p></div><span className="text-[8px] text-[var(--gold)]">{state}</span></div>
                    <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">{task}</p>
                  </div>
                ))}
              </div>
            </Card>
            <div className="grid gap-3">
              <Card>
                <h2 className="text-sm font-medium">Human Gate</h2>
                <div className="mt-3 space-y-2 text-[10px]">
                  <div className="border border-[var(--gold)] bg-[var(--gold-soft)] p-3"><strong>Knowledge正式採用</strong><p className="mt-1 leading-5 text-[var(--muted)]">Outcome・反証・成立条件を見て昇格判断。</p></div>
                  <div className="border border-[var(--gold)] bg-[var(--gold-soft)] p-3"><strong>外部公開 / 顧客送信 / ブランド変更</strong><p className="mt-1 leading-5 text-[var(--muted)]">不可逆な外部変更はHuman Gate。</p></div>
                  <div className="border border-[var(--gold)] bg-[var(--gold-soft)] p-3"><strong>重要経営判断</strong><p className="mt-1 leading-5 text-[var(--muted)]">開業・価格・投資・大きな方針変更。</p></div>
                </div>
              </Card>
              <Card>
                <h2 className="text-sm font-medium">AI Productivity / 未計測</h2>
                <div className="mt-3 grid grid-cols-2 gap-2">{[['削減時間','—'],['差戻し率','—'],['Human Gate率','—'],['No Action率','—']].map(([l,v])=><div key={l} className="border border-[var(--line)] bg-[var(--paper)] p-3"><p className="text-[9px] text-[var(--muted)]">{l}</p><p className="mt-1 text-lg font-medium">{v}</p></div>)}</div>
                <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">AIタスク数ではなく「池田の作業が減ったか」で評価する。</p>
              </Card>
            </div>
          </section>

          <section className="grid gap-3 xl:grid-cols-3">
            <Card>
              <h2 className="text-sm font-medium">Data Trust</h2>
              <div className="mt-3 text-[9px]">
                <div className="grid grid-cols-[1.4fr_.8fr_.8fr_.7fr] gap-2 border-b border-[var(--line)] pb-2 text-[var(--muted)]"><span>Source</span><span>Status</span><span>Freshness</span><span>Confidence</span></div>
                {sources.map(([name,status,freshness,confidence,state])=><div key={name} className="grid grid-cols-[1.4fr_.8fr_.8fr_.7fr] gap-2 border-b border-[var(--line)] py-2 last:border-0"><span className="font-medium">{name}</span><span className={state==='ok'?'text-[var(--green)]':'text-[var(--muted)]'}>{status}</span><span>{freshness}</span><span>{confidence}</span></div>)}
              </div>
            </Card>
            <Card>
              <h2 className="text-sm font-medium">Stop / No Action</h2>
              <div className="mt-3 space-y-2 text-[10px] leading-5 text-[var(--muted)]">
                <p className="border-l-2 border-[var(--danger)] pl-3">新しいREAL Decision / Outcome / 一次Sourceが増えていないのに、同じ資産の再分類を繰り返さない。</p>
                <p className="border-l-2 border-[var(--danger)] pl-3">既存記事をReuse / Updateできるなら、新規記事を増やさない。</p>
                <p className="border-l-2 border-[var(--danger)] pl-3">Approval Queueを増やすことを成功とみなさない。</p>
                <p className="border-l-2 border-[var(--danger)] pl-3">データ不足・観測期間不足なら「今は変えない」を正常な結論にする。</p>
              </div>
            </Card>
            <Card>
              <h2 className="text-sm font-medium">Time / Portability / Risk</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">{[['オーナー業務時間','0件'],['記録済み空き','13h'],['売上 / 営業日','41,783'],['AI削減時間','—']].map(([l,v])=><div key={l} className="border border-[var(--line)] bg-[var(--paper)] p-3"><p className="text-[9px] text-[var(--muted)]">{l}</p><p className="mt-1 text-base font-medium">{v}</p></div>)}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] leading-5 text-[var(--muted)]"><div className="border border-[var(--line)] bg-[var(--paper)] p-3"><strong className="text-[var(--ink)]">Portable</strong><p className="mt-1">Case / Decision / Knowledge / 判断ルール / Web構造 / AI運用</p></div><div className="border border-[var(--line)] bg-[var(--paper)] p-3"><strong className="text-[var(--ink)]">Local</strong><p className="mt-1">三田検索語 / 現店舗立地 / 地域反応 / 店舗固有条件</p></div></div>
            </Card>
          </section>

          <p className="pb-3 text-[9px] leading-5 text-[var(--muted)]">Company OS v2.0｜Connected snapshot: Google Sheets / Metricool. Unconnected: GA4 / GSC / note analytics / GBP / BeautyMerit / LINE. 本画面は現時点ではライブ更新ではありません。</p>
        </div>
        <PersonalNavigation />
      </main>
    </AuthGuard>
  )
}
