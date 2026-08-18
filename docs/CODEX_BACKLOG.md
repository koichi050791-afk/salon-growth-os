# Codex implementation backlog — v0.1

This backlog captures implementation candidates that should only be built after the operating need is validated. The order reflects current value, reversibility, and data availability.

## P0 — Operating foundation

### 1. Daily brief data adapter
Goal: expose a small server-side interface that can assemble the data needed for a daily operating brief without creating duplicate manual input.

Acceptance criteria:
- Returns current date, store, latest weekly KPI data, latest improvement action, and missing-data flags.
- Does not invent appointment/customer data.
- Keeps data access behind repository functions.
- Has a clear empty state when source data is absent.

Status: candidate — validate exact Calendar / booking source first.

### 2. Experiment tracking surface
Goal: make one active experiment visible next to weekly KPIs so operating changes can be evaluated instead of forgotten.

Acceptance criteria:
- Shows hypothesis, observation metric, start date, and status.
- Separates observed result from interpretation.
- Does not declare causality from one day / one observation.
- Uses existing data model where possible; schema change requires explicit issue approval.

Status: candidate.

## P1 — Learning loop

### 3. Case-to-learning handoff (non-PII only)
Goal: let the management OS reference anonymized learning signals from treatment Cases without storing customer records here.

Acceptance criteria:
- No customer names or personally identifiable information.
- Stores only aggregate / anonymized learning signals.
- Makes source type explicit: observation / hypothesis / validated knowledge.
- Can be disabled without affecting core KPI features.

Status: discovery first.

### 4. Weekly review generator input model
Goal: structure the exact data required for ChatGPT to produce a weekly operating review.

Acceptance criteria:
- KPI changes, active experiment, notable observations, and unresolved questions are available from one server function.
- Missing data is explicit.
- No LLM dependency is required inside the app for v0.1.

Status: candidate.

## P2 — Later, only after validation

### 5. My Hair OS bridge
Do not implement customer-facing My Hair OS inside this repository.
If integration is later required, define a narrow API / export boundary with explicit consent and privacy rules.

### 6. Booking integration
Do not build until a reliable source exists (e.g. supported export, Calendar sync, or documented API). Do not create a second manual booking ledger.

### 7. Product analytics
Only add product analytics after a real user-facing workflow exists and there is a concrete question to measure.

## Not in scope now

- Real customer CRM
- Customer consultation notes
- Customer photos
- Direct publishing automation
- Automatic causal recommendations from single-day data
- New paid SaaS dependencies without explicit approval
