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
`SELECT 1` through Prisma and `DATABASE_URL`, returns `503` when it is unset or
unavailable, and never exposes connection details or database errors.

## Phase 2 identity boundaries

- Customer authentication uses LINE OIDC through Auth.js and database-backed
  sessions. The provider requests only `openid profile`; it does not request
  LINE email permission. Logout invalidates the local session and attempts to
  revoke the LINE access token.
- Administrator authentication uses a separate Better Auth instance, tables,
  and cookie namespace. TOTP and recovery codes are required for administrator
  access; customer credentials cannot authenticate as administrators.
- Public administrator sign-up is disabled. Create the first administrator
  once with `npm run admin:create`, using a temporary `ADMIN_BOOTSTRAP_EMAIL`
  and `ADMIN_BOOTSTRAP_PASSWORD` in the process environment and a non-production
  `DATABASE_URL`. Remove those temporary values after creation, then sign in at
  `/admin/login` and enroll TOTP at `/admin/setup` before accessing `/admin`.
- There is no email-based administrator password reset. For a forgotten password,
  run `npm run admin:reset-password` locally with temporary
  `ADMIN_RESET_EMAIL` and `ADMIN_RESET_PASSWORD` process variables and a
  `DATABASE_URL` for the Preview database. The command displays the database
  host and requires an exact confirmation before repairing the credential link
  and changing the password hash; it revokes existing sessions and preserves
  TOTP and recovery codes. Never use
  the Production database for this command or put credentials in Git or chat.
- `LINE_LOGIN_ENABLED` remains `false` by default. Enable it only in the
  isolated non-production environment after setting LINE channel credentials
  and registering `https://<preview-host>/api/auth/callback/line` in the LINE
  Login channel. Do not use the LINE Pay store ID as a Login channel ID.
- Configure distinct `CUSTOMER_AUTH_SECRET` and `ADMIN_AUTH_SECRET` values.
  Set `AUTH_URL` to the exact environment origin. Never reuse production secrets
  or the production database in Preview or Development.
- Prisma uses `DATABASE_URL` for application queries and
  `DATABASE_URL_UNPOOLED` for migrations. Both must target the same Preview
  Neon database; Preview builds validate the endpoint before migration. Vercel
  Preview builds apply checked-in
  migrations only when the direct non-production URL is configured; otherwise
  deployment continues with authentication and consent unavailable until the
  migration is applied. Local migrations use `npm run db:migrate:dev`.
- Consent policies are versioned by type and version with a stored document
  hash; acceptance records refer to the exact policy version. The store must
  not record customer consent until approved terms and privacy policies are
  published in the database.

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
