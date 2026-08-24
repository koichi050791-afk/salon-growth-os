# AI Company Organization Registry v1

更新: 2026-08-25

この文書は、AI会社 / IKEDA Personal OSで参照する組織構造の正本候補とする。

組織は「会社っぽく見せること」ではなく、池田の実際の仕事をAIへ安全に委譲し、Human Decision Productivityを高めるために存在する。

## 0. 組織設計原則

- Agentは技術から作らず、実在する仕事から作る
- 同じ役割を部署・Team・Agentで三重管理しない
- Value Teamは固定組織ではなく、E2Eの仕事の流れ（Value Stream）として扱う
- AI社員は実装上のCore Agentを正本とする
- 横断QA・Evidence・Approval・履歴は社員ではなくShared Capabilityとする
- 役割が薄い、使われない、重複する名称は増やさない
- 新組織単位はOutcome、Human Gate、利用頻度を説明できる場合だけ追加する

## 1. 最終組織構成（Lean AI Company）

### Human Executive

| 役割 | 責任 |
|---|---|
| 池田航一 / CEO | 現実観察、顧客との関係、価値判断、専門判断、ブランド・価格・重要経営判断、最終承認 |

### AI Executive

| AI | 役割 |
|---|---|
| ChatGPT / Chief of Staff | 池田入力の受付、Problem Framing支援、仕事分類、Core Agent選択、並列/逐次ルーティング、標準返却への圧縮、Human Gateへのhandoff |

ChatGPT / Chief of StaffはCore Agent数に含めない。

### 4 Core Agents（AI社員の正本）

| Core Agent | 担当する実在仕事 | 主Outcome |
|---|---|---|
| Salon & Customer Intelligence | 顧客・来店・観察・Customer Truth・Next Observation整理 | 次回来店まで顧客理解が再利用できる |
| Decision & Learning Intelligence | Decision / Not Chosen / Hypothesis / Outcome / Validation / Knowledge Candidate | 経験が検証可能な学びへ変わる |
| Growth & Market Intelligence | 日報・売上・再来・次回予約・capacity・市場・検索・AI検索観察 | 次に検証する小さな成長仮説が明確になる |
| Content & Product Intelligence | 一次情報の発信変換、OS摩擦検出、Engineering Candidate、Codex handoff | 発信またはOS改善へ必要なものだけ変換される |

この4 Core AgentsはAgent Registry v0.2の実装構造と一致させる。

## 2. Value Streams（旧Value Team）

Value Teamは「部署」や「AI社員」として数えず、複数Agentを束ねて一つの価値をE2Eで完結させる仕事の流れとして扱う。

### Customer Experience Stream

目的: 相談 → 観察 → Decision → 施術 → Next Observation → 次回来店Outcomeまでをつなぐ。

主Agent:
- Salon & Customer Intelligence
- Decision & Learning Intelligence

Human Gate:
- 施術方針
- 髪を見て触る必要がある判断
- 顧客意図が不明な判断
- 重要な次回提案

### Revenue Learning Stream

目的: 9:00〜18:00と生活を守りながら、持続的に売上が上がる条件を小さな実験で発見する。

主Agent:
- Growth & Market Intelligence
- Decision & Learning Intelligence（検証時）

標準出力:
- 次に検証する小さな仮説を最大1つ

### Content Intelligence Stream

目的: 一次情報 → 論点 → 媒体変換 → QA → 公開候補 → 反応 → 再利用までをつなぐ。

主Agent:
- Content & Product Intelligence
- Growth & Market Intelligence（需要・検索観察）
- Decision & Learning Intelligence（一次情報・学び接続）

媒体役割:
- Threads = 気づき・問い・思考途中
- Instagram = 視覚的証拠
- note = 判断過程の深掘り
- Googleビジネスプロフィール = 地域・実在・来店可能性の証明
- ホームページ = 公式情報の正本
- Substack = 美容師の経営・AI活用・検証過程

### Personal OS Improvement Stream

目的: OS摩擦 → Problem Framing → Build Gate → 最小実装 → QA → 利用 → Outcome → 継続/修正/削除までをつなぐ。

主Agent:
- Content & Product Intelligence
- Chief of Staff / Orchestrator

新機能はBuild Gateを通す。Agent数・機能数を成果KPIにしない。

## 3. Shared Capabilities（社員ではない横断基盤）

| Capability | 役割 |
|---|---|
| Quality & Brand QA | unsupported fact、過剰一般化、ブランド逸脱、架空ケース等を監査 |
| Approval Policy | AUTO / REVIEW / APPROVAL / STOP等のHuman Gateを制御 |
| Evidence Resolver | Source of Truth、sourceRefs、UNKNOWN、欠落・古さを判定 |
| Trigger / Scheduler | 許可済みの定期・条件実行 |
| Run History | SUCCESS / PARTIAL / FAILED / SKIPPED等の実行履歴・監査 |

Shared CapabilityはAI社員として人数カウントしない。

## 4. Product / Runtime Layers（組織ではない）

以下は部署・Team・社員ではなく、製品またはruntime機能として管理する。

- AI Company OS
- Content OS
- Engineering Loop
- Knowledge / Learning
- Growth Loop
- customer growth
- editorial work
- AI operations
- decision capture
- AI Operations control center
- Agent Registry v0.2
- Customer Growth Layer v0.2
- Decision OS v0.1
- editorial interface v0.3

