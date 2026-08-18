# Ikeda OS — Source of Truth Contract

Status: 2026-08-18

## Purpose

Prevent duplicate entry and ownership drift as Salon Growth OS evolves into the management / growth / learning layer of 池田航一｜美容師OS.

The governing rule is:

> Ikeda → ChatGPT → appropriate source/system.

A field should have one canonical owner. Other systems may surface or transform it, but should not silently become competing sources of truth.

## Canonical ownership

| Information | Canonical owner | Salon Growth OS role |
|---|---|---|
| KPI / primary operating facts | Google Drive / Sheets | consume / display / aggregate |
| Daily KPI log | Google Drive / Sheets `KPI日報` | read-only management projection |
| Treatment Case primary facts | Google Drive / Sheets `施術ケース` | anonymized learning signal only |
| Experiment primary record | Google Drive / Sheets `実験ログ` | read/display/operate on normalized projection |
| Meaning / broader hypothesis development / interpretation | Notion | surface management-relevant subset; do not silently overwrite Notion |
| Knowledge / promoted learning | Notion | reference/surface only |
| Customer timeline / visit / Decision / Future Plan | Airtable | out of scope; no customer PII copy |
| Issue / implementation decision / PR / code | GitHub | canonical implementation history |
| Runtime management UI | Salon Growth OS | display and operating interaction |
| Customer-facing My Hair OS | Lovable/prototype layer, later dedicated implementation | out of scope |
| Schedule context | Google Calendar only when real events exist | optional context, never a second booking ledger |

## Current experiment: EXP-0001

The primary experiment record already exists in Google Sheets `実験ログ`:

- Experiment ID: `EXP-0001`
- start date: `2026-08-19`
- status: `実施予定`
- theme: `必要なケア提案＋年末へ向けた顧客プランニング`
- hypothesis: 必要性のあるケア提案と年末から逆算した施術計画を明確にすると、顧客理解・次回予約・単価の質がどう変わるかを観察する
- target: 8月後半の担当顧客
- observation metrics: 提案実施数／受容数／次回予約／顧客の反応／自宅での扱いやすさ
- unresolved caution: 一日で因果を断定しない
- next check: 複数日・複数顧客で観察する

Notion also contains the same experiment as a higher-order project/hypothesis object. This is acceptable because the semantic role differs:

- Drive `実験ログ` = primary operating record / observation ledger
- Notion = meaning, hypothesis refinement, contradiction, cross-Case learning, promotion toward Knowledge
- Salon Growth OS = management display / operating cockpit

Do not require Ikeda to update all three manually.

## Mapping to Issue #2

Issue #2 extends `improvement_actions` with:

- `hypothesis`
- `observation_metrics`
- `interpretation`
- `unresolved_question`

For v0.1 these fields allow the runtime UI to represent the experiment model. They do **not** make Supabase the permanent canonical source of the experiment.

During the initial implementation, the runtime may contain a temporary local projection for EXP-0001 so the UI can be field-tested. This is a technical bridge only.

## Preferred future handoff

### Mode A — Sheets → Salon Growth OS projection (preferred)
Google Sheets `実験ログ` remains the canonical experiment record. A server-side adapter normalizes the active experiment for Salon Growth OS.

Benefits:
- matches the existing no-direct-input workflow
- keeps primary operating facts in Drive/Sheets
- avoids forcing Ikeda to maintain a second experiment ledger
- allows ChatGPT to continue updating Sheets from the conversational workflow

### Mode B — Salon Growth OS canonical active experiment
Allowed only if real use shows the app is clearly the natural place to update active experiments. If selected later:
- architecture docs must be updated,
- Sheets must stop being independently maintained for the same active fields,
- synchronization direction must be explicit.

### Mode C — Temporary local pilot
Allowed for Issue #2 implementation validation only. Synthetic/non-PII seed data or a temporary EXP-0001 projection may exist in Supabase. It must not become a second human-maintained source.

Current v0.1 status: **Mode C for implementation validation, target Mode A unless field evidence supports Mode B.**

## KPI source mapping

Google Sheets `KPI日報` already records:

- date
- weekday
- workday state
- technical sales
- visits
- next-visit booking count
- average ticket
- next-visit booking rate
- new / existing customer signals
- referral / AI-search signals
- available-time signal
- menu / notes
- observation notes

Salon Growth OS should not create another daily KPI form if a reliable Sheets adapter can supply these facts.

## Case source mapping

Google Sheets `施術ケース` already records the primary Case structure, including:

- Case ID
- consultation
- confirmed facts
- cause hypothesis
- compared options
- selected method
- intentionally non-selected method / reason
- outcome / reaction
- next-visit check
- decision criteria
- Knowledge candidate
- publishing candidate

Salon Growth OS must not copy full Case/customer records. Future Case-to-Learning integration should project only non-PII learning signals.

## Prohibited patterns

- Ikeda manually updating the same experiment in Sheets, Notion, and Salon Growth OS
- creating another KPI daily-input workflow when Sheets is already the primary log
- copying customer names, phone numbers, email, photos or identifiable visit histories into Salon Growth OS
- creating another Case database inside Salon Growth OS
- automatic causal classification from one observation
- treating missing data as zero or negative evidence
- adding a new SaaS solely to bridge these systems

## Adapter design criteria

A future adapter is justified only if it:

1. removes manual work,
2. preserves canonical ownership,
3. makes missing/stale data visible,
4. has a reversible failure mode,
5. does not move customer PII into the management repository,
6. is simpler than the manual workflow it replaces.

## Decision checkpoint after Issue #2

Review after real field use:

- Did EXP-0001 naturally get updated through ChatGPT → Sheets?
- Did the Salon Growth OS UI need write capability, or was display enough?
- Which fields changed daily versus weekly?
- Did the UI reduce thinking friction or merely duplicate Notion/Sheets?
- Did any manual double maintenance occur?
- Is a Sheets adapter now clearly justified?

Use that evidence before implementing cross-system synchronization.