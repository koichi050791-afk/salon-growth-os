# Ikeda Salon OS — Product Roadmap

As of 2026-08-18.

## Product role

This repository is the management / growth / learning implementation layer of the wider 池田航一｜美容師OS.

It is not the customer CRM and it is not My Hair OS.

Fixed role split:

- ChatGPT = single entry point, orchestration, requirements, prioritization, review
- Google Drive / Sheets = facts, primary records, KPI, treatment Case source data
- Notion = meaning, hypotheses, decisions, Knowledge, projects
- Airtable = customer timeline, visits, Decision, Future Plan
- GitHub = canonical source for issues, PRs, code, implementation history
- Codex = implementation, migrations, refactoring, tests, CI fixes
- Lovable = customer-facing My Hair OS prototype UI
- Canva = publishing assets / expression
- Google Calendar = time axis only when real schedule data exists

No duplicate manual input. Default flow is Ikeda → ChatGPT → appropriate system.

Core loop:

field work → record → learn → return value to customer → verify next visit → Case → experiment → system implementation when needed → field verification.

## Roadmap rule

Build only features that improve at least one of:

- salon-work decision quality
- customer experience
- repeat / next-visit planning
- Case learning
- operating visibility toward stable monthly technical sales of ¥1.3M
- reduction of duplicate/manual work

Do not build features merely because they make the dashboard look complete.

---

## Phase 0 — Foundation — COMPLETE

- AGENTS.md operating rules
- privacy boundary
- ChatGPT / Codex / GitHub responsibility split
- Codex backlog
- repository/service abstraction preserved
- PR #1 merged to main on 2026-08-18

---

## Phase 1 — Learning Layer — CURRENT

### Issue #2 — Active experiment tracking

Status: ready for Codex implementation.

Goal:
Make one active experiment visible near KPI context and preserve the chain:

hypothesis → observation → result → interpretation → unresolved question → next check.

Implementation decision:
- reuse `improvement_actions`
- no new experiments table
- additive nullable columns only
- keep HomeActionCard
- add ActiveExperimentCard
- no causal claim from one observation

This must be implemented and field-tested before a broad home-screen redesign.

---

## Phase 2 — Personal Operating Cockpit

### Home redesign for Ikeda

Goal:
Shift the home mental model from generic store dashboard to Ikeda's personal operating cockpit.

Target mobile hierarchy:
1. Today / current state
2. Monthly ¥1.3M target progress
3. Current operating focus
4. Active experiment
5. KPI pulse
6. Learning / unresolved question
7. minimum shortcuts

Keep:
- Next.js / Supabase foundation
- auth
- repository abstraction
- valid KPI calculation utilities
- explicit empty/error states

De-emphasize or remove from primary mobile flow:
- generic store-management framing
- staff-management shortcuts not used in Ikeda's operating loop
- productivity labels that do not support a real decision
- weekly-input-first navigation as the dominant home action

Do not add new input screens unless there is no reliable existing source.

---

## Phase 3 — Review Loop

### Weekly review assembly model

Goal:
Expose one server-side review payload that ChatGPT can use without manually collecting information from multiple screens.

Minimum payload:
- period
- KPI facts
- active experiment
- observed results
- interpretation
- unresolved questions
- missing-data flags
- candidate next check

Rules:
- facts and interpretation must be structurally separate
- missing data must be explicit
- no LLM dependency inside the app for the first version
- do not auto-declare success/failure from a single period

Monthly review later focuses on stability, not peak sales.

---

## Phase 4 — Case → Learning bridge

Goal:
Connect salon-work Cases to management learning without storing customer-level PII in this repository.

Allowed non-PII learning signal fields:
- case_id
- theme
- confirmed_facts
- cause_hypothesis
- options_compared
- selected_method
- non_selected_method
- non_selection_reason
- outcome_signal
- next_check
- knowledge_candidate
- source_type

source_type should distinguish:
- observation
- hypothesis
- validated_knowledge

This is a learning bridge only. Airtable remains the customer timeline layer. Drive / Sheets remain primary Case sources. Notion remains the meaning / Knowledge layer.

Do not implement until the handoff source and identifier strategy are validated.

---

## Phase 5 — Source adapters and duplicate-input reduction

Potential adapters, only after source validation:
- Google Sheets KPI adapter
- Case learning import/export boundary
- review export to ChatGPT / Notion workflow
- Calendar context only where actual calendar data materially improves a screen

Rules:
- source system remains source of truth
- adapter is read-oriented by default
- do not create a second booking ledger
- no unsupported scraping or fragile automation
- no new paid SaaS dependency unless explicitly approved

---

## Deferred

- real customer CRM inside this repository
- customer names / phone / email / photos / detailed visit notes
- full Airtable customer timeline UI inside Salon Growth OS
- My Hair OS customer-facing experience
- automatic social publishing
- automatic AI recommendations in the app
- booking integration without a reliable source/API
- product analytics before a real workflow exists
- generic multi-store/staff SaaS expansion

---

## Proposed implementation order

1. Issue #2 Active experiment tracking
2. Use it in actual salon operations and observe friction
3. Home redesign / Ikeda operating cockpit
4. Weekly review assembly model
5. Non-PII Case → Learning bridge discovery
6. Add source adapters only where they eliminate manual work

The order may change only when new field evidence shows a higher-value bottleneck.

## v0.1 success test

On a phone, Ikeda should be able to answer quickly:

1. Where am I against this month's target?
2. What is the current operating issue/opportunity?
3. What experiment am I running?
4. What has actually been observed?
5. What is interpretation versus fact?
6. What is still unknown?
7. What should be checked next?

If a feature does not improve these answers or reduce work, it is not a v0.1 priority.