組織図へ混在させない。

## 5. 断捨離決定

### A. 旧来8部署 → 固定部署として廃止、Domain Labelへ降格

対象:
- CEO室
- 130万円達成室
- ブランド戦略室
- サロンワーク研究室
- 顧客体験研究室
- 集客戦略室
- SEO・LLMO室
- SNS戦略室

理由:
- Value Stream / Core Agentと役割が重複する
- 部署間handoffを増やし、AI会社の管理コストを上げる
- 一人のHuman CEO＋AI会社では恒常的な部門サイロを持つ価値が低い

扱い:
- 過去記録との互換性のため名称はLegacy Domain Labelとして参照可能
- 新しい仕事のルーティング先には使わない
- CEO室の機能は「池田 / CEO + ChatGPT / Chief of Staff」へ統合

### B. 9 AI社員案 → 正式社員リストから廃止、4 Core Agentsへ統合

廃止/統合対象:
- Chief of Staff AI → ChatGPT / Chief of Staffへ一本化
- Knowledge Curator AI → Decision & Learning Intelligenceへ統合
- Research Analyst AI → 各Core Agentが必要時に使う横断Research capabilityとして扱う
- Content Editor AI → Content & Product Intelligenceへ統合
- Product Manager AI → Chief of Staff + Content & Product IntelligenceのProblem/Build Gate機能へ統合
- Sales Ops AI → Growth & Market Intelligenceへ統合
- Support Concierge AI → 現時点では独立社員不要。Chief of Staffが代替
- Engineer / QA AI → EngineeringはContent & Product Intelligence、QAはShared Capabilityへ分離
- Finance/Admin AI → 現時点では継続的な実在仕事が不足。正式社員化を保留

### C. 補助的な5職能組織 → 廃止

対象:
- リサーチ担当
- 文章担当
- SEO担当
- 分析担当
- 開発担当

理由:
- Core Agent / Shared Capabilityの内部能力として表現できる
- 職能単位のAgent乱立につながる

必要時は一時的なsubagent / capabilityとして呼び出すが、恒久組織にはしない。

### D. 4 Value Team → Value Streamへ改称

理由:
- Teamとして数えるとCore Agentとの二重組織になる
- 本来の意図は「顧客価値をE2Eで完結する仕事の流れ」である

固定メンバーを持つ部署ではなく、Chief of Staffが案件ごとにCore Agentを束ねるルーティング概念とする。

## 6. 断捨離後の人数・構造

### Before（名称上）
- 旧来部署: 8
- Value Team: 4
- AI社員案: 9
- AI Company OS上位機能: 5
- 共通基盤: 5
- 補助職能: 5

合計36名称（機能・組織・社員が混在）

### After（組織として数えるもの）
- Human CEO: 1
- AI Chief of Staff: 1
- Core AI Employees: 4
- Value Streams: 4（人数に数えない）
- Shared Capabilities: 5（人数に数えない）
- Product / Runtime Layers: 組織図から除外

実質の会社構成は「1 Human CEO + 1 AI Chief of Staff + 4 Core Agents」。

## 7. 新Agent Creation Gate

新しいAI社員を追加する前に、以下を全て確認する。

1. 実際に繰り返している仕事が存在する
2. その仕事の目的・入力・判断・例外・終了条件を説明できる
3. 既存4 Core Agentsで処理できない
4. 一時subagent / capabilityでは足りない
5. Human Decision Productivityが改善する見込みがある
6. 追加後の管理・監査コストより価値が大きい
7. 3〜4週間後に利用頻度とOutcomeを監査できる

一つでも満たさない場合、新Agentは作らない。

## 8. Agent / Capabilityの停止・統合基準

以下に該当したらSTOP / MERGE / DELETE候補とする。

- 3〜4週間ほぼ使われない
- 他AgentとOutcomeが重複する
- 人間が直接行う方が速い
- 出力を毎回大幅修正している
- Outcomeに接続していない
- 管理・監査コストの方が大きい
- 一次情報へ戻らない
- Level 1〜2の単純作業しかしておらず、一時capabilityで代替できる

## 9. 全社handoff

Chief of Staff / Value Stream間のhandoffは次へ圧縮する。

```text
今見るべき3点
今やる1点
今はやらないこと
池田判断が必要な点
Evidence / Source of Truth
Outcome確認方法
```

## 10. 正本優先順位

組織・Agent構成の確認順:

1. runtimeのAgent Registry（実装されている4 Core Agents / Shared Capabilities）
2. このOrganization Registry
3. AI Company Operating Standard
4. 過去の部署名・会話上の名称

過去名称とruntimeが矛盾した場合、過去名称を新規の正式社員・部署へ昇格させず、まず統合可否を確認する。

## 11. 更新ルール

新名称を正式運用へ採用する場合は以下を確認する。

1. 既存名称との重複がない
2. 実在する仕事またはE2E Value Streamに対応する
3. 所有するOutcomeが定義されている
4. Human Gateが定義されている
5. 3〜4週間後に利用・価値を監査できる

目的は組織を大きくすることではなく、池田が見るべきもの・判断すべきものを減らしながら、現実からの学習速度を上げることである。
