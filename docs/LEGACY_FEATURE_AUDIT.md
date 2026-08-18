# Legacy Feature Audit — Salon Growth OS → Ikeda Salon Learning OS

As of 2026-08-18.

## Purpose

This audit prevents an unnecessary rewrite.

The existing repository contains useful infrastructure mixed with legacy assumptions from a generic store-management / multi-staff salon OS. The current strategy is:

- preserve infrastructure that still has value
- remove legacy features from the primary operating flow before deleting data/schema
- avoid destructive migrations until real usage confirms they are unnecessary
- keep changes reversible

## KEEP — core foundation

### Application foundation
- Next.js
- React / TypeScript
- Tailwind
- Supabase integration
- authentication
- repository/service abstraction
- existing empty/error/loading patterns
- mobile-first dark/gold visual foundation

### KPI / operating data that remains relevant
- `monthly_configs.target_sales`
- `monthly_configs.target_unit_price`
- `monthly_configs.target_visits`
- `monthly_configs.target_repeat_rate`
- `monthly_configs.working_days`
- `weekly_store_inputs.sales`
- `weekly_store_inputs.visits`
- `weekly_store_inputs.next_visit_count`
- `weekly_store_inputs.next_visit_rate`
- `weekly_store_inputs.new_customers`
- `weekly_store_inputs.repeat_customers`
- `weekly_store_inputs.availability_score` when its definition/source is trustworthy
- `improvement_actions`

### Existing behavior to preserve now
- `HomeActionCard`
- current auth guard
- repository-level data access
- existing calculations that remain semantically valid

---

## REFRAME — keep data/implementation, change meaning or UI priority

### `stores`
Current code assumes a store-oriented model. For Ikeda v0.1, SARAJU三田店 is operating context rather than the product's primary entity.

Action:
- keep table and repository
- do not rewrite schema merely to become single-user
- de-emphasize generic store-selection language in the UI

### `monthly_configs`
Useful for personal monthly operating targets, but several fields came from store-level productivity thinking.

Keep as first-class:
- target_sales
- target_unit_price
- target_visits
- target_repeat_rate
- working_days

Review/de-emphasize:
- target_productivity
- active_staff_count
- total_weeks

Do not delete fields yet.

### `weekly_store_inputs`
Currently functions as the main manual operating input source.

Action:
- keep for compatibility
- stop treating weekly manual input as the long-term center of the product
- future source adapters should reduce this manual work rather than create a second KPI ledger

### `improvement_actions`
This becomes a central Learning Layer in v0.1.

Action:
- preserve existing weekly-action semantics
- extend minimally for hypothesis / observation / interpretation / unresolved question
- do not create a second experiment table in v0.1

---

## DE-EMPHASIZE FROM PRIMARY MOBILE FLOW

### Navigation: `/overview` / `全店`
The current bottom navigation contains a generic all-store surface.

For Ikeda personal OS, this should not be a primary mobile destination.

Do not delete the route yet. Remove/de-emphasize only when Issue #3 is implemented.

### Staff-oriented surfaces
Existing schema includes:
- `staff`
- `weekly_staff_inputs`
- staff-oriented productivity concepts

These are not part of the current personal operating loop.

Action:
- do not build new features on them
- do not delete schema yet
- remove from primary navigation/shortcuts if present
- mark as legacy until a future salon-wide product decision exists

### Generic productivity classification
The current home includes monthly productivity status such as success/warning/danger and relies on staff count / total weeks.

This does not map cleanly to Ikeda's primary objective of sustainable monthly technical sales with protected working hours.

Action:
- de-emphasize in Issue #3
- do not delete calculation utilities until usage is confirmed unnecessary

---

## LEGACY / REVIEW BEFORE ANY NEW USE

### `diagnosis_results`
Contains:
- `summary`
- `issues`
- `recommended_actions`

Risk:
The wider Ikeda OS explicitly avoids automatic causal recommendations from thin evidence. A generic diagnosis/recommendation model could conflict with the current fact → observation → hypothesis → interpretation discipline.

Action:
- no new feature should depend on `diagnosis_results` without explicit product review
- do not surface automatic recommendations on the new home
- keep schema untouched for now

### `action_logs`
Staff-oriented action tracking may overlap with `improvement_actions` and future experiment tracking.

Action:
- no new development until its live usage is verified
- do not migrate experiment data into it

### `monthly_reports`
Contains many store-wide and operational metrics including staff count, retail sales, service mix and promotion/product-request fields.

Some fields may remain useful as historical evidence, but the current model is broader than Ikeda personal OS needs.

Action:
- retain existing report route/data for compatibility
- do not make it the source of truth for new v0.1 product decisions without validating field freshness
- future review model should assemble only the minimum relevant facts

---

## DO NOT DELETE YET

No tables or routes should be deleted as part of Issue #2 or the first pass of Issue #3.

Reasons:
1. Existing production data/behavior may depend on them.
2. A reversible UI reframe is lower risk than schema deletion.
3. The product is still in observation/hop phase.
4. Deletion should follow evidence of non-use, not design preference.

Any destructive migration requires a dedicated issue and explicit approval.

---

## PRIMARY NAVIGATION TARGET AFTER ISSUE #3

The exact labels should be validated after Issue #2 usage, but the conceptual destinations should become approximately:

- Today / Home
- Growth
- Learning / Experiments
- Reviews
- Settings / secondary destinations outside the primary bottom-nav if possible

Do not add `Customers` to this repository's primary navigation. Customer timeline belongs to Airtable / My Hair OS boundaries.

---

## Data ownership rule

Before creating any new input field, answer:

1. Is this a fact, observation, hypothesis, interpretation, or validated knowledge?
2. What system is the canonical source?
3. Is Ikeda Salon Learning OS reading it, deriving it, or owning it?
4. Will this create duplicate manual input?
5. Does it contain customer PII?

If source ownership is unclear, do not add the field yet.

## Current implementation recommendation

1. Implement Issue #2 only.
2. Field-test experiment visibility.
3. Use this audit during Issue #3 to simplify the primary mobile UI without destructive schema work.
4. Build the review assembly model only after the home information hierarchy stabilizes.
5. Keep Case/customer integrations behind explicit non-PII boundaries.
