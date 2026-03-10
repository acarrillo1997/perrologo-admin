# Vercel Deployment Checklist

This repo deploys to Vercel as **two separate projects**:

- `perrologo-admin` from `apps/admin`
- `perrologo-api` from `apps/api`

The commands below are based on the official Vercel CLI docs for
[`vercel link`](https://vercel.com/docs/cli/link),
[`vercel deploy`](https://vercel.com/docs/cli/deploy),
and [monorepos](https://vercel.com/docs/monorepos/).

## 1. Install and log in

```bash
pnpm i -g vercel
vercel login
```

## 2. Create or link the two Vercel projects

Run these from the repo root:

```bash
pnpm vercel:link:admin
pnpm vercel:link:api
```

Use these names in Vercel:

- `perrologo-admin`
- `perrologo-api`

Set the project root directories in Vercel:

- admin root directory: `apps/admin`
- api root directory: `apps/api`

If you prefer linking the monorepo in one step and your repo is already connected
to Vercel Git integration, you can also run:

```bash
vercel link --repo
```

## 3. Configure environment variables

### Admin project

Set these in the `perrologo-admin` project:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `ADMIN_EMAILS`

### API project

Set these in the `perrologo-api` project:

- `DATABASE_URL`
- `AI_GATEWAY_API_KEY`
- `AI_MODEL`
- `KAPSO_API_KEY`
- `KAPSO_PHONE_NUMBER_ID`
- `KAPSO_API_BASE_URL`
- `KAPSO_WEBHOOK_SECRET`

Recommended default:

- `AI_MODEL=google/gemini-3-flash`

## 4. Pull env vars into local files

```bash
pnpm vercel:pull:admin
pnpm vercel:pull:api
```

This writes:

- `apps/admin/.env.local`
- `apps/api/.env.local`

## 5. Run local verification before deploy

From the repo root:

```bash
pnpm typecheck
pnpm test
pnpm build
```

## 6. Deploy preview builds

```bash
pnpm vercel:deploy:admin
pnpm vercel:deploy:api
```

The CLI prints the preview deployment URL to stdout.

## 7. Deploy production builds

```bash
pnpm vercel:deploy:admin:prod
pnpm vercel:deploy:api:prod
```

## 8. Post-deploy setup

### Admin Supabase Auth

In Supabase Auth, enable email/password sign-in and create an admin user for:

```text
acarrillo.1997@gmail.com
```

That user must also exist in the `admins` table through the existing seed flow.

### Kapso webhook

Point Kapso at:

```text
https://<api-domain>/webhooks/kapso
```

### Database bootstrap

Run the schema push and seed against your production Supabase connection before
using the app:

```bash
pnpm db:push
pnpm db:seed
```

## 9. Recommended first production smoke tests

Check these after both projects are live:

1. Open the admin login page and verify Google sign-in works only for allowlisted emails.
2. Open the admin inbox and verify the page can read from Supabase.
3. Call `https://<api-domain>/health` and confirm it returns `{"ok":true}`.
4. Send a WhatsApp test message through Kapso sandbox and confirm the webhook is received.
5. Confirm a new owner, conversation, and dog profile are persisted in Supabase.

## Notes

- Do **not** commit `.vercel/` directories. They contain account-specific project IDs.
- This repo keeps Vercel config in code where it is safe to share, and leaves linked
  project state local to each machine.
- The admin app is deployed as Next.js.
- The API app is deployed as Vercel Node functions via `apps/api/api/*`.
