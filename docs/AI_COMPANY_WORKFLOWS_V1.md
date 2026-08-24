# AI Company Workflows v1

更新: 2026-08-25

この文書は、断捨離後のAI会社における4つのValue Streamの標準Workflow正本とする。

## 0. Operating model

中核構造:

- Human CEO: 池田航一
- AI Chief of Staff: ChatGPT
- 4 Core Agents
  - Salon & Customer Intelligence
  - Decision & Learning Intelligence
  - Growth & Market Intelligence
  - Content & Product Intelligence
- Shared Capabilities
  - Quality & Brand QA
  - Approval Policy
  - Evidence Resolver
  - Trigger / Scheduler
  - Run History

旧来の部署名はLegacy Domain Labelとしてのみ参照し、固定組織としてWorkflowを所有しない。

## 1. Common workflow contract

すべてのValue Streamは次を共通骨格とする。

```text
Reality / Input
→ Problem Gate
→ Value Gate
→ Build / Action Gate
→ AI Processing
→ Quality Gate
→ Human Decision
→ Execution
→ Outcome Gate
→ Learning / Next Problem
```

Outputを生成した時点では完了としない。Outcomeまたは「実行しないことが妥当」と確認できるまで閉じない。

### 1.1 Problem Gate

確認する:
- 何が実際に起きたか
- 事実と解釈が分離されているか
- 本当に解くべき問題か
- 誰にとっての問題か
- 一次情報は何か

Gate結果:
- PASS
- NEED_MORE_EVIDENCE
- STOP

### 1.2 Value Gate

確認する:
- 解く価値があるか
- 顧客価値 / 判断価値 / 学習価値のどれに効くか
- 発生頻度と影響は十分か
- 今やる優先度があるか

Gate結果:
- PROCEED
- HOLD
- DROP

### 1.3 Build / Action Gate

確認する:
- 作らずに検証できないか
- 既存Core Agent / Shared Capabilityで代替できないか
- temporary subagentで十分ではないか
- 最小の可逆的アクションは何か
- 維持コストは許容できるか

正常な結果:
- BUILD / ACT
- TEST_MANUALLY
- REUSE_EXISTING
- DO_NOT_BUILD
- DO_NOT_ACT

### 1.4 Quality Gate

AI自己評価だけでは通過しない。

確認する:
- Source of Truthと整合するか
- 事実 / 仮説 / 意見が分離されているか
- 顧客・ブランド・公開リスクがないか
- 重要判断は反証されたか
- fresh contextによる独立検証が必要か

重要案件では:
1. Builderが案を作る
2. Criticが壊しにいく
3. VerifierがCriticの指摘も再検証する
4. Humanが最終判断する

### 1.5 Outcome Gate

確認する:
- 現実にどんな変化が起きたか
- 顧客価値は増えたか
- Human Decision Productivityは改善したか
- 作業負荷 / 管理負荷は増えていないか
- 仮説は supported / partially supported / contradicted / insufficient evidence のどれか

Outcomeが未確認ならEvidenceへ昇格させない。

## 2. Common Standard Return

Chief of Staffは各Streamの出力を原則以下に圧縮する。

```text
今見るべき3点
今やる1点
今はやらないこと
池田判断が必要な点
Evidence / Source of Truth
Outcome確認方法
```

大量分析をそのままCEOへ渡さない。

---

# 3. Customer Experience Stream

## 3.1 Purpose

施術完了ではなく、今回の相談から次回来店時の答え合わせまでを一つの顧客価値として閉じる。

## 3.2 Primary owners

Primary Core Agents:
- Salon & Customer Intelligence
- Decision & Learning Intelligence

Support:
- Evidence Resolver
- Quality & Brand QA
- Approval Policy

Human Owner:
- 池田航一

## 3.3 Input

優先順位:
1. 実際の顧客との会話
2. 髪を見て触って確認した事実
3. 過去Decision / Outcome
4. 施術履歴 / Future Plan
5. Professional Hypothesis

AIが不足情報を補完しない。

## 3.4 Workflow

```text
相談 / Observation
→ Customer Truthを抽出
→ Problem Gate
→ 過去Decision / Outcome比較
→ 原因仮説・選択肢整理
→ Not Chosen候補整理
→ Quality / Evidence check
→ 池田が施術方針・変化量を判断
→ 施術
→ Next Observationを残す
→ 次回来店
→ Outcome / Validation
→ Decision & Learningへ戻す
```

## 3.5 Human Intervention Point

AIは確定しない:
- 施術方針
- どこまで切る / 残すか
- 髪を見て触る必要がある判断
- 顧客意図が不明な場合
- 重要な次回提案

## 3.6 Completion condition

完了は「記録した」ではない。

次回来店で前回Decisionを検証できる状態、またはOutcomeが記録されValidationが閉じた状態。

