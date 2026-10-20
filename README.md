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
integrations are disabled by default. The owner selected Neon for non-production
database use; production database access is not configured here.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs the same checks for pull requests and pushes to `main`.
`GET /api/health` is a liveness endpoint. `GET /api/ready` runs a minimal
`SELECT 1` against `DATABASE_URL`, returns `503` when it is unset or unavailable,
and never exposes connection details or database errors.

## Environment and deployment plan

- Local development uses `.env.local` with local-only credentials.
- Preview and Development use the owner-managed non-production Neon database;
  Production must not use those credentials.
- Production credentials and database must remain separate from Preview and
  Development. The Phase 1 foundation is deployed on Vercel; it is not a
  customer-ready storefront.
- A new deployment is required after changing environment variables. Validate
  database access on Preview with `/api/ready`; do not rely on the liveness
  endpoint for database status.

### Database provider

Neon is selected for PostgreSQL. Use its pooled connection string for
serverless application queries and a separate direct connection only for
migrations. Do not use the deprecated `@vercel/postgres` package. See the
[Neon Prisma guide](https://neon.com/docs/guides/prisma) and
[Vercel Postgres documentation](https://vercel.com/docs/postgres).

## Project conventions

- `src/app/`: App Router routes and layouts.
- `src/app/api/`: HTTP route handlers; validate all untrusted input server-side.
- `src/lib/`: shared domain and infrastructure modules as they are introduced.
- `test/`: Node test-runner tests for behavior that can be verified in isolation.
- `.env.example`: placeholder keys and non-secret sample values only.

Do not enable checkout or accept real orders until the v1.3 launch-blocking
shipping, product, production, payment, legal, identity, and operations decisions
are resolved and separately approved.
