# Ikeda Salon OS v0.1 — Product Specification

## 1. Purpose

Ikeda Salon OS is a personal operating system for Koichi Ikeda's salon work, customer experience improvement, repeat business, management learning, and growth experiments.

It is not a generic salon management SaaS and it is not a second CRM.

The primary objective is to support sustainable decision-making toward stable monthly technical sales of ¥1.3M while preserving a 9:00–18:00 workday and family time.

The system should help answer:

- What is happening now?
- What should be observed today?
- What is likely to matter for repeat visits and customer experience?
- Which hypotheses are currently being tested?
- What has been learned from Cases?
- What should be checked next?

The product must prefer learning quality and decision quality over dashboard volume.

---

## 2. Product role in the wider Ikeda OS

The wider architecture is:

- ChatGPT = single conversational entry point / reasoning and orchestration
- Google Drive / Sheets = facts, primary records, KPI source data, Case source material
- Notion = meaning, hypotheses, Knowledge, project thinking
- Airtable = customer timeline, visit history, Decision, Future Plan when appropriate
- GitHub = source code, issues, PRs, implementation history
- Codex = implementation engine
- Ikeda Salon OS = operational cockpit that assembles the minimum information needed for decisions

The app should not become another place Ikeda has to manually maintain the same facts.

Default rule:

> Source systems hold facts. Ikeda Salon OS reads, organizes, summarizes, and exposes decisions.

---

## 3. Scope boundary

### In scope

- Personal monthly / weekly / daily operating visibility
- Technical sales, visits, average ticket, next-visit booking signals, capacity signals
- Active experiment visibility
- Observation / hypothesis / learning distinction
- Anonymized Case learning signals
- Weekly and monthly review inputs
- Missing-data detection
- Mobile-first operating screens

### Out of scope for v0.1

- Full salon-wide staff management
- Generic multi-store management features unless required by existing data architecture
- Customer CRM
- Customer names, phone numbers, email addresses, photos, consultation notes, appointment histories
- My Hair OS customer-facing experience
- Automatic publishing to social media
- AI-generated causal claims from one day or one observation
- New paid SaaS dependencies

---

## 4. Product principles

1. Salon work before marketing.
2. Customer experience before acquisition volume.
3. Repeat visits before new-customer scale.
4. Do not create duplicate manual input.
5. Facts, observations, hypotheses, and validated knowledge must be visibly different.
6. A single day does not prove causality.
7. Prefer reversible experiments over large workflow changes.
8. The home screen must support a decision, not merely display metrics.
9. Mobile-first: most operational review should be possible from a phone.
10. Keep customer-level PII outside this repository and database.

---

## 5. v0.1 information architecture

The first usable version should contain four primary surfaces.

### A. Today

Purpose: show the minimum operating context needed for the current day.

Display:

- Current date and workday / non-workday state
- Current month target and progress
- Latest available KPI snapshot
- Active experiment
- One observation focus for today
- Missing-data flags
- Link to latest review / learning

Do not show invented appointment or customer information if no reliable source is connected.

### B. Growth

Purpose: track the ¥1.3M stability project as an operating experiment rather than a vanity dashboard.

Display:

- Monthly target
- Monthly actual
- Remaining gap
- Visits
- Average ticket
- Next-visit booking signal
- Capacity / available-slot signal when reliable data exists
- Current experiment
- Current hypothesis
- Observed results
- Open questions

The UI must distinguish:

- Fact
- Observation
- Hypothesis
- Interpretation

### C. Cases / Learning

Purpose: connect anonymized salon-work observations to learning without turning this repository into a CRM.

Display only non-PII learning signals such as:

- Case ID
- Consultation theme
- Confirmed facts
- Cause hypothesis
- Options compared
- Chosen method
- Method intentionally not chosen
- Reason for non-selection
- Outcome / follow-up signal
- What to check next
- Candidate Knowledge tag

No customer name or identifying details.

### D. Reviews

Purpose: make the operating learning loop explicit.

Weekly review input should assemble:

- KPI movement
- Active experiment
- Observations
- Results
- Interpretation
- Unresolved questions
- Candidate next experiment

Monthly review should focus on stability rather than one-off peaks.