## 3.7 Outcome examples

- 自宅で扱いやすかった
- 顔まわりが結んだ時に邪魔にならなかった
- 広がりが増えなかった
- 褪色が想定範囲だった
- 顧客が前回判断を肯定 / 修正した

## 3.8 Handoff

Customer Experience → Revenue Learning:
- 顧客価値に影響した繰り返しパターンのみ

Customer Experience → Content Intelligence:
- 公開価値があり、事実確認済みで匿名化可能なケースのみ

Customer Experience → Personal OS Improvement:
- 記録・検索・次回確認に繰り返し摩擦がある場合のみ

---

# 4. Revenue Learning Stream

## 4.1 Purpose

9:00〜18:00と生活を守りながら、月間技術売上130万円を持続的・安定的に達成する条件を現場から発見する。

売上最大化ではなく、持続可能な制約解消を目的とする。

## 4.2 Primary owner

Primary Core Agent:
- Growth & Market Intelligence

Support:
- Decision & Learning Intelligence
- Evidence Resolver
- Quality & Brand QA

Human Owner:
- 池田航一

## 4.3 Input

- 技術売上
- 客数
- 客単価
- メニュー構成
- 次回予約
- 再来
- 予約枠 / 空き
- 時間当たり提供価値
- 実際の顧客反応

## 4.4 Workflow

```text
Daily / weekly facts
→ 異常値・変化を観察
→ Problem Gate: 本当の制約は何か
→ 代替説明を列挙
→ Value Gate
→ 小さな仮説を最大1つ生成
→ 反証条件を定義
→ 池田が実験採否を判断
→ 現場で小さく実行
→ Outcomeを観察
→ supported / contradicted等を判定
→ 次の問題設定を更新
```

## 4.5 Forbidden shortcuts

- 1日の高売上から勝ち筋認定
- 1件の反応から全顧客ルール変更
- 次回予約率だけを単独最適化
- 不要な追加メニュー
- 値引き中心
- 過剰な新規集客
- 予約詰め込み
- 家族時間の犠牲

## 4.6 Standard experiment packet

```text
Observation
Constraint hypothesis
Alternative explanations
Small experiment
What we will not change
Falsification condition
Observation window
Human decision required
```

## 4.7 Completion condition

レポート作成ではなく、
- 仮説を保留する
- 小さな実験を1つ選ぶ
- 既存施策を継続する
- 何もしない
のいずれかまで圧縮し、観察条件が明確になった状態。

---

# 5. Content Intelligence Stream

## 5.1 Purpose

現場一次情報を、顧客理解・検索・AI発見・ブランド認識・第二収益へ接続できる公開資産へ変換する。

大量生成は目的にしない。

## 5.2 Primary owner

Primary Core Agent:
- Content & Product Intelligence

Support:
- Decision & Learning Intelligence
- Growth & Market Intelligence
- Quality & Brand QA
- Evidence Resolver
- Approval Policy

Human Owner:
- 池田航一

## 5.3 Input priority

1. 実際の施術ケース
2. 顧客の迷い・言葉
3. 現場での違和感
4. 判断の分岐 / Not Chosen
5. Outcome / Validation
6. 外部調査

一般論から先に作らない。

## 5.4 Workflow

```text
Primary Evidence
→ Problem / Demand framing
→ Publish / Not Publish Gate
→ 何者として認識されたいか確認
→ Channel selection
→ AI implementation
→ Fact / brand / AI-tone QA
→ 重要主張はfresh-context adversarial verification
→ 池田 approval
→ Publish
→ Response / discovery observation
→ Canonical integration候補
→ Learningへ戻す
```

## 5.5 Publish Gate

発信しない方がよい場合:
- 一次情報が弱い
- 他記事と重複
- 顧客価値が薄い
- ブランド中心と関係がない
- AIが作れる一般論のみ
- 公開によるEvidenceよりノイズが大きい

「発信しない」は正常な結果。

## 5.6 Channel roles

- Threads = 気づき・問い・思考途中
- Instagram = 結果・変化・視覚的証拠
- note = 判断過程の深掘り
- GBP = 地域・実在・来店可能性の証明
- ホームページ = Canonical Information / 公式正本
- Substack = 美容師経営・AI活用・検証過程

## 5.7 Canonical integration rule

繰り返し現れる重要情報はSNSに散らしたままにせず、必要に応じてホームページ / 正本へ統合する。

薄いページを量産しない。

## 5.8 Completion condition

公開した時点では閉じない。

以下のいずれかまで:
- 反応を観察しLearningへ戻した
- Canonical sourceへ統合した
- 再利用価値なしとして終了した
- Publishしないと判断した

---

# 6. Personal OS Improvement Stream

## 6.1 Purpose

