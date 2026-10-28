# Book Catalogue — Plan & Status

A personal catalogue of Eftakher's book collection, in Bangla and English. Anyone with the link
can browse; only the owner can sign in to add or edit. It's hosted on Vercel and kept as close to
zero-ops as possible.

**Legend:** ✅ done · 🟡 built but not yet verified · ⬜ to do · ❌ decided against

_Last updated: 2026-10-28 (after pass 1 + mobile pass)._

---

## Status at a glance

| Area | Status |
|---|---|
| Pass 1: catalogue, owner sign-in, ISBN/barcode add, Bangla support | ✅ |
| Mobile responsiveness + installable web app | ✅ |
| Pass 2: photo identification, lending, import/export, stats | ⬜ |
| Pass 3: Vercel deploy (Neon + Blob + GitHub OAuth), then Kindle and other v2 items | ⬜ |

---

## Features

### Browse (public)
- ✅ Grid of covers, with a typographic placeholder when there's no cover
- ✅ Search by title, author or ISBN, in Bangla, English or romanized text (`himu` finds হিমু)
- ✅ Filter by reading status, format, language and tag
- ✅ Sort by recently added, title, author, rating or year (Bangla alphabetical order)
- ✅ Book detail page: cover, authors, publisher, year, edition, pages, language, ISBN,
  formats/copies, tags, rating, public review, description
- ✅ Shelf location and private notes are visible only to the owner

### Owner sign-in
- ✅ GitHub sign-in, limited to the account whose email is `OWNER_EMAIL`
- ✅ Local-only "Dev sign-in" (needs `AUTH_DEV_LOGIN=true`; never available in production builds)
- ✅ `/admin/*` is guarded by `proxy.ts`, and every page, server action and API route checks again
- ⬜ GitHub OAuth app for the production URL (pass 3)

### Adding a book
- ✅ Type the ISBN (ISBN-10/13, hyphens and Bangla digits accepted)
- 🟡 Scan the barcode live with the phone camera (needs HTTPS, so untested on a real phone)
- 🟡 Read the barcode from a photo (taken or picked from the gallery)
- 🟡 Flashlight toggle and a short vibration on a successful scan
- ✅ Enter manually
- ✅ Lookup order: own catalogue first (offers to open or edit a duplicate), then Open Library
  and Google Books in parallel, merged, with Open Library preferred
- ✅ One shared review form for every path; nothing is saved until the owner confirms
- ⬜ Photo of the cover, title page and imprint page, identified by Claude vision, with a
  candidate picker (pass 2; see "Adding a book by photo")

### Reading tracking
- ✅ Status (want to read / reading / read / abandoned), start and finish dates
- ✅ Rating from 0.5 to 5 in half steps, public review, private notes

### Organisation
- ✅ Tags with autocomplete, shelf/location, copies
- ✅ Several formats per book (hardcover, paperback, e-book, Kindle, audiobook)
- ✅ Delete a book (with confirmation)

### Lending tracker (pass 2)
- ✅ `loans` table already in the schema
- ⬜ Lend to a person with lent and due dates, mark returned, history per book
- ⬜ "On loan" badge, plus a list of what's out and what's overdue

### Import / export (pass 2)
- ⬜ Goodreads CSV import with a preview and duplicate check by ISBN
- ⬜ Full export to CSV and JSON

### Stats (pass 2)
- ⬜ Books owned, read this year, pages read, top authors, Bangla vs English split

---

## Bangla support

Open Library and Google Books have poor coverage of Bangla books (especially 978-984
Bangladeshi publishers), so the owner's own database is the main catalogue.

- ✅ Titles, authors and publishers are stored in the original script **plus** an optional
  romanized form (`title_latin`, `name_latin`)
- ✅ Trigram search (`pg_trgm`) on both forms, including fuzzy matching
- ✅ Sorting with ICU collation `bn-x-icu`
- ✅ Unicode NFC normalisation on save and search; Bangla digits (০–৯) converted in ISBN,
  year and page fields (`src/lib/bn.ts`)
- ✅ Noto Sans Bengali alongside Geist via `next/font`; Bangla text tagged `lang="bn"`
- ✅ A Bangla title switches the book's language to Bangla automatically
- ✅ Authors and publishers are reused instead of duplicated; autocomplete matches either script
- ⬜ Claude extracts the Bangla title and authors, romanizes them, and reads the ISBN from the
  imprint page (pass 2)
