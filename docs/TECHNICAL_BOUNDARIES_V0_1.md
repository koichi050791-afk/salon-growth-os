# Ikeda Salon OS v0.1 — Technical Boundaries

Status: 2026-08-18

## Purpose

Define where new functionality should live before Codex implementation expands the system.

The goal is not to redesign the stack. The goal is to preserve the useful Next.js / Supabase foundation while stopping legacy store-SaaS assumptions from leaking into the Ikeda operating model.

## Existing stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase SSR client
- repository layer in `lib/repositories`
- domain/service logic in `lib/services`
- App Router UI in `app`

No new runtime framework is required for v0.1.

## Layer contract

### `app/`
Responsibilities:
- composition
- mobile-first UI
- explicit loading / empty / error states
- display of normalized facts / observations / hypotheses / interpretation

Do not put source-specific Google Sheets parsing logic directly in page components.

### `lib/repositories/`
Responsibilities:
- persistence/data-source access
- normalized retrieval APIs
- no product interpretation beyond query semantics

Current Supabase repositories stay intact.

A future Sheets read adapter should either:
1. live behind a repository-like interface, or
2. live in a source adapter module consumed by a repository/service facade.

Do not make page components choose between Supabase and Sheets.

### `lib/services/`
Responsibilities:
- assembly of normalized operating models
- safe calculations
- fact/interpretation separation
- review payload construction

Services may combine repositories, but must not silently turn missing values into zero or generate causal claims.

### `lib/types/`
Responsibilities:
- persistence types
- normalized view/read models
- explicit source/coverage/error semantics

Future normalized KPI types should distinguish source values from derived values and carry coverage metadata.

## Recommended normalized models

### OperatingMetric

Conceptual fields:
- key
- value: number | null
- unit
- source
- coverage: complete | partial | missing | unknown
- observed_through: date | null
- warning: string | null

### ActiveExperimentProjection

Conceptual fields:
- experiment_id
- title
- hypothesis
- observation_metrics
- start_date
- status
- observed_result
- interpretation
- unresolved_question
- next_check
- source
- observed_through
- stale

### WeeklyReviewInput

Conceptual groups:
- period
- facts
- data_quality
- active_experiment
- observations
- interpretation
- unresolved_questions
- next_checks

Facts and interpretation must be different keys/types.

## Supabase role during v0.1

Supabase remains:
- authentication backend
- existing runtime persistence
- temporary storage/projection for Issue #2 if needed
- compatibility layer for existing weekly actions and configuration

Supabase should not automatically become the canonical owner of KPI/Case/Experiment facts that are already maintained in Google Sheets.

## Google Sheets adapter boundary

Future adapter is read-only first.

Rules:
- server-side only
- bounded ranges only
- no secrets in browser bundles
- no credentials in repository/issues/logs
- blank cells remain null
- preserve source date / freshness
- normalize Asia/Tokyo dates before comparison
- explicit stale/error states
- no customer PII projection

The first adapter should read only:
- `KPI日報`
- `実験ログ`

`施術ケース` remains outside runtime until the non-PII Case→Learning design is approved.

## Time semantics

All business-day, workday, week, and month semantics for Ikeda OS are based on `Asia/Tokyo`.

Do not derive business dates by assuming the server runtime timezone.

Avoid mixing:
- local `Date` getters
- UTC `toISOString()` slicing
- date-only strings parsed with implicit timezone semantics

Create one date utility boundary before broad Home/refactor work.

Required utility concepts:
- Tokyo current date `YYYY-MM-DD`
- Tokyo current month `YYYY-MM`
- week start from Tokyo business date
- safe date-only arithmetic without UTC/local drift

## Legacy advisory engine boundary

`lib/services/improvement-engine.ts` is legacy product logic.

It contains prescriptive actions such as:
- discount coupons
- mandatory upsell/care proposals
- next-visit incentives
- generic acquisition pushes

These do not match the current Ikeda product policy.

Rules:
- do not reuse `ACTION_MAP` for new Ikeda screens
- do not surface it in the new cockpit
- do not treat its `issue_cause` labels as causal truth
- no new features should depend on it without explicit product review

It may remain in the repository for backward compatibility until its live dependencies are audited.

## Legacy productivity calculations

Existing calculations include store/staff productivity assumptions and an elapsed-working-day helper that does not represent Ikeda's actual schedule.

Do not use legacy productivity utilities to drive new v0.1 decisions unless their semantics are explicitly validated.

The target operating model should prioritize:
- monthly technical sales progress
- visits where coverage is valid
- average ticket where denominator is valid
- next-visit booking where denominator is valid
- capacity only when source is reliable
- active experiment / learning

## Issue #2 implementation boundary

Issue #2 should stay small:
- migration on `improvement_actions`
- DB type extension
- repository helper
- ActiveExperimentCard
- explicit empty/error states

Do not combine with:
- Sheets authentication
- Sheets adapter
- Home redesign
- legacy engine cleanup
- KPI model rewrite

## Technical risk register

### R1 — timezone drift
Severity: high for morning/month-boundary use.
Mitigation: dedicated Asia/Tokyo business-date utilities and tests.

### R2 — legacy prescriptive recommendations conflict with product policy
Severity: high if surfaced/reused.
Mitigation: classify as legacy, block new dependencies, dedicated cleanup issue.

### R3 — duplicate sources of truth
Severity: high operationally.
Mitigation: Sheets canonical for operating records; source projection contract; no duplicate manual entry.

### R4 — partial KPI data presented as complete
Severity: high for decision quality.
Mitigation: coverage metadata, null preservation, reconciliation warnings.

### R5 — broad rewrite before field evidence
Severity: medium/high.
Mitigation: issue sequencing and reversible slices.

## Implementation gate

Before Codex changes architecture, require an Issue that states:
- source of truth
- layer touched
- normalized type changes
- privacy impact
- failure/empty behavior
- timezone behavior
- rollback/reversibility

If these are unclear, stay in discovery.