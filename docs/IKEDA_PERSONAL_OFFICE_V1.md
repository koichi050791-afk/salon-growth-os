# IKEDA Personal Office v1

更新: 2026-08-25

## 目的

この文書は、IKEDA Personal OS / AI運用を「AI大企業」ではなく「池田航一の個人事務所」として運用するための最小構成を定義する。

最上位目的は次の2つだけとする。

1. 9:00〜18:00と家族時間を守りながら、現場美容師として月間技術売上130万円を持続的に安定達成する。
2. 20年以上の現場経験・判断・学びを知的資産化し、労働時間に比例しない第二収益エンジンを育てる。

AI、Agent、OS、Workflow、Dashboard、Content、Research、Automationは目的ではなく、この2つを支える手段とする。

## 1. 最小組織

### Human Principal

池田航一

池田に残す仕事:
- 顧客との会話
- 髪を見て触る
- 違和感を捉える
- 原因仮説と施術方針の最終判断
- 価格、ブランド、公開、重要経営判断
- 何を大切にするかの価値判断

### AI Chief of Staff

ChatGPT

常設AIは原則これだけを入口とする。

役割:
- 池田からの自然言語入力を受ける
- 問題を整理する
- 必要な情報を探索・比較する
- 必要な職能だけを呼ぶ
- 重複作業・不要機能を止める
- 池田へ返す情報を圧縮する
- Human Gateが必要な箇所だけ池田へ返す

## 2. 2つのCore Work Loop

恒常的な「部署」や「AI社員」は増やさず、仕事を2つのLoopへ分類する。

### A. Salon & Customer Loop

対象:
- 相談
- 来店時の観察
- 施術判断
- しなかったこと
- 次回確認
- Outcome / Validation
- 再来、次回予約、紹介
- 日報、売上、客単価、capacity

目的:
現場の質を上げ、130万円安定達成につながる条件を発見する。

### B. Intellectual Asset & Revenue Loop

対象:
- 施術ケースの再利用
- 複数ケースからの学び
- Threads / Instagram / note / Substack / GBP / HPへの変換
- 無料→有料コンテンツ導線
- 商品化候補
- AI活用・美容師経営に関する知的資産
- 第二収益エンジンの検証

目的:
現場で生まれた一次情報と判断を、再利用可能な知的資産と収益候補へ変える。

## 3. On-demand Capabilities

以下は常設社員・部署にしない。必要な案件の時だけChief of Staffが呼び出す。

- Research: 外部情報・一次情報・過去記録の探索
- Critic: 反証、誇張、因果の飛躍、適用条件の確認
- Analyst: 集計、比較、傾向抽出
- Editor: 媒体別の文章・構成への変換
- SEO / Discovery: 地域検索、AI検索、検索意図の確認
- Engineer: GitHub / Codex / 実装作業
- QA: 事実性、ブランド、品質、停止条件の確認

同じ案件で複数職能が必要でも、新しい恒久Agentは作らない。

## 4. Shared Guardrails

組織として数えない共通ルールだけを残す。

- Source of Truth / Evidence
- Fact / Observation / Hypothesis separation
- AUTO / REVIEW / APPROVAL / STOP
- Human Capability Preservation
- Public publish / customer contact / production / destructive changeのHuman Gate
- Outcomeで評価し、Output数をKPIにしない

## 5. 標準ループ

```text
現実
↓
一次情報
↓
Chief of Staff
↓
必要なOn-demand Capabilityだけ使用
↓
池田判断が必要な点だけ返す
↓
実行
↓
Outcome
↓
次の現実へ戻す
```

## 6. 標準返却

池田へ返す情報は原則次へ圧縮する。

- 今見るべき3点まで
- 今やる1点
- 今はやらないこと
- 池田判断が必要な点だけ
- 根拠 / Source of Truth
- 次に何を観察すれば判断できるか

池田判断が不要な整理・比較・下書き・分類・監査はAI側で完結させる。

## 7. 追加禁止の原則

次を理由に新しい部署・Agent・Dashboard・Workflowを増やさない。

- AIでできるから
- 面白そうだから
- 他社がやっているから
- 将来使うかもしれないから
- 名前を付けると整理できそうだから

新しい恒久機能を追加できるのは、以下を全て満たす場合だけとする。

1. 実際の反復作業が存在する
2. 既存Loop + On-demand Capabilityで代替できない
3. 池田の時間または判断負荷を明確に減らす
4. 本業130万円または第二収益へ接続する
5. 3〜4週間後に利用・Outcomeを監査できる
6. 維持コストより価値が大きい

一つでも満たさなければ追加しない。

## 8. STOP / MERGE / ARCHIVE基準

以下に該当したら停止・統合・保留を標準とする。

- 3〜4週間使わない
- 同じ情報を別の場所でも管理している
- 同じOutcomeを複数Agent / Dashboardが追っている
- 池田が毎回AI出力を大幅修正する
- Outputは増えたが行動・学び・売上・時間削減へつながらない
- 入力や確認作業が増えた
- 手動で直接やる方が速い
- 一次情報へ戻らない

削除ではなくARCHIVEで十分なものは、まず運用面から外す。

## 9. 現時点で残すもの

### Keep
- Decision Capture
- Outcome / Validation
- Customer / Visit / Decisionの一次情報接続
- Customer Growthの観察
- 日報 / 売上 / 次回予約等の現場観察
- 過去ケース検索と学び候補抽出
- 発信・商品化への変換
- AI Governanceの安全境界
- GitHub / Codexによる必要時の実装

### Merge
- AI Companyの複数部署 → 2 Core Work Loop
- 複数AI社員案 → Chief of Staff + On-demand Capabilities
- Value Team / Value Stream → 各Loop内の一時Workflow
- Research / SEO / Editor / Analyst / Engineer / QA → On-demand Capabilities

### Archive / Stop
- 人数を増やすためのAgent Registry運用
- 部署別Dashboard
- 常設のAI会議体
- Agent数・Automation数・生成物数のKPI
- 独立したRevenue Intelligence画面のための機能開発
- 独立したContent Intelligence画面のための機能開発
- 独立したAI Company Control Centerの拡張
- 現時点で実在仕事のないFinance/Admin AI
- 既存機能で代替できる新Agent

## 10. プロダクト構造

Personal OSは最小の実務画面だけを残す。

毎日または現場で使う:
- HOME
- Decision / Case capture
- Decision history / search
- Next Observation / Outcome
- Customer Growth observation
- 130万円プロジェクトの現状

必要時だけ使う:
- Content / Product conversion
- Research
- AI productivity audit
- Engineering / GitHub

常時見る必要がないものはHOMEへ置かない。

## 11. 成功条件

成功は「AI会社が大きくなったこと」では測らない。

見るのは次だけ。

- 池田の反復作業時間が減った
- 池田が見る情報量が減った
- 池田が現場観察・顧客との会話・最終判断へ時間を戻せた
- 過去の一次情報が次回来店で使えた
- 再来 / 次回予約 / 紹介 / 客単価 / 時間当たり価値の改善に学びがつながった
- 現場の経験が知的資産として再利用された
- 第二収益につながる資産が増えた
- 使わない仕組みを削除・停止できた

## 結論

IKEDA Personal OSはAI会社を再現するシステムではない。

「池田航一という一人の専門家が、少人数の個人事務所のように、必要な専門職をAIで必要な時だけ呼びながら、本業と知的資産形成へ集中するためのOS」とする。
