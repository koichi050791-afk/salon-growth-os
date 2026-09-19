# Phase71｜三田 Search Intent × Evidence × Decision × Conversion 監査

作成日: 2026-09-19  
対象: 池田航一 顧客集客 / SARAJU三田店  
親Issue: #74  
前提Phase: #68〜#72  
目的: 記事数を増やすことではなく、三田の「施術名になる前の迷い」を、発見→判断→相談→来店→Decision→学習へ接続する。

## 0. 結論

三田で競争が強いのは、ショート、レイヤー、白髪ぼかし、髪質改善、縮毛矯正などの施術名・技術名。

一方、公開情報が薄くなりやすいのは次の型。

- Aしたい。でもBは嫌 / 不安
- 自分にはどの施術が必要か分からない
- 何を予約すればよいか分からない
- 複数の悩みがあり優先順位が分からない

池田の既存noteと公式Webは、このDecision前の検索にすでに相当量対応している。

したがってPhase71では12テーマ分の新規記事・新規LPを作らない。
既存資産の役割を固定し、REAL Decisionが増えたテーマだけEvidenceを厚くする。

Phase70の「軽くしたい。でもスカスカは嫌」は引き続き一点突破テーマ。
Phase71は他テーマを同時拡張するPhaseではなく、横展開できる状態を先に監査・整備するPhase。

---

## 1. Source of Truth

- Customer / Visit / Decision / Future Plan: Airtable
- 公開Web: https://ikeda-official-web.pages.dev/
- 顧客向けnote: https://note.com/koichi_ikeda
- 実装・監査履歴: GitHub
- BeautyMerit: 予約内部は操作しない。公開予約導線のみ確認対象。
- GSC: 2026-09-19時点ではGSC Wizard契約終了により最新取得不可。既存settled baselineは過去値としてのみ扱う。

Customer Truth / Professional Hypothesis / Outcomeは混同しない。
TEST / Sampleを実在Caseとして公開しない。
Outcome未確認は未確認のまま残す。

---

## 2. Canonical Conversion Route

Search / AI Search / Threads
→ note（発見）
→ 公式Web concern / decision-room / questions（判断）
→ 来店前相談（個別整理）
→ 池田専用BeautyMerit または LINE
→ 来店
→ REAL Decision
→ Next Observation
→ 条件が揃った場合のみCase候補
→ 複数Decision/Outcomeで再利用価値が確認された場合のみKnowledge候補

### 正本URL

公式Web:
https://ikeda-official-web.pages.dev/

髪の判断室:
https://ikeda-official-web.pages.dev/decision-room/

来店前相談:
https://ikeda-hair-consultation.ikedakoichi7326.chatgpt.site/

相談完了後:
https://ikeda-official-web.pages.dev/consult/complete/

池田専用BeautyMerit:
https://y7xzhn-google.b-merit.jp/n3icrs/web/reserve1/?shop_user_id=210872

LINE:
https://lin.ee/hX5uJxc

### 非正本

https://ikeda-official-web.pages.dev/consult/
→ 404。今後リンク先として使用しない。

https://y7xzhn-google.b-merit.jp/n3icrs/web/
→ 店舗全体クーポン一覧。池田専用導線としては使用しない。

LINEの https://lin.ee/rG3y2px は同じ @070nhgaa に到達するため壊れてはいない。
新規・更新コンテンツでは hX5uJxc に統一し、既存記事は一括置換しない。

---

## 3. 12 Search Intent Matrix

### I01｜短くしたい。でも似合わなかったら怖い

Discovery:
- note nd57e9bec3cca が「0か100かで変えなくてもいい」「短くして似合わなかったら」を直接扱う。

Official receiver:
- /concerns/short-hair-anxiety/
- /decision-room/
- /first-visit/

Decision evidence:
- 2026-06-28のDecisionは「少し変えたい / 扱いにくくしたくない」「顔まわりのみ変更」と強く一致するが dataKind が空欄。
- REALとして公開Evidenceへ昇格しない。

Case:
- 専用Caseなし。現時点では作らない。

Status:
- Discovery: 強
- Decision explanation: 強
- REAL evidence: 不足
- Conversion: 整備済み
- Action: 次のREAL Decision待ち。新規記事不要。

