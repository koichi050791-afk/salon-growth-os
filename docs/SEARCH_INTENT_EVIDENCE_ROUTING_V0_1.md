# SEARCH_INTENT_EVIDENCE_ROUTING_V0_1

目的:
地域美容集客で「検索語を取る」のではなく、顧客の迷いを既存Evidence・Decision・相談導線へ接続する。
三田で検証し、2028年の尼崎でも同じ方法を再利用する。


## 0. 実装境界

この文書はRouting protocolの正本であり、2026-09-19時点でSearch Intent分類器がサーバー上で自動実行されていることを意味しない。

既存Salon Growth OSにはDecisionCaptured / NextObservationCreatedのWork GraphとKnowledge Candidate判定があるが、Work GraphのAgent runは現在AUTO metadataのみで、Decision本文を読んでSearch Intentを分類する実行器はない。

利用先がない状態で新しいruntime classifierを追加すると複雑性だけが増えるため、Phase71では実装しない。

当面はChat / Codex / WorkがDecisionを扱う際に本protocolを適用する。
今後、同じ分類が反復的な手作業になり、既存Work Graphの実処理先ができた時だけ自動実装を検討する。


## 1. 入力

検索意図を次の4要素へ分解する。

- WANT: どうなりたいか
- AVOID: 何を避けたいか / 不安か
- UNKNOWN: 自分で決められないこと
- CONTEXT: 年代、生活、履歴、地域など判断に影響する確認済み条件

例:
「白髪ぼかしが気になる。でもハイライトが本当に必要か分からない」

WANT = 白髪を今より自然に扱いたい
AVOID = 不要な施術 / 派手さ / ダメージ
UNKNOWN = ハイライトの必要性
CONTEXT = 現在の白髪、カラー履歴、明るさ希望など。Web検索文だけでは未確認。

UNKNOWNやCONTEXTをAIが勝手に埋めない。

## 2. 最初に既存資産を探す

優先順位:

1. 既存concern
2. decision-room / questions
3. 既存note
4. REAL Decision
5. 公開済みReal Case
6. 来店前相談
7. 新規制作

新規記事・新規ページは最後。

## 3. 状態分類

### COVERED
既存資産だけで、迷い→判断軸→相談導線まで説明できる。

Action:
新規制作しない。
Conversion / Outcomeを観測。

### DISCOVERY_ONLY
検索・SNSで見つかる記事はあるが、公式Webの判断・相談へ接続が弱い。

Action:
新規記事ではなく内部導線を改善。

### EVIDENCE_GAP
説明コンテンツはあるが、REAL Decision / Outcomeが不足。

Action:
現場入力を増やさず、既存Decision記録から同型REALを待つ。
TESTで埋めない。

### CONVERSION_GAP
発見・説明・Evidenceはあるが相談 / 予約 / 来店へつながった確認がない。

Action:
CTAを増やす前に現行導線とイベントを確認。
単一反応から因果を断定しない。

### NEW_DEMAND
既存資産で十分に答えられず、複数の外部観測またはREAL相談で繰り返し発生。

Action:
初めて新規コンテンツ候補にする。

## 4. REAL Decision Routing

AirtableにDecisionが追加・更新されたらAI側で自動判定する。

1. dataKindを確認
2. REAL以外は公開Evidence候補にしない
3. consultation / confirmed facts / selected method / deliberately not selected / reason / next observationを確認
4. WANT / AVOID / UNKNOWNへ変換
5. 既存Search Intentと照合
6. 0〜複数Intentへ内部タグ付け
7. Outcome未確認なら未確認のまま保持
8. Case Publication Gateを判定
9. 同型Decisionを検索
10. 複数回のOutcomeで再利用価値がある場合だけKnowledge Candidate

新しい手入力欄は作らない。

## 5. Case Publication Gate

最低条件:

- dataKind = REAL
- consultationあり
- confirmed factsあり
- selected methodあり
- deliberately not selectedあり
- reasonあり
- next observationあり
- 顧客特定情報を含めない

写真、感想、Outcomeは確認済みのみ。

AIができること:
- Gate判定
- 匿名化
- Caseドラフト
- 既存note/Webとの接続候補
- 重複検査

Human Gate:
- 公開最終採用
- 写真使用
- ブランド上重要な表現変更
- Knowledge正式採用

## 6. Content Gate

新規制作前に必ず確認:

- 本当に新しい問題か
- 既存記事更新で済まないか
- concern / decision-room / FAQで受けられないか
- REAL Decisionまたは繰り返し観測があるか
- 公開後に相談へ接続できるか
- 現在の一点突破テーマを薄めないか
- 2028年にも判断構造として残るか

弱い場合はHOLD。

## 7. Conversion Canonical

Discovery
→ note / SNS / Search
→ official concern / decision-room
→ previsit consultation
→ specific booking / LINE
→ Visit
→ REAL Decision
→ Next Observation
→ Case / Knowledge Candidate

予約内部はAI操作対象外。

## 8. Human Gateを呼ばない通常処理

AI側だけで実施:

- Search Intent分類
- 既存資産検索
- 重複判定
- Evidence gap判定
- Case Gate判定
- CTAリンク検査
- 壊れた公開リンク検査
- Outcome未確認の維持
- 次回観察候補抽出
- 既存Knowledgeとの矛盾検査

池田へ上げるのは例外だけ。

## 9. Human Gate条件

- 公開CaseがGate通過した
- 顧客写真 / 詳細情報を使う
- Outcomeが既存Knowledgeと矛盾
- 同型REALが複数成立しKnowledge候補になった
- ブランド本体を変える判断が必要
- URL削除 / 大規模導線変更 / 予約仕様変更
- 外部サービスのログイン / 本人認証が必要

## 10. 地域移植

三田→尼崎で変えるもの:
- 地域名
- 競合
- ローカル検索結果
- 実際の顧客相談
- 店舗情報

変えないもの:
- WANT / AVOID / UNKNOWN / CONTEXT分解
- Source of Truth
- REAL Gate
- Case Gate
- Content Gate
- Conversion Loop
- Human Gate

地域ごとの勝ち筋をコピーするのではなく、勝ち筋を発見する方法をコピーする。

## 11. 成功判定

最上位:
過去の観察・Decisionが次の顧客判断を良くしたか。

事業:
Decision-before-menu構造が相談 / 予約 / 来店 / 再来へ関与したか。

補助:
表示、PV、いいね、順位。

補助指標だけで勝ち筋確定しない。
