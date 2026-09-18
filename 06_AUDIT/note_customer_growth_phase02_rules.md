# 顧客向けnote 集客増加 Phase02 運用正本

## 1. 正本境界

- 公開記事のタイトル・本文・リンク・公開状態: 公開note
- 顧客・Visit・顧客単位Decision: Airtable（このリポジトリへPIIを保存しない）
- 公式Webの実装: `ikeda-official-web`
- 集客台帳・監査ロジック・実装履歴: `salon-growth-os`
- GA4: Web行動の観測。実来店や来店理由は推測しない

集客台帳は公開noteから作る派生投影であり、記事本文の複製正本ではない。件数は毎日更新で変わるため、72を固定条件にしない。

## 2. UNKNOWN

空欄を0、NO、未関与として扱わない。次は個別の事実が確認されるまで `UNKNOWN` とする。

- `note_seen`
- `note_decisive`
- `new_visit_involvement`
- 顧客反応
- 検索露出（個別に確認した記事以外）
- 予約・来店への因果
- 情報の現行性

`note_seen=YES` でも `note_decisive=YES` とはしない。

## 3. 記事役割

- `A_ENTRY`: 検索・AI検索・SNS等から最初に出会う入口
- `B_JUDGMENT`: 何を見て、何を変え、何を残し、何をしないかを理解する記事
- `C_CASE`: 出典確認済みの実際の相談・判断・施術事例
- `D_BRIDGE`: 「自分の場合は？」から公式Web・来店前相談等へ進む記事

主役割は1つ。副役割は複数可。自動分類は運用候補であり、顧客事実の認定ではない。`C_CASE` は実在証拠がなければ付けない。

## 4. 主要テーマ

正式な主要5テーマ:

1. `CEP1_CHANGE_WITHOUT_FAILURE`
2. `CEP2_GRAY_HAIR_NOT_DARK`
3. `CEP3_FRIZZ_DECISION`
4. `CEP4_SHORT_HAIR_ANXIETY`
5. `CEP5_LIGHT_NOT_THIN`

実在する公開記事から、次を第6・第7テーマ候補として保持する。

- `CEP6_COLOR_DECISION_CANDIDATE`
- `CEP7_CARE_SCALP_CANDIDATE`

候補を正式テーマへ昇格するかはHuman Gate。検索語だけで悩みを新設しない。

## 5. UTM

noteから公式Webへの主要導線:

- `utm_source=note`
- `utm_medium=article`
- `utm_campaign` は下表の固定値

|theme|campaign|
|---|---|
|CEP1_CHANGE_WITHOUT_FAILURE|change_without_failure|
|CEP2_GRAY_HAIR_NOT_DARK|gray_hair_not_dark|
|CEP3_FRIZZ_DECISION|frizz_decision|
|CEP4_SHORT_HAIR_ANXIETY|short_hair_anxiety|
|CEP5_LIGHT_NOT_THIN|light_not_thin|
|CEP6_COLOR_DECISION_CANDIDATE|color_decision|
|CEP7_CARE_SCALP_CANDIDATE|care_scalp|
|CROSS_THEME_BRIDGE|preconsult_bridge|

note→noteはcanonical URLのみとし、`utm_source=chatgpt.com` を含む追跡パラメータを除く。既存の異なるcampaignは自動置換せず、互換性確認の候補にする。

## 6. 新規来店との接続項目

個人情報をGitHubへ保存しない。Airtable等の正本側で次を別項目として保持し、`salon-growth-os` には匿名集計・記事IDだけを投影する。

- 来店前の困りごと
- 最初に知った経路
- 予約前に見たもの・使ったもの
- `note_seen`
- `note_article_ids_seen`
- `note_decisive`
- 最終的に選んだ理由
- 相談利用
- LINE利用
- 予約経路
- 新規来店確認日
- 確認方法
- UNKNOWN理由

検索→note→公式Web→相談→LINE→予約→来店を一つのセッションで追えない場合、欠落を推測で接続しない。

## 7. 毎日更新Gate

入力の優先順位は、実際の相談、実際の施術判断、今回はしなかった判断、次回来店確認、新規客の選択理由、実際のLINE質問、検索データ、SNS反応、外部トレンド。

`scripts/note_customer_growth_daily_gate.py` の最低入力:

- `source_provenance`
- `customer_question_or_observation`
- `professional_judgment`
- `search_intent`
- `next_step`

判定順:

1. 証拠不足なら `HOLD_MISSING_EVIDENCE`
2. 同一疑問・意図の既存記事があれば `UPDATE_EXISTING`
3. 既存記事接続で答えられるなら `ADD_INTERNAL_LINK`
4. 既存記事では答えられず、実在証拠・異なる意図・自然な次行動が揃う場合だけ `NEW_ARTICLE_CANDIDATE`

全結果は `HUMAN_REVIEW_REQUIRED`。自動公開しない。

## 8. 優先順位

PV順にしない。観測できた次の状態に点数を付け、重みはコードで調整可能にする。

- 検索露出があるのに行動経路がない
- 旧LINE
- ブランド表現候補
- note内部UTM汚染
- 公式Web UTM違反
- 孤立
- 主要テーマ・役割未確認

検索露出・実来店関与・現行性がUNKNOWNの場合は0点扱いせず、未評価として残す。

## 9. Human Gate

次は自動実行しない。

- note本文・タイトル・公開状態の変更
- LINE、BeautyMerit、LifeKarte内部操作
- 顧客個人情報の取得・保存
- 顧客反応・来店理由・施術成果の補完
- 第6・第7テーマの正式採用
- PR merge、main反映、公開

機械検出は `検出 → 人間確認`。類似記事は即統合しない。

## 10. 再生成と監査

Python 3.11以上の実体を使う。Windows Storeの実行スタブをPython実体として扱わない。

```powershell
python scripts/note_customer_growth_build.py `
  --config 06_AUDIT/note_customer_growth_phase02_config.json `
  --legacy-registry <既存70記事台帳の読み取り専用パス> `
  --output-dir 06_AUDIT `
  --as-of YYYY-MM-DD

python scripts/note_customer_growth_audit.py `
  06_AUDIT/note_customer_growth_phase02_articles_YYYY-MM-DD.csv `
  --links 06_AUDIT/note_customer_growth_phase02_links_YYYY-MM-DD.csv `
  --fail-on-p0

python -B scripts/note_customer_growth_phase02_test.py
```

初回の既存分類は `ikeda-official-web` の70記事台帳を読み取り専用で再利用した。以後も公開noteを本文正本とし、別リポジトリの一次データを書き換えない。