### I02｜毛量が多く広がる。でもスカスカにはしたくない

Discovery:
- na96e09757a47
- n74441a2a58a7

Official receiver:
- /concerns/light-without-thinning/
- /cases/light-without-thinning/
- /questions/

Decision evidence:
- 実在Caseに必要な「相談 / 判断材料 / やった / やらなかった / 理由 / 次回確認」が揃う。

Case:
- Case 01公開済み。

Status:
- 現在の一点突破テーマ。
- Phase70 Issue #72上の証拠レベルはL2。
- Action: 新規コンテンツを増やさず、相談 / 予約 / 来店のL3確認を待つ。

### I03｜長さを変えたくない。でも雰囲気は変えたい

Discovery:
- n2e003f966836
- nd57e9bec3cca

Official receiver:
- /questions/
- /decision-room/

Decision evidence:
- 2026-06-28 Decisionが高一致。
- dataKind空欄のためREAL扱い不可。

Case:
- なし。

Status:
- Discovery: 強
- 判断説明: 強
- REAL evidence: 未確定
- Action: 新ページ不要。次のREAL Decisionで同型が出た時だけCase候補判定。

### I04｜レイヤーを入れたい。でも自分の髪質に合うか分からない

Discovery:
- n5c2fec4b2172
- n2e003f966836
- Phase70関連note群

Official receiver:
- /questions/
- /decision-room/
- /concerns/light-without-thinning/（スカスカ不安を伴う場合）

Decision evidence:
- REAL 2026-08-19は毛量 + ハイライト判断で、レイヤー適否の直接Evidenceではない。
- TESTに近い例はあるが公開Evidenceへ使用しない。

Status:
- Content coverage: 強
- REAL evidence: 不足
- Action: 記事追加よりREAL Decision待ち。

### I05｜40代・50代で今までの髪型が似合わなくなった気がする

Discovery:
- nb789bf9f1294

Official receiver:
- /about/
- /decision-room/
- /first-visit/

Decision evidence:
- 年代だけを根拠にしたREAL Decisionは採用しない。
- 年代ではなく現在の髪 / 生活 / 希望 / 不安をDecision条件にする。

Status:
- Discovery: 強
- Brand fit: 強
- REAL evidence: テーマ固有では不足
- Action: 「40代50代」をCase条件にせず、実際の迷い構造で分類する。

### I06｜白髪は隠したい。でも暗く重くしたくない

Discovery:
- n857bdffbf113
- n7abf88d82b87
- n341eb4c05451

Official receiver:
- /concerns/gray-hair-without-darkening/
- /decision-room/
- /questions/

Decision evidence:
- REAL 2026-08-19: 白髪増加を確認、明るめハイライト希望、ハイライト量増、サイド量を取りすぎない。
- ValidationはUNVALIDATED。

Case:
- 専用Caseなし。

Status:
- Discovery / explanation: 強
- REAL evidence: あり、Outcome不足
- Action: Outcome / 次回観察を優先。新規記事不要。

### I07｜白髪ぼかしが気になる。でもハイライトが本当に必要か分からない

Discovery:
- n7abf88d82b87 は「白髪がある＝ハイライト」ではないと明記。
- n857bdffbf113 は「白髪ぼかしやハイライトが自分に必要なのか」を直接扱う。

Official receiver:
- /concerns/gray-hair-without-darkening/
- /decision-room/

Decision evidence:
- REAL 2026-08-19はハイライトを選んだ例。
- 「ハイライトを選ばなかったREAL Decision」の証拠は不足。

Status:
- Search-intent fit: 強
- Comparative evidence: 片側のみ
- Priority evidence gap: 高
- Action: 今後REALで「ハイライトをしない理由」が出た時に優先的にCase候補へ。架空で補わない。

### I08｜うねり・広がりは何とかしたい。でも不自然な縮毛矯正は嫌

Discovery:
- n775b67a5339c
- Decision Room関連note n47ad7c3d95fe
- n670a62197b88

Official receiver:
- /decision-room/
- /questions/
- /menu/

