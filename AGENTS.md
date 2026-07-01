# Dizitaq — Agent Memory

## Project
Monorepo (Turbo + npm workspaces): Next.js 14 (app router), Prisma (Neon PostgreSQL), shadcn/ui, Redis (Upstash), NextAuth v4, Vercel deploy.

- GitHub: `https://github.com/halilmertsenturk/dizitaq`
- Vercel: `https://dizitaq-web.vercel.app`
- DB: `ep-frosty-mud-atkzzp0t.c-9.us-east-1.aws.neon.tech`
- `apps/web` — main Next.js app
- `packages/shared` — shared types (`WatchmodeTitle`, `WatchmodeEpisode`, etc.)

## Dev Commands (from `apps/web`)
- `npx vitest run` — run unit/component tests (9 files, 105 tests)
- `npx tsc --noEmit` — type check
- `npm run dev` — start dev server (port 3000)
- E2E: `npx playwright test` (14 tests in `e2e/auth-watchlist.spec.ts`)

## Known Issues / Context

### Security (already fixed)
- Rate limiting: register 5/dk, login 10/dk, watchlist 30/dk (Upstash Redis, skips when unavailable)
- CSRF origin validation (middleware + stateful route handlers)
- Zod schemas in `src/lib/security.ts`: email, password (8+ chars, upper+lower+digit), name (trimmed, max 100), body size limit 10KB
- NEXTAUTH_SECRET is strong base64 (already rotated in .env and Vercel)
- Session maxAge: 7 days
- XSS sanitize utility in `src/lib/security.ts`

### Blocked / Requires Manual Action
- **Google OAuth**: `https://dizitaq-web.vercel.app/api/auth/callback/google` must be added to Google Cloud Console authorized redirect URIs for prod OAuth to work.
- **Missing env vars locally**: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_ID, GITHUB_SECRET only set in Vercel, not in local `.env`.

### Episode Data (already fixed)
- Watchmode API field names: `name` (not title), `overview` (not synopsis), `thumbnail_url` (not image), `release_date` (not air_date)
- Type in `packages/shared/src/index.ts` — `WatchmodeEpisode` uses correct fields now
- Seasons grouped in `getFullTitleDetails` by `ep.season_number`
- Grid layout (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`) for episodes inside accordion

### Poster Loading (already fixed)
- `enrichWithPosters` batches 5 parallel requests at a time (not 20) to avoid Watchmode rate limits
- `useTrending` uses AbortController to cancel in-flight requests on page change + prevents stale data

### Next.js Config
- `next.config.mjs` has remotePatterns for: `cdn.watchmode.com`, `img.watchmode.com`, `image.tmdb.org`
- If Watchmode adds new image hosts, they must be added here

### Watchmode API
- List/search endpoints do NOT return poster URLs; requires separate `/title/{id}/details` call per title
- Episodes endpoint (`/title/{id}/episodes`) returns: `id`, `name`, `episode_number`, `season_number`, `thumbnail_url`, `release_date`, `runtime_minutes`, `overview`, `sources`

### Placeholder Data
- Existing title "Title 3179773" in DB is placeholder data; will be replaced on next watchlist refresh (upsert handles it)

### Deployment
- GitHub Actions (`.github/workflows/deploy.yml`): tests → build → deploy to Vercel, triggers on push to main
- Vercel project auto-deploys
