# Decision OS v0.1 Implementation Note

Status: Issue #12 minimal implementation
Date: 2026-08-18

## Repository inspection result

- Existing Supabase schema stores operating data such as stores, staff, weekly inputs, monthly reports, diagnosis results, action logs, and improvement actions.
- There is no customer, visit, or customer Decision table in Supabase.
- Existing repository patterns live in `lib/repositories`, while product assembly belongs in `lib/services`.
- Existing UI is a mobile-first App Router surface protected by `AuthGuard` and `Navigation`.
- `lib/services/improvement-engine.ts` is legacy prescriptive logic and is not used for Decision OS.

## Reused structure

- Next.js App Router route under `app/`.
- Existing auth and navigation shell.
- Existing dark/gold mobile UI conventions.
- A service/type boundary under `lib/services` and `lib/types`.

## Required structure change

Issue #12 needs a Decision capture contract, not a new persistence layer. The added contract defines:

- Consultation / concern
- Customer Truth
- Chosen Decision
- Not Chosen
- Next Observation

Professional Hypothesis is defined separately because it must not be mixed into Customer Truth, but it is optional/non-core in v0.1.

Each field carries Airtable mapping, canonical source, unknown state, and later #13/#14 linkage notes.

## Canonical source boundary

Airtable remains the canonical customer/visit/Decision/Future Plan layer.

Salon Growth OS v0.1 only provides a local, non-persistent prototype/development aid for validating the Decision structure and UI contract. It does not write Supabase, Notion, GitHub, or Airtable.

The normal operating flow remains:

Ikeda -> ChatGPT -> canonical owner

The route must not become a standard daily workflow of entering data into Salon Growth OS and then re-entering it into Airtable.

## Migration decision

No Supabase migration is required for Issue #12. Adding a Supabase Decision table would create a duplicate customer Decision store before a real gap is proven.

## Privacy notes

- Do not enter real customer names, phone numbers, emails, face photos, or detailed identifiers into this repository, fixtures, logs, screenshots, or tests.
- The UI stores draft text only in local React state and does not persist it.
- Missing fields remain unknown/null; the helper does not fill them.
- The Home shortcut was removed so this prototype is not promoted as Ikeda's daily input route.

## Extension path

- Issue #13 can attach Outcome / Validation to the existing Next Observation concept after real field validation.

## Outcome / Validation v0.1 boundary — 2026-08-21

- Existing Airtable Decision remains canonical; no Outcome table is added.
- Only explicit REAL Decisions with an open Next Observation enter the validation queue.
- `Outcome（次回来店結果）` stores observed facts and actual customer words.
- `Validationメモ` stores professional interpretation, revisions, and unresolved points.
- Validation state remains `UNVALIDATED` until a later visit is actually checked.
- The `/decisions` page provides an authenticated manual fallback.
- `GET /api/decision-validations` returns the bounded open validation queue for a future dedicated GPT action.
- `POST /api/decision-validations` appends a validated result to the existing Decision after bearer authentication and an explicit REAL check.
- No customer PII, automatic Knowledge promotion, or mandatory tracking for every visit is introduced.
- Issue #14 can retrieve the Airtable Decision by concern/theme, chosen decision, not-chosen tradeoff, and open Next Observation.
- Past Decision context must be shown as context only, not current Customer Truth.

## Test method

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
