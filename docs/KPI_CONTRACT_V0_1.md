# Ikeda Salon OS — KPI Contract v0.1

Status: 2026-08-18

## Goal

Define the minimum KPI set that the management OS may surface without becoming a vanity dashboard or creating duplicate input.

The source of truth for current primary operating facts is Google Sheets `池田航一｜美容師OS データベース`.

## Primary daily facts

Source: `KPI日報`.

Required fields for future read adapter:

- `date`
- `weekday`
- `work_state`
- `technical_sales`
- `visits`
- `next_visit_count`
- `average_ticket`
- `next_visit_rate`
- `new_customers`
- `existing_customers`
- `named_new_customers`
- `referrals`
- `ai_search_source`
- `available_minutes`
- `menu_notes`
- `observation_note`

Missing cells remain `null`. They must not be converted to zero.

## Monthly target context

Current August operating target in the Sheet dashboard: ¥1,150,000.

The wider long-term goal remains stable ¥1.3M technical sales. The app must distinguish:

- current month's configured target
- long-term stability target

Do not silently replace one with the other.

## Core home KPI pulse

For v0.1, show only metrics that support a decision:

1. current month technical sales
2. configured month target and progress
3. visits where data coverage is sufficient
4. average ticket where data coverage is sufficient
5. next-visit booking count/rate with explicit coverage warning
6. capacity/available-time only when the source is sufficiently populated

Secondary signals may exist in deeper views:

- new customer count
- named new customer count
- referral signal
- AI/search source count

## Coverage-aware calculations

Current source data contains partial historical rows. Therefore every aggregate must carry data quality context.

Examples:

- `visits` must not be summed across dates where visit count is missing and presented as the total monthly customer count.
- average ticket must not be derived from mixed coverage unless numerator and denominator cover the same dates.
- next-visit rate must not be shown as 0% for dates where the denominator is missing.
- capacity must not be inferred from empty `available_minutes` cells.

Recommended output model:

```ts
type MetricValue = {
  value: number | null
  coverage: 'complete' | 'partial' | 'missing'
  coveredDays: number
  expectedDays?: number
  sourceUpdatedAt?: string
}
```

Exact TypeScript is illustrative; Codex should fit the existing project types.

## Known August data-quality issue

The current Sheet dashboard records:

- reported 8/1–8/16 total: ¥638,060
- known daily-input total: ¥636,460
- difference: ¥1,600
- status: 要確認

Salon Growth OS must surface a reconciliation warning instead of choosing one figure silently.

## KPI interpretation rules

### Technical sales
Fact. May be compared with target, but a high day is not automatically a successful experiment.

### Visits
Fact only when entered. Missing is unknown, not zero.

### Average ticket
Derived fact when sales and visits cover the same population.

### Next-visit booking
Behavioral signal. It is important but must not be interpreted as the sole measure of customer satisfaction.

### Available capacity
Operational signal. It may inform opportunity, but must not trigger price-discount recommendations by default.

### AI/search source
Discovery signal. Small counts are observations, not proof of channel causality.

## v0.1 dashboard rule

Every prominent metric should answer at least one question:

- Are we on track?
- What needs observation?
- Is the data reliable enough to judge?
- What should be checked next?

If a metric does not support one of these questions, it should not occupy primary mobile space.

## Future adapter acceptance criteria

A Sheets KPI adapter should:

- read bounded data server-side
- normalize dates in Asia/Tokyo
- preserve nulls
- calculate coverage
- expose reconciliation warnings
- avoid customer PII
- avoid write-back in the first version
- preserve existing repository/service abstraction
- fail with explicit empty/error/stale states

## Non-goals

- replacing Sheets as the primary daily fact ledger in v0.1
- automatic forecasting from sparse data
- automatic causal recommendations
- creating another manual KPI form
- importing customer-level records