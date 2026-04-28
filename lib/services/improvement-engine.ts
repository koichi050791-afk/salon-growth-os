import type { WeeklyStoreInput, MonthlyConfig } from '@/lib/types/db'

const WEEKLY_WEEKS = 4.3

export type IssueType =
  | 'no_data'
  | 'availability'
  | 'new_customers'
  | 'attraction'
  | 'unit_price'
  | 'next_visit'
  | 'ok'

export type ActionCandidate = {
  action_title: string
  action_detail: string
}

export type DiagnoseResult = {
  issue_type: IssueType
  issue_cause: string
  candidates: ActionCandidate[]
}

const ACTION_MAP: Record<IssueType, ActionCandidate[]> = {
  no_data: [],
  ok: [
    { action_title: '今週の取り組みを来週も継続する', action_detail: '先週うまくいった施策をそのまま続けてください。' },
    { action_title: 'スタッフ全員で今週の成功を共有する', action_detail: '朝礼で今週のよかった点を1つ全員で話してください。' },
    { action_title: '次月の目標を設定・確認する', action_detail: '月次設定画面で翌月の目標数値を確認・更新してください。' },
  ],
  availability: [
    { action_title: '平日限定クーポンをLINEで配信する', action_detail: '月〜木限定の10%オフクーポンをLINE公式アカウントで送る。' },
    { action_title: '平日の空き枠をSNSでアナウンスする', action_detail: '空きコマをInstagramストーリーで当日朝に投稿する。' },
    { action_title: '平日来店者に次回予約を即日確保させる', action_detail: '会計時に「次回は平日でいかがですか？」と必ず声かけする。' },
  ],
  new_customers: [
    { action_title: '仕上がり直後にその場でGoogle口コミを案内する', action_detail: '施術完了後、スマホでQRコードを見せてその場で投稿してもらう。' },
    { action_title: 'Instagramに施術ビフォーアフターを週3投稿する', action_detail: 'ビフォーアフター写真を月水金に投稿。ハッシュタグは地域名+サロン。' },
    { action_title: '紹介カードを全客に手渡しする', action_detail: '会計時に「ご紹介で次回¥500オフ」カードを全員に渡す。' },
  ],
  attraction: [
    { action_title: '仕上がり直後にその場でGoogle口コミを案内する', action_detail: '施術完了後、スマホでQRコードを見せてその場で投稿してもらう。' },
    { action_title: 'ホットペッパーのクーポンを期間限定で追加する', action_detail: '今週末まで限定のクーポンを1枚追加してアクセス数を上げる。' },
    { action_title: 'リピーター向けDMを送る', action_detail: '3ヶ月以上来ていない既存客にLINEで「お久しぶりクーポン」を送る。' },
  ],
  unit_price: [
    { action_title: 'カラー前にケア提案を1回必ず入れる', action_detail: 'カウンセリング時に必ずトリートメントの提案を1回入れる。断られてもOK。' },
    { action_title: '次回予約時にアップセルメニューを案内する', action_detail: '次回予約確定時に「一緒にトリートメントもいかがですか？」と添える。' },
    { action_title: 'メニュー表の上位メニューを目立たせる', action_detail: 'メニュー表の高単価メニューに★マークを付けて視認性を上げる。' },
  ],
  next_visit: [
    { action_title: '会計時の次回予約案内を徹底する', action_detail: '全スタッフ全客に「次はいつ頃ご来店ですか？」を必ず聞く。' },
    { action_title: '施術中に次回来店時期を口頭で伝える', action_detail: '「このスタイルは○週間後が見頃です」と施術中に必ず伝える。' },
    { action_title: '次回予約特典を設ける', action_detail: 'その場で次回予約した方に¥300割引などのインセンティブを設定する。' },
  ],
}

