const ACTIONS: Record<string, string[]> = {
  '次回予約率': [
    '施術中に次回来店時期を必ず口頭で伝える',
    '会計時に次回予約カレンダーを見せる',
    '仕上げ時に「次回は○週間後がベスト」と伝える',
  ],
  '客単価': [
    'カラー前にケア提案を1回必ず入れる',
    'シャンプー時にヘッドスパ案内を全員に行う',
    '施術開始時に悩みを1つ必ず聞く',
  ],
  '口コミ数': [
    '仕上がり直後に口コミ案内をその場で送る',
    '会計時に口コミQRコードを見せる',
    '施術後24時間以内にLINEで口コミ依頼',
  ],
  '売上': [
    '今週の来店予定客にメニューアップのご案内を入れる',
    '既存客への追加メニュー案内を1件試みる',
    'キャンセル枠に既存客の早期再来を促す連絡をする',
  ],
  '客数': [
    '失客リストから1名に来店案内のメッセージを送る',
    '来店から60日以上経つ顧客にフォローLINEを送る',
    'SNSに施術写真を1枚投稿する',
  ],
}

const METRIC_KEY_TO_LABEL: Record<string, string> = {
  unit_price: '客単価',
  repeat_rate: '次回予約率',
  review_count: '口コミ数',
  sales: '売上',
  visits: '客数',
}

export function suggestAction(metricKeyOrLabel: string): string {
  const label = METRIC_KEY_TO_LABEL[metricKeyOrLabel] ?? metricKeyOrLabel
  const list = ACTIONS[label] ?? ['データを確認し、先週と何が違ったか振り返る']
  return list[Math.floor(Math.random() * list.length)]
}
