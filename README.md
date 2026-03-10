# Perrologo MVP

Monorepo for the first Perrologo MVP:

- `apps/api`: Fastify webhook/API service for WhatsApp.
- `apps/admin`: Next.js internal admin dashboard with Supabase email/password auth.
- `packages/db`: Drizzle schema, database client, repositories, and seed data.
- `packages/domain`: Shared business rules for safety, onboarding, retrieval, and response prompting.

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm db:push
pnpm db:seed
pnpm dev
```

## Required services

- Supabase project with Postgres enabled
- Kapso WhatsApp configuration and webhook
- Supabase Auth configured for email/password sign-in
- Vercel AI Gateway key for grounded responses

## Supabase

Perrologo uses **Supabase as the backend database** for the MVP. Set `DATABASE_URL`
to the Supabase Postgres connection string, run `pnpm db:push`, then `pnpm db:seed`
to create the schema, seed the Spanish knowledge base, and allowlist your admin
emails.

## AI runtime

The API uses **Vercel AI SDK** with **AI Gateway**. Set `AI_GATEWAY_API_KEY` and
`AI_MODEL` in your environment. The default model string is `google/gemini-3-flash`,
but because requests go through AI Gateway you can switch providers later with an
env change instead of rewriting the service layer.

## Apps

- API: `http://localhost:3000`
- Admin: `http://localhost:3001`

## Deploy on Vercel

Deploy this repo as **two separate Vercel projects**:

- `perrologo-admin` with root directory `apps/admin`
- `perrologo-api` with root directory `apps/api`

### Admin project

- Framework preset: Next.js
- Root directory: `apps/admin`
- Required env vars:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `ADMIN_EMAILS`

### API project

- Framework preset: Other
- Root directory: `apps/api`
- Required env vars:
  - `DATABASE_URL`
  - `AI_GATEWAY_API_KEY`
  - `AI_MODEL`
  - `KAPSO_API_KEY`
  - `KAPSO_PHONE_NUMBER_ID`
  - `KAPSO_API_BASE_URL`
  - `KAPSO_WEBHOOK_SECRET`

### Kapso webhook URL

Point Kapso to:

- `https://<your-api-domain>/webhooks/kapso`

The API app includes a Vercel rewrite so the public webhook path stays
`/webhooks/kapso` while the underlying function lives under `/api/webhooks/kapso`.

For the exact CLI flow, env var checklist, and post-deploy steps, see
[`docs/deployment/vercel.md`](/Users/arnaldocarrillo/Arnaldo-whatsapp-idea/docs/deployment/vercel.md).
