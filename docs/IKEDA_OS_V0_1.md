# Ikeda Salon OS v0.1 — Product Specification

Status: 2026-08-18

## 1. Purpose

Ikeda Salon OS is the management / growth implementation layer of the wider **池田航一｜美容師OS**.

It is not a generic salon management SaaS, not a second CRM, and not My Hair OS.

Its purpose is to support sustainable decision-making toward stable monthly technical sales of ¥1.3M while preserving a 9:00–18:00 workday and family time.

The system should help answer:

- What is happening now?
- What am I currently testing?
- What did I actually observe?
- What is interpretation rather than fact?
- What is still unknown?
- What should be checked next?
- What learning is strong enough to return to the field?

The product must prefer decision quality and learning quality over dashboard volume.

---

## 2. Fixed architecture of the wider Ikeda OS

The role split is fixed as follows.

- **ChatGPT** = single entry point, orchestration, requirements, prioritization, review
- **Google Drive / Sheets** = facts, primary records, KPI, treatment Case source data
- **Notion** = meaning, hypotheses, decisions, Knowledge, projects
- **Airtable** = customer timeline, visits, Decision, Future Plan
- **GitHub** = canonical source for issues, PRs, code, implementation history
- **Codex** = implementation, migrations, refactoring, tests, CI fixes
- **Lovable** = customer-facing My Hair OS UI prototypes
- **Canva** = publishing assets and expression
- **Google Calendar** = time axis only when an actual schedule exists
- **Ikeda Salon OS** = management / growth cockpit that exposes the minimum information needed for decisions and learning

Ikeda should not manually maintain the same information in multiple tools.

Default operating flow:

> Ikeda → ChatGPT → appropriate source / system

Source systems hold facts. Ikeda Salon OS should read, organize, surface and connect learning where appropriate rather than becoming another duplicate input ledger.

---

## 3. Core learning loop

The central loop of the wider system is:

> field work → record → learn → return value to customer → verify at next visit → Case → experiment → system implementation when needed → verify again in the field

System implementation is downstream of real operating need. A feature is not justified merely because it can be built.

The current ¥1.3M stability project is in a hop / observation phase. One day, one customer, or one post must not be treated as proof of causality.

---

## 4. Repository role and boundary

Repository:

`koichi050791-afk/salon-growth-os`

This repository is the **management / growth side** of the Ikeda OS.

Existing capabilities include:

- weekly sales
- visits
- average ticket
- next-visit booking rate
- monthly productivity
- improvement actions

Existing technical foundation:

- Next.js
- Supabase
- authentication
- repository / service abstraction
- mobile-first UI foundation

`AGENTS.md` already defines:

- ChatGPT / Codex / GitHub / human responsibility split
- privacy boundary
- implementation principles
- Codex workflow
- Definition of Done

`docs/CODEX_BACKLOG.md` already exists.

Foundation PR #1, `docs: Codex operating foundation for Salon Growth OS`, was reviewed and squash-merged to `main` on 2026-08-18.

---

## 5. Scope boundary

### In scope

- personal monthly / weekly / daily operating visibility
- technical sales, visits, average ticket, next-visit booking signals
- capacity signals when a reliable source exists
- active experiment visibility
- separation of fact / observation / hypothesis / interpretation
- anonymized Case learning signals
- weekly / monthly review inputs
- missing-data detection
- mobile-first operating screens

### Out of scope for v0.1

- full salon-wide staff management
- customer CRM
- customer names, phone numbers, email addresses, face photos, consultation notes, appointment histories
- My Hair OS customer-facing experience
- automatic AI recommendations inside the app
- automatic publishing
- AI-generated causal claims from one observation
- booking integration without a reliable supported source
- new paid SaaS dependencies

---

## 6. Product principles

1. Salon work before marketing.
2. Customer experience before acquisition volume.
3. Repeat visits before new-customer scale.
4. Do not create duplicate manual input.
5. Facts, observations, hypotheses and validated knowledge must be distinguishable.
6. A single observation does not establish causality.
7. Prefer small reversible experiments over large workflow changes.
8. The home screen must support a decision, not merely display metrics.
9. Mobile-first operational use.
10. Keep customer-level PII outside this repository and database.
11. Preserve existing repository / service abstractions unless there is a strong reason to change them.
12. Do not add a new tool merely because integration is technically possible.

---

## 7. v0.1 information architecture

The target operating surfaces are:

### A. Today

Purpose: show the minimum context needed now.

Potential display:

- current date and workday / non-workday state
- current month target and progress
- latest KPI pulse
- active experiment
- observation focus
- missing-data flags
- unresolved question / next check

Appointment or customer information must not be invented when no reliable source is connected.

### B. Growth

Purpose: track the ¥1.3M stability project as an operating learning system.

Display:

- monthly target
- actual
- remaining gap
- visits
- average ticket
- next-visit booking signal
- capacity signal when reliable
- current experiment
- current hypothesis
- observed result
- interpretation
- unresolved question

### C. Cases / Learning

