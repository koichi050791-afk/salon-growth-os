# Codex implementation backlog — Decision-first Ikeda Salon OS

Status: 2026-08-18

This backlog is subordinate to active GitHub Issues, `AGENTS.md`, and `docs/DECISION_OS_V0_1.md`.

Build order follows field value, customer impact, reversibility, privacy, and the no-duplicate-input rule.

## P0 — CURRENT

### 1. Issue #12 — Decision OS v0.1
Status: **field validation first; inspect before coding**.

Goal:
Validate that meaningful professional Decisions can be captured in <=3 minutes and later reused.

Minimum model:
- consultation / concern
- confirmed facts — Customer Truth
- selected Decision
- deliberately not selected option/action
- Next Observation

Rules:
- Airtable remains canonical for customer Visit / Decision continuity
- do not create a second Decision store
- Customer Truth and Professional Hypothesis must remain separate
- all-customer/all-visit deep documentation is explicitly out of scope
- no customer PII in this repository
- no legacy improvement-engine dependency
- prefer the smallest reversible implementation, including no runtime persistence if field use does not justify it

Implementation branch: `codex/decision-os-v0.1`.

### 2. Real salon field validation
Status: **required before expanding schema/UI**.

Observe:
- actual capture time
- fields that feel unnecessary
- missing fields that block future reuse
- whether Next Observation is useful at the next visit
- where duplicate work appears
- whether a Decision is later reused

Do not optimize Decision count.

## P1 — CLOSE THE LEARNING LOOP

### 3. Issue #13 — Decision Outcome + Next Observation lifecycle
Status: **discovery after real Decision capture**.

Goal:
Find the minimum useful way to revisit a prior Decision and compare expected vs actual result.

Potential later fields are not mandatory until validated:
- outcome_observed
- customer_response
- home_result
- validation_state/note
- optional prediction

### 4. Issue #14 — retrieve past Decisions at the moment of salon work
Status: **manual/ChatGPT retrieval may be sufficient first**.

Goal:
Surface the last relevant Decision, non-selected option, open Next Observation, and known Outcome/Validation in seconds.

Past information is context, not current Customer Truth. Re-confirm current preference/state.

### 5. Issue #5 — Decision → Learning bridge
Status: **discovery only**.

Goal:
Move from repeated Decisions + Outcomes + counterexamples to conditional Knowledge Candidates without creating a second customer database.

## P1 CORRECTNESS / SAFETY

### 6. Issue #8 — Asia/Tokyo business-date correctness
Status: **required whenever runtime business-date work is touched**.

Do not allow UTC/local drift in business day/week/month semantics.

### 7. Issue #9 — quarantine legacy prescriptive improvement engine
Status: **required before any new recommendation surface**.

Do not let discount/blanket-upsell/acquisition-first or causal-prescriptive legacy logic leak into Decision OS.

## P2 — DEFERRED UNTIL FIELD VALUE IS PROVEN

### Issue #2 — Active Experiment Tracking
Experiment remains a Learning Layer. Resume only if real Decision/weekly-review use proves persistent experiment visibility useful.

### Issue #3 — Home / Decision Learning cockpit
Do not redesign Home until real field use identifies the few elements that improve the next salon-work decision.

### Issue #4 — Weekly Decision learning review
Resume when weekly synthesis repeatedly helps the next week or removes manual review burden.

### Issue #7 — read adapters
Build only when a concrete manual retrieval/duplication problem is demonstrated.

## P3 — LATER

- My Hair OS customer-facing UI
- Prediction/Validation automation
- advanced semantic retrieval
- write integrations across tools
- agents / advanced automation
- content automation beyond explicit editorial transformation

These are downstream of proven Decision reuse.

## Source-of-truth summary

- Airtable: customer / visit / Decision / Future Plan continuity
- Drive / Sheets: KPI and primary/source facts where canonical
- Notion: hypotheses, Knowledge Candidates, conditional Knowledge, strategic/product decisions
- GitHub: implementation source of truth
- Salon Growth OS: anonymized management/growth/learning projections only

## Build gate

Before starting any new Codex work, confirm:

1. Does it improve the next salon-work Decision or reduce real work?
2. Is the need observed rather than imagined?
3. Is there one clear Source of Truth?
4. Does it avoid duplicate manual input?
5. Is the smallest version reversible?
6. Can it avoid customer PII in this repository?
7. Are facts/hypotheses/outcomes kept distinct?
8. Does it preserve missing/unknown states?
9. Are Asia/Tokyo semantics explicit where needed?
10. Does it avoid legacy prescriptive logic?

If unclear, return to field validation/discovery instead of coding.
