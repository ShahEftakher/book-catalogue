# Book Catalogue

My personal library — Bangla and English books. Anyone with the link can browse; only the owner can sign in to add or edit.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind + shadcn/ui · Postgres (Docker locally, Neon on Vercel) · Drizzle ORM · Auth.js (GitHub) · Zod + react-hook-form · zxing barcode scanning · pnpm.

## Getting started

```bash
corepack enable              # once, makes `pnpm` available (version pinned in package.json)
pnpm install
cp .env.example .env.local   # then set AUTH_SECRET (pnpm dlx auth secret)
pnpm db:up                   # local Postgres 16 on port 5433
pnpm db:migrate
pnpm db:seed                 # optional: 4 sample books
pnpm dev
```

Open http://localhost:3000. With `AUTH_DEV_LOGIN=true` the sign-in page shows a **Dev sign-in** button that signs you in as `OWNER_EMAIL` without GitHub (never available in production builds).

### GitHub sign-in
Create an OAuth app at GitHub → Settings → Developer settings → OAuth Apps with callback
`http://localhost:3000/api/auth/callback/github`, then set `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`. Only the GitHub account whose email equals `OWNER_EMAIL` can sign in.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm lint` / `typecheck` / `format` | ESLint, `tsc`, Prettier |
| `pnpm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `pnpm test:e2e` | Playwright smoke test (needs the dev DB; `pnpm exec playwright install chromium` once) |
| `pnpm db:up` | Start local Postgres (Docker) |
| `pnpm db:generate` / `db:migrate` | Create / apply Drizzle migrations |
| `pnpm db:studio` / `db:seed` | Browse the DB / add sample books |

## Project layout

```
src/
  app/          routing only: thin route files that load data and render a page component
  pages-impl/   page implementations, one folder per page (component + its server actions)
  components/   reusable, page-agnostic components (ui/ = shadcn primitives)
  db/           Drizzle schema + client
  lib/          auth, ISBN/Bangla helpers, online lookup, data access, validation
drizzle/        SQL migrations
tests/e2e/      Playwright
```

## Bangla support
- Titles, authors and publishers are stored in their original script **plus** an optional romanized form, so `himu` and `হিমু` find the same book (Postgres `pg_trgm`).
- Bangla digits (০–৯) are accepted in ISBN, year and page fields; all text is NFC-normalised.
- Titles sort in Bangla alphabetical order (ICU collation `bn-x-icu`).
- Online lookups (Open Library → Google Books) rarely know Bangla books, so authors and publishers you've entered before autocomplete — your own catalogue becomes the source.

## Roadmap
The full plan, with what's done, what's left and every technology decision, is in
[docs/PLAN.md](docs/PLAN.md).

- **Pass 2:** add by cover/title-page photo (Claude vision), lending tracker, Goodreads import + CSV/JSON export, stats.
- **Pass 3:** deploy to Vercel (Neon + Blob integrations), then Kindle highlights/library import and other v2 items.
