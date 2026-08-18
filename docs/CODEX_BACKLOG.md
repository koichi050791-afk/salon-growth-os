# Codex implementation backlog — Ikeda Salon OS v0.1

Status: 2026-08-18

This backlog is subordinate to `IKEDA_OS_V0_1.md`, `IKEDA_OS_ROADMAP.md`, `TECHNICAL_BOUNDARIES_V0_1.md`, and active GitHub Issues. Build order follows field value, correctness, reversibility, and the no-duplicate-input rule.

## P0 — CURRENT

### 1. Issue #2 — Active experiment tracking surface
Status: **ready for Codex implementation**.

Goal:
Represent the learning chain:

hypothesis → observation → result → interpretation → unresolved question → next check.

Confirmed decisions:
- reuse `improvement_actions`
- no new `experiments` table
- add nullable `hypothesis`, `observation_metrics`, `interpretation`, `unresolved_question`
- keep `HomeActionCard`
- add `ActiveExperimentCard`
- explicit empty/error states
- no causal claim from one observation
- no customer PII
- do not depend on legacy `improvement-engine.ts`

Implementation branch: `codex/experiment-tracking-v0.1`.

### 2. Issue #8 — Asia/Tokyo business-date correctness
Status: **correctness prerequisite for Home/Sheets work**.

Goal:
Create one explicit Asia/Tokyo business-date utility boundary and remove ad hoc UTC/local date mixing from relevant Home calculations.

Issue #2 may proceed independently if it does not add business-date logic. Issue #8 should be complete before Issue #3 and Issue #7 runtime implementation.

### 3. Issue #9 — quarantine legacy prescriptive improvement engine
Status: **audit/quarantine before new recommendation or Home flows**.

Goal:
Prevent old generic recommendations—discounts, blanket upsells, mandatory proposals, acquisition-first actions—from leaking into Ikeda OS.

Issue #2 may proceed if isolated from this engine. Complete the audit before Issue #3 or any new automatic recommendation surface.

## P1 — AFTER ISSUE #2 FIELD USE

### 4. Issue #3 — Ikeda operating cockpit
Status: **defined; do not implement before Issue #2 is used and reviewed**.

Dependencies/guards:
- Issue #8 business-date semantics resolved
- Issue #9 legacy recommendation dependencies understood/quarantined

Goal:
Reframe Home from generic store dashboard to personal management / learning cockpit.

Primary mobile hierarchy:
1. current state
2. monthly ¥1.3M target progress
3. current operating focus
4. active experiment
5. KPI pulse
6. learning / unresolved question
7. minimum shortcuts

Avoid broad rewrites. De-emphasize legacy multi-store/staff surfaces before deleting schema.

### 5. Issue #4 — Weekly review assembly model
Status: **defined**.

Goal:
Expose one server-side review payload for ChatGPT/review workflows without adding an LLM dependency inside the app.

Must separate:
- KPI facts
- observations
- interpretation
- unresolved questions
- missing-data flags

Reuse Issue #2 experiment data and KPI coverage semantics.

## P2 — DISCOVERY

### 6. Issue #5 — Non-PII Case → Learning bridge
Status: **discovery only**.

Goal:
Define the narrowest handoff from Drive/Sheets Case facts and Notion Knowledge into anonymized management learning signals.

Do not implement storage/sync until canonical Case ID, allowed fields, update/version behavior, and read/write direction are validated.

### 7. Issue #7 — Google Sheets read adapter
Status: **discovery after Issue #2 field use**.

Goal:
Read canonical KPI and Experiment operating facts from Sheets without creating another manual ledger.

Requirements:
- server-side/read-only first
- bounded ranges
- Asia/Tokyo normalization via Issue #8 utility
- null/coverage/reconciliation semantics
- no customer PII
- explicit stale/error state

## P3 — ONLY WHEN A REAL SOURCE/NEED EXISTS

### 8. Daily brief assembly
Do not make this a booking/calendar project by default. Build only after exact source data and user need are validated. Missing appointment data must remain explicit.

### 9. Calendar context
Use Google Calendar only where actual calendar events materially improve the operating view. Never create a second booking ledger.

## Deferred / out of scope

- customer CRM inside this repository
- customer names / phone / email / photos / detailed appointment histories
- My Hair OS customer-facing implementation
- full Airtable customer timeline UI
- generic multi-store SaaS expansion
- direct social publishing automation
- automatic AI causal recommendations
- product analytics without a concrete product question
- new paid SaaS dependencies without explicit approval

## Build gate

Before starting any new Codex issue, confirm:

1. Does it solve an observed operating problem?
2. Does it reduce work or improve decision/learning quality?
3. Is there a canonical source for the required data?
4. Does it avoid duplicate manual input?
5. Is the smallest version reversible?
6. Can it be implemented without customer PII?
7. Are Asia/Tokyo business-date semantics explicit?
8. Does it avoid depending on legacy prescriptive recommendation logic?

If the answer is unclear, return to discovery instead of coding.