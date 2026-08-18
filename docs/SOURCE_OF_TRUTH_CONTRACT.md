# Ikeda OS — Source of Truth Contract

Status: 2026-08-18

## Purpose

Prevent duplicate entry and ownership drift as Salon Growth OS evolves into the management / growth / learning layer of 池田航一｜美容師OS.

The governing rule is:

> Ikeda → ChatGPT → appropriate source/system.

A field should have one canonical owner. Other systems may surface or transform it, but should not silently become competing sources of truth.

## Canonical ownership

| Information | Canonical owner | Salon Growth OS role |
|---|---|---|
| KPI / primary operating facts | Google Drive / Sheets where available | consume / display / aggregate |
| Treatment Case primary facts | Google Drive / Sheets | anonymized learning signal only |
| Meaning / hypothesis / interpretation | Notion | surface management-relevant subset; do not silently overwrite Notion |
| Knowledge / promoted learning | Notion | reference/surface only |
| Customer timeline / visit / Decision / Future Plan | Airtable | out of scope; no customer PII copy |
| Issue / implementation decision / PR / code | GitHub | canonical implementation history |
| Runtime management UI | Salon Growth OS | display and operating interaction |
| Customer-facing My Hair OS | Lovable/prototype layer, later dedicated implementation | out of scope |
| Schedule context | Google Calendar only when real events exist | optional context, never a second booking ledger |

## Current experiment: EXP-0001

Notion currently contains the active field experiment for the ¥1.3M stability project:

**必要性のあるケア提案と年末プラン共有は、次回予約と顧客理解の質に影響する**

Current state: 観察中.

Observation intent:
- proposal performed or not
- whether there was genuine customer need
- customer response
- accepted / not accepted
- next-visit booking
- later visit result
- at-home manageability

Known caution:
- care attachment and next-visit booking must not be treated as a simple causal pair
- customer understanding and booking behavior are separate outcomes
- customer conditions and communication style may moderate the result

Next observation begins from 2026-08-19 for customers where the proposal is genuinely relevant.

## Mapping to Issue #2

Issue #2 extends `improvement_actions` with:

- `hypothesis`
- `observation_metrics`
- `interpretation`
- `unresolved_question`

For v0.1, these fields make the management UI capable of representing the experiment model. They do **not** establish Salon Growth OS as the permanent canonical owner of hypotheses.

Until a supported adapter is designed, experiment content may be seeded manually for development/testing with synthetic or non-PII values. Do not create a second daily workflow where Ikeda must maintain the same hypothesis independently in Notion and Salon Growth OS.

## Handoff rule

Before production use of the Experiment surface, choose exactly one of these modes:

### Mode A — Display adapter (preferred future state)
Notion remains canonical for hypothesis/interpretation; Salon Growth OS reads or receives a normalized management projection.

### Mode B — Salon Growth OS operating record
Salon Growth OS becomes canonical for the active management experiment and Notion stores only higher-order project meaning/Knowledge. If this mode is chosen, explicitly change the architecture docs and remove duplicate Notion experiment maintenance.

### Mode C — Temporary manual pilot
Allowed only for short field validation of Issue #2. The same experiment may be represented in both places temporarily, but Ikeda must not be expected to update both. ChatGPT handles synchronization when explicitly requested/available.

Current v0.1 status: **Mode C for implementation validation, with Mode A/B decision deferred until actual friction is observed.**

## Prohibited patterns

- Ikeda manually updating the same experiment after every customer in both Notion and Salon Growth OS
- copying customer names, phone numbers, email, photos or identifiable visit histories into Salon Growth OS
- creating another Case database inside Salon Growth OS
- automatic causal classification from one observation
- treating missing data as zero or negative evidence
- adding a new SaaS solely to bridge these systems

## Adapter design criteria

A future adapter is justified only if it:

1. removes manual work,
2. preserves canonical ownership,
3. makes missing/stale data visible,
4. has a reversible failure mode,
5. does not move customer PII into the management repository,
6. is simpler than the manual workflow it replaces.

## Decision checkpoint

After Issue #2 has been used in real operations, review:

- Where did the experiment get updated naturally?
- Did duplicate maintenance occur?
- Was Notion or Salon Growth OS the better operating surface?
- Did ChatGPT need a structured export/read model?
- Which fields changed frequently versus only during weekly review?

Use that evidence before implementing cross-system synchronization.