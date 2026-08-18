<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Salon Growth OS — Codex operating rules

## Product role

This repository is the **management / growth / learning side** of 池田航一｜美容師OS. It is for KPI visibility, operating reviews, experiments, learning, and management decisions.

Do not turn this repository into a customer chart, CRM, or My Hair OS. Customer timeline / Decision / Future Plan functionality belongs outside this repository.

Read the architecture docs in `docs/` before implementing non-trivial features, especially:

- `IKEDA_OS_V0_1.md`
- `SOURCE_OF_TRUTH_CONTRACT.md`
- `KPI_CONTRACT_V0_1.md`
- `EXPERIMENT_PROJECTION_V0_1.md`
- `TECHNICAL_BOUNDARIES_V0_1.md`
- `CODEX_BACKLOG.md`

## Human / AI responsibility split

- ChatGPT: requirements, prioritization, product reasoning, operational interpretation, acceptance criteria, and implementation review.
- Codex: implementation, refactoring, tests, migrations, CI fixes, and technical documentation.
- GitHub: source of truth for issues, PRs, code, and implementation history.
- Human user: final product and operational decision.

Do not silently change product policy because a technical implementation is easier.

## Source-of-truth boundaries

- Google Drive / Sheets = canonical primary operating facts, KPI日報, 施術Case source data, and 実験ログ.
- Notion = higher-order meaning, hypothesis refinement, contradictions, decisions, Knowledge, and projects.
- Airtable = customer timeline, visits, Decision, Future Plan.
- GitHub = implementation decisions and code history.
- Salon Growth OS = management / learning projection and operating UI.

Do not create a second human-maintained ledger when a canonical source already exists.

Temporary runtime projections are allowed only when an issue explicitly permits them and must be documented as non-canonical.

## Data and privacy boundary

- Never commit real customer names, phone numbers, email addresses, face photos, appointment histories, consultation notes, or other personally identifiable salon customer data.
- Never paste production secrets, API keys, tokens, Airtable PATs, Supabase service-role keys, or Google credentials into source, issues, fixtures, logs, or docs.
- Use synthetic sample data in tests and screenshots.
- Treat public GitHub content as public by default.
- Keep customer-level PII out of this management repository and database.

## Product policy guardrails

The operating priority is:

salon work → customer experience → repeat → next visit → referral → search → AI/search discovery → SNS → new acquisition.

Do not introduce default logic that conflicts with this priority.

In particular, new Ikeda flows must not depend on or revive legacy recommendations such as:

- discount-first acquisition
- blanket coupons
- mandatory add-on proposals
- upsell incentives without customer need
- automatic acquisition-first recommendations
- automatic causal conclusions from thin data

`lib/services/improvement-engine.ts` and related generic recommendation logic are **legacy/review-before-use**. Do not call them from new Issue #2/#3/#4 surfaces unless a dedicated issue explicitly approves the dependency.

Do not present legacy `issue_cause` output as causal truth.

## Fact / observation / interpretation discipline

1. Facts, observations, hypotheses, interpretations, and validated Knowledge must remain distinguishable.
2. Missing values remain unknown/null. Never silently convert missing visits, booking data, capacity, or observations to zero.
3. Aggregates should expose data coverage or reconciliation warnings when the underlying data is incomplete or inconsistent.
4. One day, one customer, one post, or one experiment observation does not establish causality.
5. UI must not fabricate missing experiment result or interpretation.

## Business date and timezone

All business-day, week, and month semantics for Ikeda OS are based on `Asia/Tokyo`.

Do not introduce new business-date logic using ad hoc `new Date()` + `toISOString()` slicing when server timezone could change the business date.

Use the shared Tokyo business-date boundary once Issue #8 provides it. Until then, avoid expanding date-boundary logic and flag any requirement that depends on it.

Date-only strings must be handled without implicit UTC/local drift.

## Implementation principles

1. Prefer reducing duplicate input over adding another input screen.
2. Preserve the existing repository / service abstraction; inspect `lib/repositories`, database types, and migrations before changing data access.
3. Keep source-specific access behind repository/adapter boundaries. UI components should consume normalized models rather than know whether data came from Supabase or Sheets.
4. Avoid broad rewrites when a small, reversible change satisfies the requirement.
5. Add loading, empty, error, permission, and where relevant stale/data-quality states for new data-driven UI.
6. Do not introduce a new SaaS dependency unless the issue explicitly requires it.
7. Keep mobile usability first for operational screens.
8. Do not delete legacy tables/routes as part of unrelated feature work. Destructive cleanup requires a dedicated issue and explicit approval.

## Current implementation order

Use active GitHub Issues and `docs/CODEX_BACKLOG.md` as the authority.

Current sequence:

1. Issue #2 — Active Experiment Tracking
2. Issue #8 — Asia/Tokyo business-date correctness
3. Issue #9 — quarantine legacy prescriptive improvement engine
4. Issue #3 — Ikeda operating cockpit, only after Issue #2 field use
5. Issue #4 — Weekly review assembly model
6. Issue #5 / #7 — discovery before integration implementation

Do not skip discovery gates merely because a feature is technically easy to build.

## Codex workflow

For non-trivial work:

1. Read the relevant issue and acceptance criteria.
2. Read relevant architecture docs and this `AGENTS.md`.
3. Inspect the existing implementation before proposing new schema or dependencies.
4. State the smallest implementation plan in the PR description.
5. Implement on a branch, not directly on `main`.
6. Run relevant lint / typecheck / build / tests available in the repository.
7. Open a Draft PR for review unless the issue says otherwise.
8. Do not merge automatically unless explicitly requested.

If requirements conflict with existing code, data, product policy, or source ownership, surface the conflict instead of guessing.

## Definition of done

A feature is not done merely because the UI renders. It must:

- satisfy the issue acceptance criteria,
- preserve privacy boundaries,
- preserve source-of-truth ownership,
- handle empty/error/data-quality states,
- avoid unnecessary duplicate data entry,
- preserve fact-vs-interpretation separation,
- respect Asia/Tokyo business-date semantics where relevant,
- avoid legacy prescriptive recommendation leakage,
- pass available checks,
- and include a short note explaining what changed and what remains unverified.
