# Ikeda Salon Learning OS

Management / learning implementation layer for 池田航一｜美容師OS.

This repository is not a customer chart, CRM, or generic salon SaaS. It should surface the minimum operating context needed for better salon-work decisions while preserving canonical source ownership.

## Source Boundaries

- Airtable owns customer timeline / visit / Decision / Future Plan continuity.
- Google Drive / Sheets own KPI and operating source facts where currently used.
- Notion owns hypotheses, Knowledge candidates, conditional Knowledge, projects, and strategic decisions.
- GitHub owns implementation decisions and code history.
- Ikeda Salon Learning OS may display, derive, and validate learning projections without becoming a duplicate manual ledger.

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Privacy

Do not commit real customer names, phone numbers, emails, face photos, identifying appointment histories, consultation notes, production secrets, or service-role credentials.