Purpose: connect anonymized field learning without turning this repository into a CRM.

Only non-PII learning signals may be used, for example:

- Case ID
- consultation theme
- confirmed facts
- cause hypothesis
- options compared
- selected method
- intentionally non-selected method
- reason for non-selection
- outcome / follow-up signal
- next check
- Knowledge candidate

### D. Reviews

Purpose: make the operating learning loop explicit.

Weekly / monthly review inputs may assemble:

- KPI movement
- active experiment
- observations
- results
- interpretation
- unresolved questions
- candidate next experiment

Monthly review should evaluate stability rather than one-off peaks.

---

## 8. Current implementation priority — Issue #2

The highest-priority implementation is GitHub Issue #2:

`feat: active experiment tracking surface`

This is the first Learning Layer implementation.

The required learning sequence is:

> hypothesis → observation → result → interpretation → unresolved question → next check

The app must not collapse this into `action → success / failure`.

### Required fields

- experiment title
- hypothesis
- observation metric(s)
- start date
- status
- observed result
- interpretation
- unresolved question / next check

### Confirmed data-model decision

Do **not** create a new `experiments` table in v0.1.

Reuse the existing `improvement_actions` model.

Existing mapping:

- experiment title → `action_title`
- start date → `week_start`
- status → `status`
- observed result → `result_note`
- next decision → `next_decision`

Add only four nullable text columns:

- `hypothesis`
- `observation_metrics`
- `interpretation`
- `unresolved_question`

Migration target:

`supabase/migrations/011_extend_improvement_actions_for_experiments.sql`

Keep existing `issue_cause` and `action_detail` for backward compatibility.

---

## 9. Active Experiment UI

Keep the existing `HomeActionCard`.

Experiment tracking is not a replacement for the current weekly improvement action. It is the longer-lived Learning Layer used to observe that action.

Add a mobile-first `ActiveExperimentCard` near weekly KPI context.

Required sections:

- 仮説
- 観測する数字・反応
- 観測結果
- 解釈
- まだ分からないこと

Explicit null states:

- missing result → `未観測`
- missing interpretation → `未解釈`
- other missing optional values → neutral explicit empty state

Do not fabricate missing content.

The UI must include a concise caution equivalent to:

> 1回の観測だけでは因果関係は判断できない

When neither `planned` nor `in_progress` experiment exists, show an explicit no-active-experiment empty state.

---

## 10. Current implementation branch and workflow

Implementation branch:

`codex/experiment-tracking-v0.1`

Issue #2 already contains a Codex execution packet.

Codex is expected to:

1. follow `AGENTS.md`
2. add migration `011_extend_improvement_actions_for_experiments.sql`
3. update ImprovementAction DB types
4. preserve data access through `lib/repositories/improvement-actions.ts`
5. add an active-experiment repository helper only if it improves clarity
6. add `ActiveExperimentCard`
7. implement explicit empty / error states
8. run `npm run lint`
9. run `npm run build`
10. open a Draft PR to `main`
11. never merge automatically

After Draft PR creation, ChatGPT reviews:

- Issue #2 Acceptance Criteria
- unnecessary scope expansion
- regression risk
- privacy / PII
- migration quality
- types
- repository abstraction
- UI / UX
- lint / build / CI

Ikeda makes the final merge decision.

---

## 11. Home-screen redesign — after Experiment v0.1

A broader home-screen reframing is valuable, but it is **not the first coding slice anymore**.

After Issue #2 is implemented and observed in real use, the home screen may move from a generic store dashboard toward an Ikeda operating cockpit.

Likely future order:

1. Today header
2. monthly target progress
3. current operating focus
4. active experiment
5. KPI pulse
6. learning / unresolved question
7. shortcuts

Generic staff-management or multi-store surfaces should be de-emphasized where they do not support Ikeda's personal operating loop.

Repository name does not need to change in v0.1.

---

## 12. Later learning bridge

A future Case-to-learning bridge may expose anonymized signals such as:

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

`source_type` should distinguish at least:

- observation
- hypothesis
- validated_knowledge

This is a learning bridge, not a customer record.

Customer timelines, Decision and Future Plan remain in the customer-side architecture, principally Airtable / My Hair OS, with explicit privacy boundaries.

---

## 13. Decision rule for future features

A feature should be added only if it improves at least one of these:

- salon-work decision quality
- customer experience
- repeat-visit planning
- next-visit planning
- learning from Cases
- experiment quality
- operating visibility toward stable ¥1.3M technical sales
- reduction of manual or duplicate work

If it mainly creates more input, more dashboard surface, or another disconnected source of truth, it should not be built.

---

## 14. Definition of success for v0.1

v0.1 is successful when Ikeda can open the app on a phone and quickly answer:

1. Where am I against the current operating goal?
2. What experiment am I running?
3. What exactly am I observing?
4. What is observed fact versus interpretation?
5. What is still unknown?
6. What should I check next?

The app does not need to be comprehensive. It needs to become useful enough to enter the real field-learning loop.