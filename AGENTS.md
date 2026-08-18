<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Salon Growth OS — Codex operating rules

## Product role

This repository is the management / growth / learning implementation side of 池田航一｜美容師OS.

The wider OS is now an **Experience Learning System** centered on professional Decisions:

Observation → Hypothesis → Options → Decision → Action → Outcome → Next Observation → Learning

The product is not a CRM, universal database, integration hub, or generic salon SaaS.

Highest-level test:

> Does this improve Ikeda's next salon-work decision without materially increasing work time?

Do not turn this repository into the customer chart or My Hair OS. Customer / Visit / Decision / Future Plan continuity belongs primarily in Airtable. Salon Growth OS may consume anonymized projections only where they are proven useful.

## Current priority

Use active GitHub Issues as the authority. As of 2026-08-18 the implementation/design sequence is:

1. Issue #12 — Decision OS v0.1: validate the minimal Decision Learning Loop
2. Issue #13 — Outcome + Next Observation lifecycle, after field validation
3. Issue #14 — retrieve past Decisions at the moment of salon work
4. Issue #5 — Decision → Learning bridge, discovery first
5. Issue #8 — Asia/Tokyo correctness where runtime business-date logic is touched
6. Issue #9 — quarantine legacy prescriptive engine before any new recommendation surface
7. Issue #2 / #3 / #4 / #7 — deferred until field use proves value

Do **not** implement Issue #2 merely because it was previously first in the roadmap.

## Decision v0.1 operating model

Only meaningful Decisions should be captured. Do not require all customers or all visits to be deeply documented.

Minimum field model:
1. consultation / customer concern
2. confirmed facts — Customer Truth
3. selected Decision
4. deliberately not selected option / action
5. Next Observation

Target manual capture time: <= 3 minutes per meaningful Decision.

Airtable already contains Customer / Visit / Decision / Future Plan and is the customer relational source. Do not create a second Decision store before proving a real gap.

A nullable `Professional Hypothesis` field has been added to Airtable so confirmed facts and stylist interpretation can remain separate.

Do not add Outcome / Prediction / Validation fields merely because they are conceptually attractive. Field-test first; add only what real use proves necessary.

## Human / AI responsibility split

- ChatGPT: single conversational entry point, classification, requirements, product reasoning, prioritization, comparison, review.
- Codex: code implementation, refactoring, tests, migrations, CI fixes, technical docs.
- GitHub: source of truth for issues, PRs, code, implementation history.
- Human user: final operational/product decision.

Do not silently change product policy because a technical implementation is easier.

## Source-of-truth boundaries

- Airtable = customer / visit / customer-level Decision / Future Plan continuity.
- Google Drive / Sheets = KPI and primary/source facts where currently used.
- Notion = hypotheses, Knowledge Candidates, conditional Knowledge, projects, Strategic Decisions.
- GitHub = implementation decisions and code history.
- Salon Growth OS = management / growth / learning projection only.

Every fact has one canonical owner. Other systems may reference, summarize, display, analyze, or derive; they should not become competing human-maintained copies.

Do not build universal two-way sync.

## Data and privacy boundary

Never commit real customer names, phone numbers, emails, face photos, identifying appointment histories, consultation notes, or other customer PII.

Never commit production secrets, tokens, API keys, service-role keys, Airtable PATs, or Google credentials.

Use synthetic sample data in tests and screenshots. Treat public GitHub content as public.

## Customer Truth / Professional Hypothesis discipline

1. Customer Truth = what the customer actually said or what was directly confirmed.
2. Professional Hypothesis = stylist interpretation, suspected cause, or working theory.
3. Outcome = later observation; it is not automatically proof of the hypothesis.
4. Missing information remains missing/null.
5. AI must not fabricate or silently promote hypotheses into facts.
6. One Decision, one customer, one day, or one experiment observation does not establish causality or Knowledge.
7. Past Decision context must not be treated as current customer truth; preferences and conditions can change.

## Knowledge discipline

Knowledge is not a collection of answers. It is a set of **conditional judgment patterns**.

Do not promote a single Decision directly to Knowledge.

A mature Knowledge pattern should be able to represent:
- conditions where it appears to hold,
- conditions where it does not hold,
- supporting Decisions / Outcomes,
- counterexamples,
- uncertainty / unresolved questions.

## Product policy guardrails

Operating priority:

salon work → customer experience → repeat → next visit → referral → search → AI/search discovery → SNS → new acquisition.

Do not introduce default logic based on:
- discount-first acquisition,
- blanket coupons,
- mandatory add-on proposals,
- upsell incentives without customer need,
- acquisition-first recommendations,
- automatic causal conclusions from thin evidence.

`lib/services/improvement-engine.ts` and related generic recommendation logic are legacy/review-before-use. New Decision OS flows must not depend on them unless a dedicated issue explicitly approves the dependency.

## Next Observation principle

Next booking is not modeled primarily as a revenue lock-in mechanism.

The preferred logic is:

Decision → what should change / what remains uncertain → when it should be checked → Next Observation → next visit when appropriate.

The product should make the reason for the next visit clearer, not merely increase booking prompts.

## Business date and timezone

All business-day, week, and month semantics are based on `Asia/Tokyo`.

Do not introduce ad hoc `new Date()` + `toISOString()` slicing for business-date logic where runtime timezone can shift the date.

Issue #8 defines the correction path. Until then, avoid expanding date-boundary logic unnecessarily.

## Integration / adapter gate

Do not build an adapter because a service can be connected.

An adapter should proceed only when it:
1. removes demonstrated duplicate work or improves retrieval at the moment of work,
2. preserves one Source of Truth,
3. has explicit missing/stale/error behavior,
4. is simpler than the manual workflow it replaces.

Read-only projections are preferred before write integration.

## Implementation principles

1. Inspect existing code and data model before proposing schema.
2. Prefer the smallest reversible change.
3. Prefer reducing duplicate input over adding screens.
4. Preserve existing repository/service abstraction.
5. Keep source-specific access behind adapters/repositories.
6. Add loading/empty/error/data-quality states where relevant.
7. Do not introduce new SaaS dependencies unless an issue explicitly requires them.
8. Keep mobile usability first for operational surfaces.
9. Do not delete legacy tables/routes as part of unrelated work.
10. A documentation/projection/retrieval solution may be better than a new persistent store.

## Codex workflow

For non-trivial work:
1. Read the relevant GitHub Issue and comments.
2. Read this `AGENTS.md` and relevant docs.
3. Inspect the existing implementation before proposing new schema or dependencies.
4. State the smallest implementation plan before coding.
5. Work on a branch, not `main`.
6. Run available lint / typecheck / build / tests.
7. Open a Draft PR for review unless the issue says otherwise.
8. Do not merge automatically.

If requirements conflict with code, data ownership, privacy, or product policy, surface the conflict instead of guessing.

## Definition of done

A change is not done because the UI renders. It must:
- improve or validate the Decision Learning Loop,
- satisfy the issue acceptance criteria,
- preserve privacy and Source of Truth,
- preserve Customer Truth vs Professional Hypothesis separation,
- avoid unnecessary duplicate input,
- preserve uncertainty and missing states,
- respect Asia/Tokyo semantics where relevant,
- avoid legacy prescriptive recommendation leakage,
- pass available checks,
- document what remains unverified in real salon work.
