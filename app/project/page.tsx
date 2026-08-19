import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import PersonalNavigation from '@/lib/components/PersonalNavigation'
import { getServerProfile } from '@/lib/repositories/profiles'

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
  const profile = await getServerProfile()
  if (!profile) redirect('/login')

  return (
    <AuthGuard>
      <main className="min-h-dvh bg-[#0B1220] pb-24 text-[#E6ECF5]">
        <div className="mx-auto w-full max-w-lg px-4 py-6 space-y-5">
          <header>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#D4AF37]">130 PROJECT</p>
            <h1 className="mt-2 text-2xl font-bold">130万円安定達成プロジェクト</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#8B94A7]">
              一度130万円を作るのではなく、なぜ達成できたかを説明・再現でき、無理なく続けられる状態を作る。
            </p>
          </header>

          <section className="rounded-3xl border border-[#D4AF37]/25 bg-[#111A2B] p-5">
            <p className="text-xs font-bold text-[#D4AF37]">最上位目標</p>
            <p className="mt-3 text-lg font-bold leading-relaxed">
              9:00〜18:00の勤務と家族との時間を守りながら、月間技術売上130万円を持続的・安定的に達成する。
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111A2B] p-5">
            <p className="text-xs text-[#7F8AA0]">現在フェーズ</p>
            <h2 className="mt-2 text-xl font-bold">ホップ｜現場検証</h2>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {['観察', '仮説', '小さく試す', '結果を見る', '修正する'].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-[#0B1220] px-3 py-2 text-[#C9D1DE]">{item}</span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#9AA4B7]">
              1日の売上や客数だけで因果を断定しない。一時的なブレと構造的な変化を分ける。
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111A2B] p-5">
            <p className="text-xs text-[#7F8AA0]">判断の優先順位</p>
            <div className="mt-4 space-y-2">
              {priorities.map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-xl bg-[#0B1220] px-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-[11px] text-[#8B94A7]">{index + 1}</span>
                  <span className={`text-sm ${index < 5 ? 'font-semibold text-[#E6ECF5]' : 'text-[#9AA4B7]'}`}>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111A2B] p-5">
            <p className="text-xs text-[#7F8AA0]">採用しない伸ばし方</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#B7C0CF]">
              {['長時間労働', '予約の詰め込み', '値引き中心', '大量新規集客', '不要な追加提案', '家族時間の犠牲'].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-[#0B1220] px-3 py-3">{item}</div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111A2B] p-5">
            <p className="text-xs text-[#7F8AA0]">OSが集める証拠</p>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-[#C9D1DE]">
              <li>・どんな相談で、何を確認したか</li>
              <li>・何を選び、何をあえて選ばなかったか</li>
              <li>・次回来店で何を検証するか</li>
              <li>・複数Caseで繰り返す判断基準は何か</li>
              <li>・その判断が再来・紹介・単価・時間価値へどうつながったか</li>
            </ul>
          </section>
        </div>
        <PersonalNavigation />
      </main>
    </AuthGuard>
  )
}