export function diagnoseIssue(
  thisWeek: WeeklyStoreInput | null,
  lastWeek: WeeklyStoreInput | null,
  config: MonthlyConfig | null,
  prevIssueType?: IssueType,
): DiagnoseResult {
  if (!thisWeek) {
    return { issue_type: 'no_data', issue_cause: 'データ未入力', candidates: [] }
  }

  const avail = thisWeek.availability_score ?? 0
  const weeklyTarget = config != null && config.target_sales != null ? config.target_sales / WEEKLY_WEEKS : 0
  const salesActual = thisWeek.sales ?? 0
  const salesAchievementRate = weeklyTarget > 0 ? salesActual / weeklyTarget : 1

  if (avail >= 4 && salesAchievementRate < 0.9) {
    return buildResult('availability', '予約の空き時間が多い（平日集客が弱い）', prevIssueType)
  }

  const sales = thisWeek.sales ?? null
  const visits = thisWeek.visits ?? null
  const prevSales = lastWeek?.sales ?? null
  const prevVisits = lastWeek?.visits ?? null

  if (sales !== null && visits !== null && prevSales !== null && prevVisits !== null) {
    const newC = thisWeek.new_customers ?? null
    const prevNewC = lastWeek?.new_customers ?? null
    if (newC !== null && prevNewC !== null && prevNewC > 0 && (newC - prevNewC) / prevNewC <= -0.3) {
      return buildResult('new_customers', '新規顧客が先週より30%以上減少している', prevIssueType)
    }
    if (sales < prevSales && visits < prevVisits) {
      return buildResult('attraction', '売上・客数ともに先週を下回っている', prevIssueType)
    }
    const unitPrice = visits > 0 ? sales / visits : null
    const prevUnitPrice = prevVisits > 0 ? prevSales / prevVisits : null
    if (visits >= prevVisits && unitPrice !== null && prevUnitPrice !== null && unitPrice < prevUnitPrice) {
      return buildResult('unit_price', '客数は維持しているが客単価が下がっている', prevIssueType)
    }
    const nextVisit = thisWeek.next_visit_count ?? null
    const prevNextVisit = lastWeek?.next_visit_count ?? null
    if (nextVisit !== null && visits > 0 && prevNextVisit !== null && prevVisits > 0) {
      if (nextVisit / visits < (prevNextVisit / prevVisits) * 0.9) {
        return buildResult('next_visit', '次回予約率が先週より10%以上低下している', prevIssueType)
      }
    }
    return buildResult('ok', '今週の指標は良好です', prevIssueType)
  }

  if (sales !== null && config?.target_sales != null) {
    const ratio = sales / (config.target_sales / WEEKLY_WEEKS)
    if (ratio < 0.7) return buildResult('attraction', '売上が週次目標の70%未満', prevIssueType)
    if (ratio < 0.9) return buildResult('unit_price', '売上が週次目標の90%未満', prevIssueType)
  }

  return buildResult('ok', '今週の指標は良好です', prevIssueType)
}

function buildResult(
  type: IssueType,
  cause: string,
  prevIssueType?: IssueType,
): DiagnoseResult {
  const pool = ACTION_MAP[type] ?? []
  const candidates = rotateCandidates(pool, type === prevIssueType)
  return { issue_type: type, issue_cause: cause, candidates }
}

function rotateCandidates(pool: ActionCandidate[], sameAsLast: boolean): ActionCandidate[] {
  if (pool.length === 0) return []
  if (!sameAsLast) return pool.slice(0, 3)
  return [...pool.slice(1), pool[0]].slice(0, 3)
}

export function issueLabel(type: IssueType): string {
  const MAP: Record<IssueType, string> = {
    no_data: 'データ未入力',
    ok: '現状維持：今の取り組みを継続',
    availability: '平日集客施策不足',
    new_customers: '新規不足',
    attraction: '集客不足',
    unit_price: '単価設計または提案不足',
    next_visit: '次回予約導線不足',
  }
  return MAP[type] ?? type
}
