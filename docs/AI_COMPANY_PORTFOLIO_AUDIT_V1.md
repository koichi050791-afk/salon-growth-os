# AI Company Portfolio Audit v1

更新: 2026-08-25

## 目的

IKEDA Personal OS / AI会社に存在するAgent、Automation、主要機能、Draft PRを、実利用・Outcome・重複・管理コストの観点で棚卸しし、Active Roadmapを小さく保つ。

評価は `KEEP / IMPROVE / MERGE / HOLD / ARCHIVE` を使う。`ARCHIVE` は履歴やコードを破棄する意味ではなく、Active Roadmapから外し、必要ならmain起点で再抽出する。

## 判断原則

1. Output量ではなくOutcomeで評価する。
2. Agent数・Automation数を成果KPIにしない。
3. 現場一次情報に接続しない仕組みは拡張しない。
4. 同じOutcomeを持つ仕組みは統合する。
5. 実利用が確認できないものはHOLDまたはARCHIVE。
6. 旧stack / 旧architectureをそのままmainへ持ち込まない。
7. 削除より先に、停止・非表示・Active Roadmap除外を優先する。

---

## 1. Core Agents

| 対象 | 判定 | 理由 | 次アクション |
|---|---|---|---|
| ChatGPT / Chief of Staff | KEEP | 現在の自然言語入力・統合・優先順位の中心 | 新Agentを増やさず4 Core Agentへrouting |
| Salon & Customer Intelligence | KEEP | Decision / Next Observation / Customer contextに直結 | Customer Experience Streamで利用 |
| Decision & Learning Intelligence | KEEP | Outcome / Validation / Knowledge Candidateに直結 | 単一Caseから一般化しない |
| Growth & Market Intelligence | KEEP | 130万円プロジェクトと外部観察を統合できる | Revenue Learning Streamで利用 |
| Content & Product Intelligence | IMPROVE | 発信とOS改善が同居し責務が広いが、現時点で分割するほど実務量のEvidenceなし | Agent分割せず、Workflow上でContent / OS Improvementを分離 |

結論: Core Agentは4体を維持。追加しない。

---

## 2. Shared Capabilities

| 対象 | 判定 | 理由 |
|---|---|---|
| Evidence Resolver | KEEP | UNKNOWN fail-closed / Source of Truthに必須 |
| Approval Policy | KEEP | Human Gateに必須 |
| Quality & Brand QA | KEEP | AI自己評価を最終Gateにしないため必要 |
| Run History | IMPROVE | 監査価値は高いが永続化は未成熟 |
| Trigger / Scheduler | HOLD | recurring workが明確になるまでAutomationを増やさない |

---

## 3. 現行主要機能

### Decision Capture API / Airtable Decision
判定: **KEEP — Core**

理由:
- 実際の標準入力経路 `池田 → 専用GPT → API → Airtable Decision` に接続。
- 一次情報を最小負荷で保存できる。
- Customer Experience / Learningの原材料になる。

方針:
- 新しい入力台帳を作らない。
- `/decision-input` はfallback / adminとしてのみ保持。

### Decision Timeline
判定: **KEEP**

理由: 過去判断を再利用するために必要。

### Customer Growth Layer
判定: **KEEP + HOLD EXPANSION**

理由:
- 再来・Expected Return・Next Planの観察価値がある。
- 自動連絡、churn scoring、LTV rankingは未検証かつ不要。

方針:
- read-only observationを維持。
- 自動接触・複雑なスコアリングは作らない。

### Knowledge Candidate Foundation
判定: **KEEP**

理由:
- REAL / TEST / SAMPLE / UNKNOWN分離がEvidence disciplineに直結。
- 自動Knowledge昇格をしない設計が現方針と一致。

### Outcome / Validation Loop
判定: **IMPROVE / FIELD GATE**

理由:
- Learning Loopを閉じるため最重要候補。
- ただし実際の次回来店での利用確認が必要。

完了条件:
- REAL Decisionの次回来店で少なくとも1件、Outcome / Validationが現場負荷を増やさず使えること。

### AI Governance Runtime Phase A-C
判定: **KEEP — Active**

理由:
- STOP / REVIEW / APPROVAL / AUTO
- Standard Return
- AI Productivity Audit
の3点は新Operating Standardに直接接続する。

### AI Company Operating Standard / Org Registry / Workflows
判定: **KEEP — Canonical docs candidate**

