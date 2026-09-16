# 顧客向けnote 集客増加 Phase02 統合監査

監査日（JST）: 2026-09-16

## 1. 結論

- 公開note APIの現在値は **74記事**。Phase01指示書の72記事は時点値であり、毎日更新により固定件数ではなくなっている。
- 公開API reported_total_count: 74。台帳はunique article_idで74件。
- 本台帳は公開記事の派生運用投影。記事本文の正本はnote、顧客・来店・因果の未確認値はUNKNOWN。
- 機械検査P0: **0**（公開失敗、完全同一タイトル、LifeKarte直リンクのみ）。リンク先HTTP到達性と実来店は別途UNKNOWN。
- 確定P1作業: **12件**。自動候補はHuman Reviewなしに公開変更へ進めない。

## 2. PR #66再検証で判明したこと

PR #66の従来監査は変更4記事＋影響1記事の5行だけを対象にしていた。そのため、従来のP0=0・近似タイトル0は全記事結論ではなかった。Phase02では公開API全件を再取得し、記事ID・本文リンク・アンカーテキストから再計算する。

## 3. 記事役割

- A_ENTRY: 36
- B_JUDGMENT: 33
- C_CASE: 1
- D_BRIDGE: 4
- UNKNOWN: 0

主要テーマ:
- CEP1_CHANGE_WITHOUT_FAILURE: 16
- CEP2_GRAY_HAIR_NOT_DARK: 9
- CEP3_FRIZZ_DECISION: 20
- CEP4_SHORT_HAIR_ANXIETY: 2
- CEP5_LIGHT_NOT_THIN: 14
- CEP6_COLOR_DECISION_CANDIDATE: 5
- CEP7_CARE_SCALP_CANDIDATE: 2
- CROSS_THEME_BRIDGE: 3
- OTHER: 3

役割は既存70記事台帳を優先し、新規記事のみ明示ルールで候補化した。役割は運用分類であり、顧客事実や来店効果の認定ではない。

## 4. 内部リンクグラフ

- 記事間・外部導線edge: 387
- note記事間edge: 197
- 孤立記事: 17
- 一方向note edge: 174
- 2記事以上の循環component: 4（行動導線なし: 0）
- 最大incoming集中率: 19.8%（全note edge比）
- 旧LINEを含む記事: 9
- LifeKarte直リンク記事: 0
- path_to_* は本文リンクだけから計算。noteプロフィール導線やユーザーの記憶を暗黙の経路にしない。
- 検索意図の異なる不自然な接続は機械確定せず、キューでHuman Reviewする。

incoming上位: nacbe18cfbbc2=39, ne5cd7acfddda=24, n61dedbe2b8f9=12, n341eb4c05451=10, n47ad7c3d95fe=10

## 5. 重複・カニバリ候補

- 完全同一タイトル: 0組
- 近似タイトル候補: 0組
- 検索意図重複候補: 15組
- 候補は統合命令ではない。同じ人が同じ瞬間に同じ答えを求めるかをHuman Reviewする。

## 6. 主要5テーマの最短経路

|theme|content coverage|live links|missing|entryから行動導線|
|---|---|---|---|---|
|CEP1_CHANGE_WITHOUT_FAILURE|PARTIAL|PARTIAL_OR_NOT_IMPLEMENTED|case|n2e003f966836 -> SINK:CONSULTATION|
|CEP2_GRAY_HAIR_NOT_DARK|PARTIAL|PARTIAL_OR_NOT_IMPLEMENTED|case|n341eb4c05451 -> SINK:CONSULTATION|
|CEP3_FRIZZ_DECISION|COMPLETE|PARTIAL_OR_NOT_IMPLEMENTED|NONE|n775b67a5339c -> SINK:CONSULTATION|
|CEP4_SHORT_HAIR_ANXIETY|PARTIAL|PARTIAL_OR_NOT_IMPLEMENTED|case|nc947fab7f07e -> SINK:CONSULTATION|
|CEP5_LIGHT_NOT_THIN|COMPLETE|PARTIAL_OR_NOT_IMPLEMENTED|NONE|n74441a2a58a7 -> SINK:CONSULTATION|

ケースがUNKNOWNのテーマは、見栄えのために架空事例を補わない。既存の確認済み事例を探し、なければ実際の施術事例が生まれるまでPARTIALを維持する。

## 7. 顧客の迷いの空白

|theme|status|missing stages|解消順|
|---|---|---|---|
|CEP1_CHANGE_WITHOUT_FAILURE|PARTIAL|post_treatment_change|既存追記 → 既存接続 → 新記事|
|CEP2_GRAY_HAIR_NOT_DARK|COMPLETE|NONE|既存追記 → 既存接続 → 新記事|
|CEP3_FRIZZ_DECISION|COMPLETE|NONE|既存追記 → 既存接続 → 新記事|
|CEP4_SHORT_HAIR_ANXIETY|PARTIAL|method_comparison;post_treatment_change|既存追記 → 既存接続 → 新記事|
|CEP5_LIGHT_NOT_THIN|COMPLETE|NONE|既存追記 → 既存接続 → 新記事|

各stageの記事IDはgap matrix CSVに保存した。UNKNOWNを新記事で即充足せず、実在証拠のある既存記事追記を先に検討する。

## 8. 計測接続

|段階|状態|根拠|
|---|---|---|
|検索→note|PARTIAL|一部記事の検索露出はPhase01記録で確認。全記事・継続順位はUNKNOWN。|
|note→公式Web|PARTIAL|本文リンクは公開APIで確認できるが、GA4のnote_clickは期間内未観測。|
|公式Web→相談|PARTIAL|consultation_click受信記録あり。個別note記事との連結はUNKNOWN。|
|相談→LINE|UNKNOWN|line_clickは期間内未観測。|
|LINE→予約|UNKNOWN|reservation_clickは期間内未観測。|
|予約→新規来店|UNKNOWN|GA4で実来店を推測しない。|

記事台帳は note_seen / note_decisive / new_visit_involvement を分離し、初期値をすべてUNKNOWNとした。

## 9. 毎日更新

`scripts/note_customer_growth_daily_gate.py` は、実際の相談・判断・今回はしなかったこと・出典が入力されない限り新記事候補を出さない。既存記事との近似が強い場合はUPDATE_EXISTING、経路不足ならADD_INTERNAL_LINKを優先する。判定は公開指示ではなく候補。

## 10. 残る不確実性

- 公開APIは記事本文とリンクの事実を示すが、検索順位、GA4受信、予約、実来店、選択理由を示さない。
- 検索意図・一次情報強度・主CTAの自動分類は運用候補でありHuman Review対象。
- link_statusのHTTP全件疎通、note実画面のスマートフォン表示、GA4 Realtime、BeautyMerit/LifeKarte内部は未確認。
- Phase01の72記事という件数は現在値ではない。今後も固定件数を成功条件にしない。

## 11. 正本ファイル

- `note_customer_growth_phase02_articles_2026-09-16.csv`: 記事集客台帳
- `note_customer_growth_phase02_links_2026-09-16.csv`: 記事間リンク構造
- `note_customer_growth_phase02_theme_paths_2026-09-16.csv`: 主要5テーマ経路
- `note_customer_growth_phase02_theme_gap_matrix_2026-09-16.csv`: 7段階の迷い・空白
- `note_customer_growth_phase02_queue_2026-09-16.csv`: P1/P2変更指示
- `note_customer_growth_phase02_rules.md`: UTM・来店接続・毎日更新・Human Gate
