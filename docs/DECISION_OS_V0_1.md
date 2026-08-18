# Decision OS v0.1

Status: pre-implementation field-validation specification
Date: 2026-08-18

## Purpose

Ikeda Salon OS is an Experience Learning System, not an information-management product.

The center unit is the professional Decision:

Observation → Hypothesis → Options → Decision → Action → Outcome → Next Observation → Learning

The highest-level test is:

> Does this improve Ikeda's next salon-work decision without materially increasing work time?

The business objective remains sustainable ¥1.3M monthly technical sales while protecting 9:00–18:00 working hours and family time.

## What v0.1 is validating

We are not validating how much data can be stored.

We are validating whether **selective capture of high-value Decisions** can later improve:
- the next consultation,
- customer understanding,
- next-visit reason,
- prediction/validation learning,
- Knowledge development,
- content reuse,
- management learning,

without creating after-hours documentation burden.

## Which Decisions are worth keeping

Capture only when at least one is true:
- genuine ambiguity/judgment existed,
- multiple reasonable options existed,
- something was deliberately not done,
- a previous hypothesis can be validated,
- outcome differed from expectation,
- customer response was distinctive,
- the pattern may transfer to another customer,
- it may become a Knowledge Candidate.

Routine visits do not require deep capture.

## Minimum capture

Target: <= 3 minutes.

1. Consultation / concern
2. Confirmed facts — Customer Truth
3. Selected Decision
4. Deliberately not selected action/option
5. Next Observation

No field is universally mandatory if the information is not known or useful.

## Customer Truth vs Professional Hypothesis

Customer Truth:
- customer-reported statement,
- observed hair condition,
- confirmed history,
- directly confirmed constraints.

Professional Hypothesis:
- suspected cause,
- stylist interpretation,
- expected mechanism,
- working theory.

They must never be conflated.

AI/app must not fill missing facts or promote a hypothesis into Customer Truth.

## Canonical ownership

### Airtable
Canonical customer relational continuity:
Customer / Visit / Decision / Future Plan.

Existing Decision fields cover most minimum capture. A nullable `Professional Hypothesis` field has been added.

Do not create another customer Decision database in Salon Growth OS unless field use proves a real gap.

### Notion
Higher-order learning:
- hypotheses,
- Knowledge Candidates,
- conditional Knowledge,
- contradictions/counterexamples,
- strategic/product Decisions.

Notion `Strategic Decision Log` is not the customer salon-Decision source of truth.

### Drive / Sheets
KPI and primary/source facts where already canonical.

### Salon Growth OS
Anonymized management/growth/learning projection only when useful.

## Next Observation

Next booking is not primarily a revenue lock-in mechanism.

Preferred chain:

Decision → expected/uncertain change → what to check → appropriate check timing → Next Observation → next visit if needed.

The system should make the next visit's reason explicit rather than maximize booking prompts.

## Outcome / Validation — later slice

Do not force these into v0.1 capture.

Potential later lifecycle:

Decision → optional Prediction → Action → Outcome → Validation → Next Observation → revised Decision / Learning.

Outcome is observation, not proof.
Validation may support, weaken, or revise a prior hypothesis.
Unknown/not checked is valid.

See Issue #13.

## Past Decision retrieval — later slice

The primary reuse moment is the next salon conversation, not a dashboard.

A useful pre-visit/retrieval view should stay small:
- last relevant Decision,
- why it was selected,
- deliberately not selected option,
- open Next Observation,
- known Outcome/Validation,
- reminder that current state/preferences may have changed.

See Issue #14.

## Knowledge promotion

Never:
Decision → Knowledge.

Preferred path:
Decision → Outcome → similar Decisions → counterexample → Knowledge Candidate → conditional Knowledge.

Knowledge must be able to represent:
- where a pattern holds,
- where it does not,
- supporting evidence,
- counterexamples,
- unresolved questions.

## Content reuse

Content is downstream of real work:

Salon work → Decision → Knowledge/Content Candidate → editorial transformation.

Never create Decisions or Cases for the purpose of producing posts.

## Success metrics

Do not optimize Decision count.

Prefer evidence such as:
- a prior Decision was useful at the next visit,
- Next Observation was actually checked,
- prediction/outcome comparison changed the next Decision,
- a Decision was reused as Knowledge Candidate,
- a Decision became useful content without extra case creation,
- consultation quality/time improved,
- after-hours admin burden stayed flat or declined.

A useful future concept is Decision Reuse Rate, but do not add logging merely to measure it.

## Implementation constraints

- no new SaaS dependency,
- no customer PII in this repository,
- no destructive migration,
- no duplicate customer Decision store,
- no mandatory all-visit input form,
- preserve repository/service abstraction,
- prefer additive/nullable/reversible changes,
- do not depend on legacy `improvement-engine.ts`,
- preserve missing/unknown states,
- Asia/Tokyo for business-date semantics.

## Implementation order

1. Issue #12 — Decision OS v0.1
2. Issue #13 — Outcome + Next Observation lifecycle
3. Issue #14 — past Decision retrieval
4. Issue #5 — Decision → Learning discovery
5. later: experiment projection, Home, Weekly Review, adapters, My Hair OS, automation only when field value is proven.

## Before writing code

Codex must first inspect the current repository and answer:
1. What existing code can support Issue #12 without a new persistent Decision store?
2. Does Salon Growth OS need any runtime Decision UI in v0.1, or is a projection/retrieval/fixture/documented interface enough?
3. Which change most directly improves the next salon-work Decision?
4. What can remain manual through ChatGPT/Airtable until field use proves a technical need?

Prefer the smallest answer.