Decision evidence:
- REAL 2026-08-21は顔周りのクセを伸ばす / 耳前を減らしすぎない判断。
- 10代既存客であり、今回の大人女性検索意図の代表Caseには使わない。
- Validation UNVALIDATED。

Status:
- Explanation: 強
- Target-matched REAL evidence: 不足
- Action: 大人女性のREALが出るまで専用Caseを作らない。

### I09｜艶はほしい。でも髪質改善・TR・縮毛矯正のどれが必要か分からない

Discovery:
- n775b67a5339c
- n282cb4929242
- n670a62197b88
- Decision Room関連note na5434691367f

Official receiver:
- /decision-room/
- /questions/
- /menu/

Decision evidence:
- 3選択肢を比較したREAL Decisionは現時点で不足。

Status:
- Content: 強
- Comparative REAL evidence: 不足
- Priority evidence gap: 高
- Action: 新規記事ではなく、今後のREAL Decisionで「比較した選択肢 / 選ばなかった理由」を確実に残す。入力項目は増やさない。

### I10｜前髪・顔周りだけ変えたい。でも何が似合うか分からない

Discovery:
- n2e003f966836
- nd57e9bec3cca

Official receiver:
- /questions/
- /decision-room/

Decision evidence:
- 2026-06-28 Decisionが強く一致するが dataKind空欄。
- REAL昇格不可。

Status:
- Discovery / explanation: 強
- REAL evidence: 不足
- Action: 同型REAL待ち。

### I11｜白髪・うねり・ボリュームなど複数の悩みをまとめて相談したい

Discovery:
- n27c3d56b341b
- n775b67a5339c

Official receiver:
- /concerns/what-to-book/
- /decision-room/
- /first-visit/
- /about/

Decision evidence:
- 複数悩みを一つの施術へ即変換しないこと自体はブランド/判断室で説明済み。
- テーマ専用Caseは不要。

Status:
- Brand fit: 非常に強
- Conversion fit: 強
- Action: 「複数悩み専用ページ」を増やさず、what-to-book / previsit consultationへ統合。

### I12｜髪型やメニューを決めず、まず相談してから予約したい

Discovery:
- n34713b0fb6e9
- n27c3d56b341b

Official receiver:
- home previsit block
- /concerns/what-to-book/
- /first-visit/
- /questions/
- consultation ChatGPT site
- /consult/complete/

Conversion:
- 最大5問 / 3〜5分
- 個人情報入力不要
- AIが施術を診断しない
- 相談メモを予約備考 / LINE / 来店時提示
- 最終判断は来店後

Status:
- Owned UX: 最も強い差別化資産の一つ
- Next bottleneck: コンテンツ不足ではなく利用→予約→来店の計測
- Action: 新規記事不要。実際の相談 / 予約 / 来店関与を観測する。

---

## 4. P0｜今すぐ直すべきこと

### P0-1 note公開プレースホルダー

対象:
https://note.com/koichi_ikeda/n/n857bdffbf113

公開中の文字列:
「※先ほど更新した白髪記事へのリンクをここに設定してください。」

正しいリンク先を公開確認済み:
https://note.com/koichi_ikeda/n/n7abf88d82b87

2026-09-19、ブラウザ自動修正を試行したがnote認証情報が利用できず、変更せず停止。
ここだけ外部認証Human Gate。

### P0-2 BeautyMerit導線

generic:
https://y7xzhn-google.b-merit.jp/n3icrs/web/

→ 店舗全体クーポン一覧。池田以外のスタッフメニューも表示。

canonical:
https://y7xzhn-google.b-merit.jp/n3icrs/web/reserve1/?shop_user_id=210872

→ 池田限定メニューが表示される。

既存noteを一括編集しない。
今後記事を更新する機会があった時だけcanonicalへ交換する。

### P0-3 /consult/ を使わない

/consult/ は404。
sitemapにも含まれていない。

正本:
- home内来店前相談
- ChatGPT相談サイト
- /consult/complete/

---

## 5. Case Publication Gate

公開Case候補にする最低条件:

1. dataKind = REAL
2. 今回の相談が記録されている
3. 確認した事実が記録されている
4. 比較した選択肢が分かる、または少なくとも選択理由を説明できる
5. 選んだ方法が記録されている
6. あえてしなかったことが記録されている
7. 理由が記録されている
8. 次回確認が記録されている
9. 顧客を特定する情報を公開しない
10. 写真 / 感想 / Outcomeは確認できたものだけ

