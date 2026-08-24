# AI Company Organization Registry v1

更新: 2026-08-25

この文書は、AI会社 / IKEDA Personal OSで参照する部署・Value Team・AI社員・共通基盤の組織名称と役割を確認するための正本候補とする。

## 1. 旧来の正式部署

| 部署 | 主目的 | 現在の扱い |
|---|---|---|
| CEO室 | 戦略・全体統括 | 重要判断の統合、全社優先順位、Human Decisionの集約 |
| 130万円達成室 | 月間技術売上130万円の持続的達成 | Revenue Learning Teamと連携 |
| ブランド戦略室 | 池田ブランド強化 | Content Intelligence Team / SEO・LLMO室と連携 |
| サロンワーク研究室 | 施術・技術サポート | Customer Experience Teamと連携 |
| 顧客体験研究室 | 顧客満足・再来・次回体験 | Customer Experience Teamと連携 |
| 集客戦略室 | 集客・来店導線 | Content Intelligence Team / Growth Loopと連携 |
| SEO・LLMO室 | 検索・AI検索最適化 | ホームページ正本・GBP・AI発見を担当 |
| SNS戦略室 | SNS・発信支援 | Content Intelligence Teamの媒体実装を補助 |

旧来部署は削除せず「既存役割資産」として保持する。主構造はValue Teamを優先する。

## 2. Value Team（主構造）

### Customer Experience Team

目的: 施術から次回来店までの顧客価値をE2Eでつなぐ。

主な接続先:
- サロンワーク研究室
- 顧客体験研究室
- Knowledge / Learning
- Evidence Resolver

Human Gate:
- 施術方針
- 髪を見て触る必要がある判断
- 顧客意図が不明な判断
- 重要な次回提案

### Revenue Learning Team

目的: 9:00〜18:00と生活を守りながら、持続的に売上が上がる条件を小さな実験で発見する。

主な接続先:
- 130万円達成室
- Growth Loop
- Sales Ops AI
- Knowledge / Learning

標準出力:
- 次に検証する小さな仮説を最大1つ

### Content Intelligence Team

目的: 一次情報から発信・公式情報までをE2Eでつなぐ。

主な接続先:
- ブランド戦略室
- 集客戦略室
- SEO・LLMO室
- SNS戦略室
- Content OS
- Quality & Brand QA

標準媒体役割:
- Threads = 気づき・問い・思考途中
- Instagram = 視覚的証拠
- note = 判断過程の深掘り
- Googleビジネスプロフィール = 地域・実在・来店可能性の証明
- ホームページ = 公式情報の正本
- Substack = 美容師の経営・AI活用・検証過程

### Personal OS Improvement Team

目的: OSの摩擦発見から改善・統合・削除までをE2Eで担う。

主な接続先:
- CEO室
- AI Company OS
- Engineering Loop
- Engineer / QA AI
- Quality & Brand QA
- Approval Policy
- Run History

新機能はBuild Gateを通す。Agent数・機能数を成果KPIにしない。

## 3. AI Company OS上位機能

| 機能 | 役割 |
|---|---|
| AI Company OS | 全体のAI運用・統合 |
| Content OS | コンテンツ企画・変換・品質・媒体接続 |
| Engineering Loop | 実装・検証・修正・運用の循環 |
| Knowledge / Learning | Decision / Outcome / Caseから再利用可能な学びを育てる |
| Growth Loop | 顧客価値・収益・発見・再来の学習循環 |

## 4. 共通基盤

| 基盤 | 役割 |
|---|---|
| Quality & Brand QA | 品質・ブランド整合・公開前確認 |
| Approval Policy | Human approvalが必要な操作を制御 |
| Evidence Resolver | Evidence / Source of Truth / UNKNOWNを判定 |
| Trigger / Scheduler | 許可された定期・条件実行 |
| Run History | 実行履歴・監査・振り返り |

共通基盤はValue Teamの上に立つ部署ではなく、横断的な安全・証拠・監査レイヤーとする。

## 5. AI社員グループ

| AI社員 | 主な役割 | 主な所属 / 利用先 |
|---|---|---|
| Chief of Staff AI | 全体圧縮・優先順位・handoff | CEO室 / 全Value Team |
| Knowledge Curator AI | Case / Outcomeから学び候補を整理 | Knowledge / Learning |
| Research Analyst AI | 外部情報・過去記録・比較・反証 | 全Value Team |
| Content Editor AI | 媒体変換・文章編集・構成 | Content Intelligence Team |
| Product Manager AI | Problem Framing / Value / Build Gate支援 | Personal OS Improvement Team |
| Sales Ops AI | 売上・再来・次回予約・仮説整理 | Revenue Learning Team |
| Support Concierge AI | 利用支援・問い合わせ整理 | AI Company OS |
| Engineer / QA AI | 実装・テスト・独立検証 | Engineering Loop / Personal OS Improvement Team |
| Finance/Admin AI | 管理・費用・事務支援 | CEO室 / 必要部署 |

AI社員は独立部署ではなく、Value Teamが必要に応じて呼び出す職能リソースとして扱う。

## 6. 補助的な職能別AI組織

- リサーチ担当
- 文章担当
- SEO担当
- 分析担当
- 開発担当

これらは主構造ではなく補助構造。新しい職能Agentを作る前に、既存AI社員またはValue Team内で代替できないか確認する。

## 7. Personal OS内の確認済み機能領域

- customer growth
- editorial work
- AI operations
- decision capture
- AI Operations control center
- Agent Registry v0.2
- Customer Growth Layer v0.2
- Decision OS v0.1
- editorial interface v0.3

これらは組織名称ではなく、製品 / 機能領域として管理する。

## 8. 名称・構造の扱い

- 旧来部署 = 既存役割資産
- Value Team = 現在の主構造
- AI社員 = Value Teamが呼び出す職能リソース
- 共通基盤 = 横断的な安全・Evidence・監査レイヤー
- AI Company OS上位機能 = 製品 / 運用アーキテクチャ
- Personal OS内機能領域 = UI / runtime / product capability

同じ役割を複数の名称で持たない。役割が重複した場合は、統合・alias化・削除候補として監査する。

## 9. 全社handoff原則

Value Team間のhandoffは次の形式へ圧縮する。

```text
今見るべき3点
今やる1点
今はやらないこと
池田判断が必要な点
Evidence / Source of Truth
Outcome確認方法
```

CEO室へ上げる情報も原則この形式を使う。

## 10. 更新ルール

部署・Value Team・AI社員・共通基盤が追加、改称、統合、廃止された場合はこのRegistryを更新する。

新名称を会話上だけで増やさず、正式運用へ採用する場合は以下を確認する。

1. 既存名称との重複がない
2. E2Eの価値単位または明確な横断機能である
3. 所有するOutcomeが定義されている
4. Human Gateが定義されている
5. 3〜4週間後に利用・価値を監査できる