OSを大きくするのではなく、実際の仕事の摩擦を減らし、Human Decision Productivityを高める。

## 6.2 Primary owner

Primary Core Agent:
- Content & Product Intelligence

Support:
- ChatGPT / Chief of Staff
- Quality & Brand QA
- Approval Policy
- Run History

Human Owner:
- 池田航一

## 6.3 Input

- 繰り返し発生する入力負荷
- 検索しづらさ
- 判断材料の不足
- 重複作業
- Agent管理負荷
- AIが増やした確認作業
- 未使用機能
- 削除候補

## 6.4 Workflow

```text
Observed friction
→ 実際に繰り返している仕事か確認
→ 仕事の目的・入力・判断・例外・終了条件を言語化
→ Problem Gate
→ Value Gate
→ Build Gate
→ 最小・可逆の改善案
→ Human approval if required
→ Implementation
→ QA
→ 実利用
→ Outcome / System Cost audit
→ Keep / Improve / Merge / Delete
```

## 6.5 Agent Creation Gate

新Agentを作る前にすべて確認する。

1. 実際に繰り返している仕事がある
2. 仕事の目的を説明できる
3. 入力を説明できる
4. 判断構造を説明できる
5. 例外 / Stop条件を説明できる
6. 終了条件を説明できる
7. 既存Core Agentで代替できない
8. temporary subagentでは足りない
9. Human Decision Productivity改善が見込める
10. 3〜4週間後にOutcome監査できる

満たさない場合はAgent化しない。

原則:

> Agentは技術からではなく、仕事から作る。

## 6.6 Delete / Merge Gate

以下は停止・統合・削除候補:
- 3〜4週間使われない
- Outcomeが他Agentと重複
- 人間が直接やる方が速い
- 毎回大幅修正が必要
- 現実のOutcomeにつながらない
- 管理コストが価値を上回る
- 一次情報へ戻らない

## 6.7 Completion condition

機能リリースではなく、実利用後に
- KEEP
- IMPROVE
- MERGE
- DELETE
- ROLLBACK
の判定まで閉じる。

---

# 7. Cross-stream handoff

## 7.1 Handoff principle

丸ごとの会話・長文分析を渡さない。

必要最小限のEvidenceと判断材料を渡す。

標準packet:

```text
Source Stream
Target Stream
Problem
Known facts
Hypotheses
Decision / Not Chosen
Evidence refs
Human Gate
Requested next action
Outcome confirmation method
```

## 7.2 Typical routes

```text
Customer Experience
→ Decision & Learning
→ Revenue Learning / Content Intelligence

Revenue Learning
→ Customer Experience（顧客体験実験が必要な場合）
→ Personal OS Improvement（測定摩擦が繰り返す場合）

Content Intelligence
→ Personal OS Improvement（制作・正本管理の摩擦が繰り返す場合）
→ Revenue Learning（相談・来店等のRevenue Signal候補がある場合）

Personal OS Improvement
→ 全Stream（改善した仕組みを戻す）
```

## 7.3 CEO escalation

CEOへ上げるのは原則以下のみ:
- 重要なHuman Decision
- Strategy / brand / pricing変更
- 顧客へ重大な影響がある変更
- Production / public / destructive action
- 高コスト・不可逆な実装

それ以外はChief of Staffが圧縮して処理する。

---

# 8. Shared AI stop conditions

AI単独で結論を確定しない:
- 現場確認が必要
- 髪を見て触る必要がある
- 顧客意図が不明
- Evidence不足
- 事実と仮説を分離できない
- 1件だけで因果を断定しそう
- 価格変更
- ブランド方向転換
- 顧客体験へ大きな影響
- 信用へ影響する公開主張
- Production / public publish / customer action
- 高コスト・不可逆な実装

停止形式:

```text
AI hypothesis
Evidence
Counter-evidence / falsification
Unknowns
Human decision required
```

# 9. Workflow scorecard

各Streamは生成量ではなく以下を評価する。

- Problem Framing Quality
- Decision Quality
- Human Decision Productivity
- Outcome Impact
- Evidence Quality
- Learning Reuse
- System Cost

Agent数、Automation数、記事数、分析量は成功KPIにしない。

# 10. Phase 3 completion definition

Phase 3は以下を満たしたら運用標準として完了候補とする。

- 4 Value StreamすべてにInput / Gates / owner / Human Gate / Outcome / completion conditionがある
- Stream間handoffが定義されている
- Chief of StaffのStandard Returnが統一されている
- Agent Creation / Delete Gateがある
- Output完了ではなくOutcome閉鎖が標準になっている
- AI Governance / Operating Standard / Org Registryと矛盾しない

Runtime自動化はこのPhaseの完了条件ではない。まず人間＋AIでWorkflowを実運用し、繰り返し性と摩擦を観察してから必要部分だけ実装する。
