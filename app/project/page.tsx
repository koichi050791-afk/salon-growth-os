import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import { EditorialPage, QuietPanel, SectionLabel } from '@/lib/components/EditorialPage'
import { getServerUser } from '@/lib/auth/server-user'

export const metadata: Metadata = {
  title: '130万円プロジェクト | 池田航一｜美容師OS',
  description: '月間技術売上130万円を安定達成するための現場検証プロジェクト',
}

const priorities = [
  'サロンワーク',
  '顧客体験',
  '再来',
  '次回予約',
  '紹介',
  '検索評価',
  'AI・検索からの発見',
  'SNS',
  '新規集客',
]

export default async function ProjectPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  return (
    <AuthGuard>
      <EditorialPage containerClassName="space-y-8">
        <header className="border-b border-[var(--line)] pb-5">
          <SectionLabel>130 Project</SectionLabel>
          <h1 className="mt-2 text-[34px] font-medium leading-tight">130万円安定達成プロジェクト</h1>
          <p className="mt-3 max-w-[35rem] text-sm leading-7 text-[var(--muted)]">
            一度130万円を作るのではなく、なぜ達成できたかを説明・再現でき、無理なく続けられる状態を作る。
          </p>
        </header>

        <QuietPanel className="py-6">
          <SectionLabel>Goal</SectionLabel>
          <p className="mt-3 text-xl font-medium leading-9">
            9:00〜18:00の勤務と家族との時間を守りながら、月間技術売上130万円を持続的・安定的に達成する。
          </p>
        </QuietPanel>

        <section className="border-b border-[var(--line)] pb-6">
          <SectionLabel>Current Phase</SectionLabel>
          <h2 className="mt-3 text-2xl font-medium">ホップ｜現場検証</h2>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            {['観察', '仮説', '小さく試す', '結果を見る', '修正する'].map((item) => (
              <span key={item} className="border border-[var(--line)] bg-[var(--paper-soft)] px-3 py-2 text-[var(--ink-soft)]">
                {item}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
            1日の売上や客数だけで因果を断定しない。一時的なブレと構造的な変化を分ける。
          </p>
        </section>

        <section>
          <SectionLabel>Priority</SectionLabel>
          <ol className="mt-4 border-t border-[var(--line)]">
            {priorities.map((item, index) => (
              <li key={item} className="flex items-center gap-4 border-b border-[var(--line)] py-3">
                <span className="w-7 shrink-0 text-[11px] text-[var(--muted)]">{String(index + 1).padStart(2, '0')}</span>
                <span className={`text-sm ${index < 5 ? 'font-medium text-[var(--ink)]' : 'text-[var(--muted)]'}`}>
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionLabel>Not Chosen</SectionLabel>
          <div className="mt-4 grid grid-cols-2 border-t border-[var(--line)] text-sm text-[var(--ink-soft)]">
            {['長時間労働', '予約の詰め込み', '値引き中心', '大量新規集客', '不要な追加提案', '家族時間の犠牲'].map((item) => (
              <div key={item} className="border-b border-[var(--line)] py-3 pr-3">{item}</div>
            ))}
          </div>
        </section>

        <QuietPanel>
          <SectionLabel>Evidence</SectionLabel>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
            <li>どんな相談で、何を確認したか</li>
            <li>何を選び、何をあえて選ばなかったか</li>
            <li>次回来店で何を検証するか</li>
            <li>複数Caseで繰り返す判断基準は何か</li>
            <li>その判断が再来・紹介・単価・時間価値へどうつながったか</li>
          </ul>
        </QuietPanel>
      </EditorialPage>
    </AuthGuard>
  )
}