Gate未達:
- TEST / Sample
- dataKind空欄
- 理由不明
- OutcomeをAIが推測
- 「年代的にこう」など事実でない一般化

AI/CodexはGate判定と匿名ドラフトまで可能。
公開最終採用、写真利用、Knowledge正式採用だけHuman Gate。

---

## 6. 自動で回してよい運用

池田の追加入力は増やさない。

既存Decision入力後にAI側で:

1. REAL / TEST / 不明を確認
2. 12 Search Intentへ0〜複数タグ付け
3. Evidence不足フィールドを検出
4. Outcome / Next Observationの未確認を維持
5. Case Publication Gateを自動判定
6. Gate通過候補だけ「Case候補」とする
7. 過去Decisionと同型が複数回出た場合のみKnowledge Candidate化
8. 公開資産への接続候補を提案
9. 既存記事で答えられるなら新記事を作らない

通常時は池田へ通知しない。

Human Gateへ上げる条件:
- 公開Case候補がGate通過
- 既存Knowledgeと矛盾するOutcomeが出た
- 同じDecisionパターンが複数回成立し再利用価値が出た
- 外部公開に顧客写真 / 詳細情報が必要
- ブランド定義を変える必要がある
- 既存ページ削除 / 大規模URL変更 / 予約導線変更が必要

---

## 7. 新規コンテンツGate

新記事 / 新ページを作る前に:

1. 本当に新しい顧客疑問か
2. 既存72記事の更新で済まないか
3. 既存concern / decision-room / questionsで受けられないか
4. REAL Decisionまたは繰り返し観測された一次情報があるか
5. 公開後に相談 / 予約へ自然につながるか
6. Phase70一点突破の検証を邪魔しないか
7. 2028年尼崎でも再利用できる判断構造か

1つでも弱ければ原則HOLD。

---

## 8. 今後の優先順位

### 維持
I02「軽くしたい。でもスカスカは嫌」
→ Phase70のL3確認まで一点突破を維持。

### Evidence gapとして観測
I07「白髪ぼかし / ハイライトが本当に必要か」
I09「髪質改善 / TR / 縮毛矯正のどれか」
→ 記事追加ではなくREAL Decision収集。

### Conversion観測
I12「何を予約すればいいか分からない」
→ previsit consultation → booking / LINE → visitの実利用。

### 新規強化しない
それ以外は既存資産で十分に説明可能。
REAL evidenceが増えるまで追加制作しない。

---

## 9. Measurement

最上位:
- このDecision-before-menu構造が関与した新規来店数

先行:
- note → official Web
- concern / decision-room → previsit consultation
- previsit consultation → reservation / LINE
- 来店時に本人が明示したFirst Touch / 検討接点 / 選択理由
- REAL Decisionの蓄積数
- Case Publication Gate通過候補数

補助:
- 表示数
- PV
- いいね
- フォロワー

単一日の結果、単一投稿、単一顧客から因果を断定しない。

---

## 10. GSC制約

2026-09-19にGSC Wizard MCPを確認したが、trial終了 / subscriptionなしで最新データ取得不可。

そのため、既存の9月中旬settled baselineを最新値として扱わない。
Search Consoleの最新数値が必要な意思決定は、接続復旧または別の実画面確認まで保留。

この制約は、今回の構造監査・公開導線監査・Airtable Evidence監査の成立には影響しない。

---

## 11. 2028年へ残すもの

残すのは「三田で上位表示した記事一覧」ではない。

残すもの:
- 地域のDecision-before-menu検索意図を発見する方法
- 競合が施術名で強い時に、迷い構造へ単位を変える方法
- Search IntentとREAL Decisionを接続する方法
- Caseを架空で増やさないEvidence Gate
- 既存コンテンツを再利用して新規制作を減らすルール
- 相談→予約→来店→Outcomeへ戻すConversion Loop
- 三田から尼崎へ移植可能な監査単位

最終評価:
「過去の経験が次の顧客判断を良くしたか」でKnowledge価値を判定する。
