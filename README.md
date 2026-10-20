# 飯饌 오늘반찬

Independent Next.js App Router and TypeScript project. This repository is the
implementation workspace for roadmap v1.3; the earlier static GitHub prototype
is reference material only. Do not copy its client-side admin authentication,
browser-stored database credentials, or unverified order/shipping/payment rules.

## Local development

Requirements: Node.js 24 and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

`.env.example` contains placeholders only. Do not put real secrets in Git,
client-side code, logs, or prompts. LINE login, online payment, and shipping
integrations are disabled by default. No live database or external service is
required for this foundation phase.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs the same checks for pull requests and pushes to `main`.
`GET /api/health` is a liveness endpoint only; it does not claim that a database
or external dependency is available.

## Environment and deployment plan

- Local development uses `.env.local` with local-only credentials.
- Preview deployments use non-production Vercel environment variables and a
  dedicated non-production database after a provider is selected.
- Production credentials and database must remain separate from Preview and
  Development. Production deployment and live integrations are not enabled by
  this phase.
- The project has not been linked to a Vercel account or deployed. Configure
  Preview deployments only after the repository is connected to the owner’s
  GitHub/Vercel accounts; do not copy production variables into Preview.
- Managed PostgreSQL provider selection and provisioning remain pending a
  documented comparison (including pooling, backups, region, cost, and
  connection limits). No production database credentials have been accessed.

### Initial PostgreSQL provider comparison

- **Neon (provisional preference):** its current Prisma guide uses a pooled
  application URL and a separate direct URL for migrations. This fits a
  Vercel-hosted, Prisma-backed app without requiring us to adopt a second auth
  or API layer. Confirm region, plan limits, backups, preview-branch behavior,
  and pricing before creating an account/project.
- **Supabase:** supports Prisma and documents separate session/direct and
  transaction-pooler connection modes for serverless use. Its Data API and
  other bundled services are optional; this project does not need to expose a
  client-side database API for the planned server-owned access model.
- **Vercel Postgres:** the former first-party product is no longer available
  for new projects; use a Marketplace provider instead. Do not add the
  deprecated `@vercel/postgres` package.

References: [Neon Prisma guide](https://neon.com/docs/guides/prisma),
[Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma),
[Vercel Postgres documentation](https://vercel.com/docs/postgres). Neon is a
recommendation for evaluation, not a selected or provisioned production
provider. Provider selection and account setup require owner review of current
commercial terms and Taiwan-region latency/availability.

## Phase-one directory conventions

- `src/app/`: App Router routes and layouts.
- `src/app/api/`: HTTP route handlers; validate all untrusted input server-side.
- `src/lib/`: shared domain and infrastructure modules as they are introduced.
- `test/`: Node test-runner tests for behavior that can be verified in isolation.
- `.env.example`: placeholder keys and non-secret sample values only.

Do not enable checkout or accept real orders until the v1.3 launch-blocking
shipping, product, production, payment, legal, identity, and operations decisions
are resolved and separately approved.
