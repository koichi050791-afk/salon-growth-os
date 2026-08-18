# Ikeda Salon Learning OS — Experiment Projection Contract v0.1

Status: 2026-08-18

## Purpose

Define how the active field experiment should appear in Ikeda Salon Learning OS without changing the canonical source model.

Canonical experiment record: Google Sheets `池田航一｜美容師OS データベース` → `実験ログ`.

Semantic enrichment: Notion `仮説・実験` and `130万円安定達成プロジェクト`.

Runtime projection: Ikeda Salon Learning OS `ActiveExperimentCard`.

## Active experiment

Experiment ID: `EXP-0001`

Theme:
`必要なケア提案＋年末へ向けた顧客プランニング`

Start:
`2026-08-19`

Initial state:
`実施予定`

Hypothesis:
`必要性のあるケア提案と年末から逆算した施術計画を明確にすると、顧客理解・次回予約・単価の質がどう変わるかを観察する`

Changed behavior:
- カット客への必要なケア提案
- 年末までの施術プラン共有

Target population:
`8月後半の担当顧客`

Observation metrics:
- 提案実施数
- 受容数
- 次回予約
- 顧客の反応
- 自宅での扱いやすさ

Initial observed result:
`null / 未観測`

Initial interpretation:
`null / 未解釈`

Unresolved caution:
`一日で因果を断定しない`

Next check:
`複数日・複数顧客で観察する`

## Mapping to current Supabase model

For Issue #2 temporary runtime projection:

| Experiment field | `improvement_actions` field |
|---|---|
| title/theme | `action_title` |
| start date | `week_start` |
| active status | `status` |
| hypothesis | `hypothesis` |
| observation metrics | `observation_metrics` |
| observed result | `result_note` |
| interpretation | `interpretation` |
| unresolved question/caution | `unresolved_question` |
| next decision | `next_decision` where semantically appropriate |

Do not force every source field into the current table if the meaning does not match. `target population` and `changed behavior` may remain outside the v0.1 card unless an existing field safely represents them.

## Runtime status normalization

Sheets state values and Supabase state values differ.

Suggested v0.1 normalization:

- `実施予定` → `planned`
- `観察中` / active execution → `in_progress`
- completed review → `completed`
- explicitly stopped/not pursued → `skipped`

This mapping should be centralized in a future adapter rather than scattered through UI components.

## ActiveExperimentCard content

Recommended order:

1. experiment title
2. status + start date
3. 仮説
4. 観測する数字・反応
5. 観測結果
6. 解釈
7. まだ分からないこと
8. caution: `1回の観測だけでは因果関係は判断できない`

The card must distinguish source-state labels from interpretation.

## Empty states

- no active experiment record → `現在、観察中の実験はありません`
- result missing → `未観測`
- interpretation missing → `未解釈`
- hypothesis missing → `仮説未設定`
- observation metrics missing → `観測項目未設定`
- unresolved question missing → `未設定`

Do not generate explanatory text automatically.

## Field update cadence

Likely cadence based on current operating model:

### Customer/day level
Primary observations enter through ChatGPT into Drive/Sheets when explicitly recorded.

### Weekly/review level
Interpretation and unresolved questions are more appropriate for weekly synthesis in Notion / review workflow.

This difference is important: the UI should not pressure Ikeda to write an interpretation after every customer.

## v0.1 write policy

Issue #2 is primarily a representation/learning feature, not a new mandatory input workflow.

During initial pilot:
- runtime can use seed/projection data,
- editing can remain limited to existing action flows if necessary,
- do not add a large new Experiment form unless real use proves it is needed.

## Validation questions after launch

1. Did seeing the experiment near KPI context change what Ikeda paid attention to?
2. Was the distinction between observed result and interpretation useful?
3. Did the card create any duplicate input?
4. Which fields actually needed editing from the phone?
5. Should the final adapter read from Sheets only, or does the app need write capability?
6. Was EXP-0001 still understandable without exposing customer-level details?

These observations determine the next implementation, not feature completeness.
