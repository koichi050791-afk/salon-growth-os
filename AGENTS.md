<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Salon Growth OS — Codex operating rules

## Product role

This repository is the **business / growth side** of the salon operating system. It is for KPI visibility, operating reviews, experiments, and management decisions.

Do not turn this repository into a customer chart, CRM, or My Hair OS. Customer timeline / Decision Receipt / Future Plan functionality belongs in a separate customer-facing system.

## Human / AI responsibility split

- ChatGPT: requirements, prioritization, product reasoning, operational interpretation, and acceptance criteria.
- Codex: implementation, refactoring, tests, migrations, CI fixes, and technical documentation.
- GitHub: source of truth for code changes, issues, pull requests, and implementation history.
- Human user: final product and operational decision.

Do not silently change product policy because a technical implementation is easier.

## Data and privacy boundary

- Never commit real customer names, phone numbers, email addresses, face photos, appointment histories, consultation notes, or other personally identifiable salon customer data.
- Never paste production secrets, API keys, tokens, Airtable PATs, Supabase service-role keys, or Google credentials into source, issues, fixtures, logs, or docs.
- Use synthetic sample data in tests and screenshots.
- Treat public GitHub content as public by default.

## Implementation principles

1. Prefer reducing duplicate input over adding another input screen.
2. Facts and hypotheses must be distinguishable in the product model and UI.
3. Do not infer a cause from one day or one record unless the feature explicitly labels it as a hypothesis.
4. Preserve the existing repository / service abstraction; inspect `lib/repositories`, database types, and migrations before changing data access.
5. Avoid broad rewrites when a small, reversible change satisfies the requirement.
6. Add loading, empty, error, and permission states for new data-driven UI.
7. Do not introduce a new SaaS dependency unless the issue explicitly requires it.
8. Keep mobile usability first for operational screens.

## Codex workflow

For non-trivial work:

1. Read the relevant issue and acceptance criteria.
2. Inspect existing implementation before proposing new schema or dependencies.
3. State the smallest implementation plan in the PR description.
4. Implement on a branch, not directly on `main`.
5. Run relevant lint / typecheck / build / tests available in the repository.
6. Open a draft PR for review.
7. Do not merge automatically unless explicitly requested.

If requirements conflict with existing code or data, surface the conflict instead of guessing.

## Definition of done

A feature is not done merely because the UI renders. It must:

- satisfy the issue acceptance criteria,
- preserve privacy boundaries,
- handle empty/error states,
- avoid unnecessary duplicate data entry,
- pass available checks,
- and include a short note explaining what changed and what remains unverified.