理由:
- 断捨離後の組織・Gate・Workflowの正本。

---

## 4. 旧 / 未成熟Feature Portfolio

### Rename to Ikeda Salon Learning OS PR
判定: **ARCHIVE**

理由: 現在の製品概念はIKEDA Personal OS / 池田航一｜美容師OSへ進んでおり、名称変更案が古い。

### Content Source Infrastructure / Google Sheets Content Registry Reader
判定: **HOLD → ARCHIVE from Active Roadmap**

理由:
- Content Registry読取自体は成立したが、Canonical Body Sourceが未接続。
- 現時点で全件BODY_SOURCE_MISSINGだった。
- Content Intelligenceの現在課題はsource adapter増設より、一次情報から価値ある発信を作るWorkflow。

再開条件:
- 実際に「公開済み記事の正本同期」が反復作業として発生し、手動負荷が確認されたとき。

### Revenue Intelligence v0.1
判定: **ARCHIVE**

理由:
- REAL Signal 0件。
- KPI / Case / Knowledge reader未接続。
- 現時点ではRevenue Learning Streamの人間+AI分析の方が軽量。

再開条件:
- REAL Decision / Outcome / booking / KPI Evidenceが十分に蓄積し、同じ分析が反復していること。

### Autonomous Operations v0.1
判定: **ARCHIVE / SUPERSEDED**

理由:
- 旧Agent / Operations構造上の実装。
- Approval Queue / Run Historyがin-memory。
- 新しいAI Governance Runtime、Operating Standard、4 Value Stream Workflowへ役割が置換された。

再開しない。必要なruntime機能だけmain起点で再抽出する。

### Trigger / Scheduler中心の自律化
判定: **HOLD**

理由:
- 先にWorkflowとOutcomeを固定する。
- recurring workのEvidenceなしに自律化しない。

---

## 5. Draft PR Portfolio

### ACTIVE
- #45 Decision capture entry / CI gate — KEEP
- #46 Outcome / Validation — FIELD GATE
- #50 Governance Phase A — KEEP
- #51 Governance Phase B — KEEP
- #52 Governance Phase C — KEEP
- #54 Operating Standard / Org Registry — KEEP
- #56 Value Stream Workflows — KEEP

### ARCHIVE / CLOSE
- #18 old product rename — superseded
- #36 Content Source Infrastructure — no current build priority
- #37 Sheets Content Registry Reader — no current build priority
- #41 Autonomous Operations v0.1 — superseded by new governance / workflows

### HISTORICAL CLOSED / NO ACTION
- #38 Revenue Intelligence v0.1 — already closed unmerged; keep archived
- #33 old Agent Registry / Operations — already closed unmerged; useful only as extraction reference
- #42 older Decision Capture ingress stack — closed and replaced by #43 / #45

---

## 6. Active Roadmap after decluttering

### Priority A — Field Learning Core
1. Decision Capture standard path stability
2. Outcome / Validation real-field test
3. Decision → Outcome → Learning connection

### Priority B — Governance Core
1. Governance Phase A
2. Standard Return Phase B
3. AI Productivity Audit Phase C
4. Operating Standard / Org Registry
5. 4 Value Stream Workflow

### Priority C — Observation only
- Customer Growth read-only observation
- Content / market external research as needed

### Not Active
- Autonomous AI company
- Revenue Intelligence automation
- Content Registry synchronization automation
- Agent proliferation
- Automatic customer contact
- Automatic public publishing
- Knowledge auto-promotion

---

## 7. Agent / Feature deletion test

以下のうち2つ以上に該当したらMERGE / ARCHIVE候補。

- 3〜4週間実利用なし
- Outcome ownerが他機能と重複
- 人間が直接行う方が速い
- 毎回大幅修正が必要
- 一次情報へ戻らない
- 実際の顧客価値 / 判断改善に接続しない
- 管理 / 確認負荷の方が大きい
- 旧architectureに依存

---

## 8. 次フェーズへのGate

Phase 5（Outcome計測 / Learning Loop接続）へ進む条件:

1. Phase 2 / 3 docsが整合している。
2. Active Roadmapが上記の小さい構成になっている。
3. 旧Draft PRがActive一覧から除外されている。
4. Outcome / ValidationのREAL field gateを最優先に置く。
5. 新Agent / Automation追加を行わない。

次フェーズの中心は「増やすこと」ではなく、Decision → Outcome → Learningを現場で閉じられるかの検証とする。
