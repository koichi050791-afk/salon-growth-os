# Codex implementation backlog — Ikeda Salon OS v0.1

Status: 2026-08-18

This backlog is subordinate to `IKEDA_OS_V0_1.md`, `IKEDA_OS_ROADMAP.md`, and the active GitHub Issues. Build order follows field value, reversibility, and the no-duplicate-input rule.

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

Implementation branch: `codex/experiment-tracking-v0.1`.

## P1 — AFTER ISSUE #2 FIELD USE

### 2. Issue #3 — Ikeda operating cockpit
Status: **defined; do not implement before Issue #2 is used and reviewed**.

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

### 3. Issue #4 — Weekly review assembly model
Status: **defined**.

Goal:
Expose one server-side review payload for ChatGPT/review workflows without adding an LLM dependency inside the app.

Must separate:
- KPI facts
- observations
- interpretation
- unresolved questions
- missing-data flags

Reuse Issue #2 experiment data.

## P2 — DISCOVERY

### 4. Issue #5 — Non-PII Case → Learning bridge
Status: **discovery only**.

Goal:
Define the narrowest handoff from Drive/Sheets Case facts and Notion Knowledge into anonymized management learning signals.

Do not implement storage/sync until canonical Case ID, allowed fields, update/version behavior, and read/write direction are validated.

### 5. Source-of-truth adapter decision
Status: **observe first**.

Current Experiment v0.1 may temporarily use a dual representation for validation, but Ikeda must not manually maintain both Notion and Salon Growth OS.

After field use choose one:
- display adapter with Notion canonical,
- Salon Growth OS canonical for active management experiment,
- or another explicitly documented single-owner model.

See `SOURCE_OF_TRUTH_CONTRACT.md`.

## P3 — ONLY WHEN A REAL SOURCE EXISTS

### 6. KPI / Sheets adapter
Only if it removes duplicate entry and preserves Sheets as canonical primary facts.

### 7. Daily brief assembly
Do not make this a booking/calendar project by default. Build only after exact source data and user need are validated. Missing appointment data must remain explicit.

### 8. Calendar context
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

If the answer is unclear, return to discovery instead of coding.