---

## 6. Home screen redesign

The current home screen is centered on weekly store input and generic store KPIs. v0.1 should shift the mental model from "store dashboard" to "Ikeda's operating cockpit".

Recommended order:

1. Today header
2. Monthly target progress
3. Current operating focus
4. Active experiment
5. KPI pulse
6. Learning / unresolved question
7. Shortcuts

Remove or de-emphasize generic labels such as:

- Salon Growth OS
- store-wide productivity status labels that are not decision-relevant to Ikeda
- staff-management shortcuts that are not part of the personal operating loop

Working product name inside the UI:

**Ikeda Salon OS**

Repository name does not need to change in v0.1.

---

## 7. Existing system: keep / change / defer

### Keep

- Next.js foundation
- Supabase integration
- authentication
- repository/service abstraction
- KPI calculation utilities where still valid
- loading / empty / error-state patterns
- mobile-first visual foundation

### Change

- Home information hierarchy
- terminology from generic salon/store management to Ikeda's personal operating system
- KPI interpretation around the ¥1.3M stability project
- weekly-input-first workflow
- generic management shortcuts
- improvement action model toward experiment / observation / learning

### Defer

- full external connector integration
- Airtable customer timeline UI
- My Hair OS
- automatic LLM generation inside the app
- booking integration until a reliable source is confirmed

---

## 8. v0.1 data strategy

Before adding schema, Codex must inspect the existing tables, types, repositories, and migrations.

Preferred approach:

- Reuse existing KPI and improvement-action records when semantically safe.
- Add fields or tables only when an existing model would make facts and hypotheses ambiguous.
- Keep external-source adapters behind server-side repository/service interfaces.
- Expose missing data explicitly rather than filling gaps.

No customer PII may be introduced.

---

## 9. First implementation slice

The first coding slice should be deliberately small.

### Slice 1 — Reframe Home as Ikeda operating cockpit

Required changes:

- Rename UI title to Ikeda Salon OS.
- Replace generic weekly-first hierarchy with monthly-target-first hierarchy.
- Surface the latest improvement action as an active experiment / focus.
- Add explicit empty states for missing monthly target, KPI data, and experiment data.
- Remove or hide staff-oriented shortcuts from the primary mobile home view.
- Preserve existing repository abstractions.
- Avoid schema changes unless unavoidable.

Acceptance criteria:

- A mobile user can understand the month's current state in under 10 seconds.
- The page shows what to observe or act on, not just what happened.
- No duplicate data input is added.
- Facts and interpretation are not visually conflated.
- Existing authentication and data boundaries remain intact.
- Lint / typecheck / build checks available in the repository pass.

---

## 10. Second implementation slice

### Slice 2 — Experiment and learning loop

Add a lightweight experiment surface containing:

- Hypothesis
- Metric / observation target
- Start date
- Status
- Observed result
- Interpretation
- Next check

It must be possible to leave interpretation blank.

The system must not auto-label an experiment successful from a single observation.

---

## 11. Third implementation slice

### Slice 3 — Non-PII Case learning handoff

Introduce a narrow interface for anonymized Case learning signals.

This is a learning bridge, not a customer record.

Minimum fields:

- case_id
- theme
- confirmed_facts
- hypothesis
- options_compared
- selected_method
- non_selected_method
- non_selection_reason
- outcome_signal
- next_check
- knowledge_candidate
- source_type

source_type must distinguish at least:

- observation
- hypothesis
- validated_knowledge

---

## 12. Decision rule for future features

A feature should be added only if it improves at least one of these:

- salon-work decision quality
- customer experience
- repeat-visit planning
- next-visit planning
- learning from Cases
- operating visibility toward stable ¥1.3M technical sales
- reduction of manual or duplicate work

If it only creates more data entry or more dashboard surface, it should not be built.

---

## 13. Definition of success for v0.1

v0.1 is successful when Ikeda can open the app on a phone and quickly answer:

1. Where am I against this month's goal?
2. What is the current operating issue or opportunity?
3. What experiment am I running?
4. What did I observe recently?
5. What should I check next?

The app is not required to be comprehensive. It is required to be useful enough to become part of the real operating loop.