- ⬜ Stats split by language (pass 2)
- ⬜ Bangla interface via `next-intl` (v2 option; the interface stays English for now)
- ❌ No scraping of Rokomari or other shops (no public API, and it's against their terms)

## Adding a book by photo (pass 2 design)

**A. Barcode photo:** ✅ done. It's decoded in the browser by `@zxing/browser`. Only EAN-13
codes starting 978/979 with a valid checksum are accepted.

**B. Cover, title-page or imprint-page photo:** ⬜ to do.
1. The client shrinks up to 3 photos (cover, title page, imprint page) to about 1600px and
   posts them to `POST /api/identify` (owner-only).
2. The server asks Claude vision for structured JSON:
   `{ title, titleLatin, subtitle?, authors[{name, nameLatin}], publisher?, isbn?, edition?, language, confidence }`.
   The result is validated with Zod.
   - Model: `claude-haiku-5-5` first.
   - Retry with `claude-sonnet-5-5` when the book is Bangla or confidence is low.
3. If an ISBN was read, run the normal ISBN lookup. Otherwise search Open Library and Google
   Books by title and author, and show 3–5 candidates to pick from.
4. The chosen candidate fills the review form; the owner's photo can be kept as the cover.
5. If confidence is low or nothing fits, the extracted fields still pre-fill the form.
6. Needs `ANTHROPIC_API_KEY`. Without it the photo option is hidden.

## Mobile
- ✅ No horizontal scroll at 360px; compact sticky header with an account menu
- ✅ 44px touch targets and 16px field text on phones (no iOS zoom on focus)
- ✅ Filters in a bottom sheet with an active-filter count; 2-column grid on phones,
  3 columns from 480px
- ✅ Book page: small cover beside the title on phones
- ✅ Form: stacked author fields, Save pinned to the bottom, foldable Reading and
  Tags & description sections (they unfold automatically on errors)
- ✅ Add flow opens on the camera scanner on phones, with a tall viewfinder
- ✅ Installable web app: manifest, generated icons, safe-area insets for notched phones
- 🟡 Real-phone check of camera, flashlight and vibration (do this on the Vercel URL)

## Kindle (v2)
Amazon has no public Kindle API, so everything works from files you export yourself.
- ✅ Prepared: `kindle` format, nullable unique `asin` column, several formats per book
- ⬜ Upload `My Clippings.txt` → `highlights` table, matched to books by title and author;
  re-uploads skip highlights already imported
- ⬜ Kindle library import from Amazon's "Request Your Data" export
- ⬜ Reading progress from clippings (suggest "reading" or "finished")
- ⬜ Send to Kindle (stretch)

## Later (v2+)
- ⬜ Wishlist, series tracking, reading goals, shareable shelf links
- ⬜ Shelf photo: detect many spines in one picture
- ⬜ Dark mode
- ⬜ Offline support / service worker (manifest and home-screen install are already done)
- ⬜ Semantic search or "what should I read next" via the Claude API

---

## Architecture

```
Browser (public visitors / owner on phone)
        │
        ▼
Vercel ── Next.js 16 (App Router, TypeScript)
          ├─ Server Components  → public pages, rendered per request
          ├─ Server Actions     → owner mutations (requireOwner)
          ├─ Route Handlers     → /api/isbn/[isbn], /api/suggest, /api/auth/*, /icons/[size]
          └─ proxy.ts           → optimistic gate for /admin/*
        │                 │                      │
        ▼                 ▼                      ▼
  Postgres          Vercel Blob            Open Library / Google Books
  (Docker locally,  (cover copies,         (server-side lookup)
   Neon on Vercel)   optional)
```

### Data model (`src/db/schema.ts`)
- `books`:
  - identifiers: id, isbn13 (unique, nullable), isbn10, asin (unique, nullable)
  - title, title_latin, subtitle, publisher_id, published_year, edition, pages, language
  - description, cover_url, formats[], location, copies
  - source (openlibrary / google / photo / manual / import), timestamps
- `authors`: name, name_latin. `book_authors`: links books to authors, with a position for ordering
- `publishers`: name, name_latin
- `reading`: one row per book with status, dates, rating, review_public, notes_private
- `tags`, `book_tags`
- `loans`: borrower, lent/due/returned dates, note

### Project layout
```
src/
  app/          routing only: thin route files that load data and render a page component
  pages-impl/   page implementations, one folder per page (component + its server actions)
  components/   reusable, page-agnostic components (ui/ = shadcn primitives)
  db/           Drizzle schema + client
  lib/          auth, isbn, bn, book-lookup, books (data access), book-form, covers, validation/
drizzle/        SQL migrations
scripts/        seed
tests/e2e/      Playwright
docs/           this plan
```

---

## Technology decisions

| Area | Decision | Why / notes |
|---|---|---|
| Hosting | **Vercel** (Hobby) | Simple git-push deploys; a preview URL per branch |
| Framework | **Next.js 16** (App Router) + TypeScript | Planned as 15; 16 is what the installer gave. Middleware is called `proxy.ts` in 16 |
| Rendering | **Cache Components turned off**; pages render per request | Keeps data fetching simple; fast enough for one person's library. Can revisit with `"use cache"` later |
| Package manager | **pnpm** via Corepack (version pinned in `packageManager`) | Owner's choice; Vercel detects it automatically |
| UI | **Tailwind CSS v4 + shadcn/ui** (Base UI primitives, `base-nova` style), lucide icons | We own the component code |
| Page structure | Route files in `app/`, page code in `pages-impl/`, shared parts in `components/` | Owner's request. Not named `pages/`, because Next.js would treat that as the old Pages Router |
| Validation | **Zod** + react-hook-form | Chosen over Yup (owner was fine either way): better TypeScript inference, and one schema checks the form, server actions and Claude's JSON |
| Database | **Postgres** with **Drizzle ORM** + drizzle-kit migrations | Type-safe and light |
| Local DB | **Docker Compose**, Postgres 16 on port **5433** | Works offline with no account; Neon is only needed for deploy |
| Production DB | **Neon** (Vercel Marketplace) | Serverless Postgres with a branch per preview |
| DB driver | **node-postgres (`pg`) everywhere** | Works with both Docker and Neon's pooled URL, so no Neon-specific driver |
| Search | **`pg_trgm`** on original and romanized text, plus ICU `bn-x-icu` collation | Postgres full-text stemming doesn't handle Bengali; no extra search service |
| Auth | **Auth.js v5** with GitHub, **JWT sessions** (no DB adapter) | One owner, so no session tables. Access is an allowlist on `OWNER_EMAIL` |
| Dev auth | Credentials "Dev sign-in" when `AUTH_DEV_LOGIN=true` and not production | Lets you test locally without a GitHub OAuth app |
| Book metadata | **Open Library + Google Books**, queried in parallel and merged | Open Library preferred; Google fills gaps (descriptions, language) |
| Barcode | **`@zxing/browser`** (EAN-13 only) | Live camera and still photos; torch when the device supports it |
| Covers | Plain `<img>`; optional copy to **Vercel Blob** | Covers come from many hosts. Blob keeps them if the source disappears |
| Photo identification | **Claude API**: `claude-haiku-5-5`, falling back to `claude-sonnet-5-5` | Pass 2. The larger model reads Bengali script more reliably |
| Fonts | Geist (Latin) + Noto Sans Bengali via `next/font` | |
| Mobile | `max-sm:` touch sizes, bottom-sheet filters, sticky save bar, web app manifest | Done early (planned as v2) because the owner adds books from a phone |
| Unit tests | **Vitest** | ISBN, Bangla, lookup mapping, validation |
| E2E tests | **Playwright** (Chromium) on desktop, iPhone 13 and Pixel 7 profiles, plus a 360px overflow/tap-target check | Only Chromium is installed; the iPhone profile runs in Chromium |
| Git | Repo-local identity Eftakher Sazid `<eftakharsazid@gmail.com>`; branch `main`; GitHub over SSH | Separate from the global (work) identity |

---

## Environment variables

| Name | Needed for |
|---|---|
| `DATABASE_URL` | Always. Docker locally; set by the Neon integration on Vercel |
| `AUTH_SECRET` | Always |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub sign-in |
| `OWNER_EMAIL` | Who may sign in |
| `AUTH_DEV_LOGIN` | Local only |
| `BLOB_READ_WRITE_TOKEN` | Optional cover copies |
| `GOOGLE_BOOKS_API_KEY` | Optional, raises Google Books rate limits |
| `ANTHROPIC_API_KEY` | Pass 2 photo identification |

## Deploy checklist (pass 3)
- ⬜ Import the GitHub repo into Vercel
- ⬜ Add Neon (sets `DATABASE_URL`) and optionally Blob
- ⬜ Create a GitHub OAuth app with callback `https://<project>.vercel.app/api/auth/callback/github`
- ⬜ Set `AUTH_SECRET` (fresh), `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `OWNER_EMAIL`
- ⬜ Run migrations against Neon's unpooled URL: `DATABASE_URL="…" pnpm db:migrate`
  (optionally `pnpm db:seed`)
- ⬜ Redeploy, sign in, add a book, then test the camera scanner on a phone

## Verification
- ✅ `pnpm lint`, `pnpm typecheck`, `pnpm test` (16 unit tests), `pnpm build`
- ✅ `pnpm test:e2e`:
  - smoke test: sign in → add a Bangla book with a Bangla-digit year → find it by romanized
    title → delete it
  - 360px check: no sideways scroll, nothing too small to tap
- ✅ Checked by hand in the browser at 360, 390, 768px and desktop
- ⬜ Pass 2 checks:
  - photo-identify a 978-984 Bangla book from its cover and imprint page
  - lend a book with a past due date and see it marked overdue
  - Goodreads import/export round trip
