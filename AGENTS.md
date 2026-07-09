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

## Streaming Setup

### Embed Sources (1 service × 6 titles = 6 sources, 2026-07-09)
| Source | ID Type | URL Pattern | Notes |
|--------|---------|-------------|-------|
| **VidLink** | TMDB | `https://vidlink.pro/{movie\|tv}/{tmdbId}/{season}/{episode}` | Next.js + JWPlayer, frame-blocking YOK, reklam YOK, çalışıyor ✅ |

### Source Priority (in `/api/video/route.ts`)
Sadece `VidLink` kaldı, diğer tüm source'lar silindi.

### Embed Player Details
- CSP: fully relaxed (`default-src *`, `frame-src *`, `script-src *`)
- iframe sandbox: kaldırıldı (VidLink JWPlayer sandbox algılayıp çalışmıyordu; CSP zaten fully relaxed)
- referrerPolicy removed (was `no-referrer` — caused stream blocking)

### Continue Watching Navigation (FIXED)
- **Home page** (`page.tsx`): series → `/title/[id]`, movie → `/watch/[id]` (uses `h.title.type`)
- **Profile page** (`profile/page.tsx`): same logic for history + favorites cards

## Known Issues / Context

### Turkish Subtitles (VidLink üzerinden çözüldü ✅)
- VidLink `sub_file` parametresi sayesinde harici VTT altyazı desteği
- `/api/subtitle?tmdbId={id}&season={s}&episode={e}&lang=tr` endpoint'i:
  - OpenSubtitles API üzerinden Türkçe altyazı arar
  - SRT → VTT dönüşümü yapar
  - CORS header'ları ile servis eder
- `OPENSUBTITLES_API_KEY` lokal `.env` + Vercel Production'a eklendi (2026-07-09)
- `/api/video/route.ts` otomatik olarak VidLink embed URL'ine `sub_file` parametresini ekler
- **IMPORTANT**: OpenSubtitles API `language` parametresi kesin filtre DEĞİL — sonuçlar client-side'da `language === 'tr'` ile filtrelenir (`route.ts:48`)
- **Known limitation**: bazı dizilerde (örn. Obsession 2023) OpenSubtitles'da hiç Türkçe altyazı olmayabilir → player'da "Türkçe altyazı bulunamadı" gösterilir


### OpenSubtitles Language Filter (FIXED 2026-07-09)
- OpenSubtitles API `language` param is **not a strict filter** — was returning English when Turkish didn't exist
- Fixed in `api/subtitle/route.ts:48`: added `data.data.find(sub => sub.attributes.language === lang)`
- Without this fix, player showed "Türkçe" but played English text

### Breaking Bad Episode Order (KNOWN ISSUE)
- CineX correctly parses `/tv/1396/2/1` → SEASON=2, EPISODE=1
- CineX proxy (`/api/proxy?server=Nova&tmdb=1396&type=series&season=2&episode=1`) returns **wrong episode** (S01E02 "Cat's in the Bag" instead of S02E01 "Seven Thirty-Seven")
- **Root cause**: CineX's internal Nova server has incorrect episode mapping for Breaking Bad. Not our code.
- Watchmode and TMDB episode numbering are identical — no mismatch there
- Workaround: use 2Embed or VidSrc for Breaking Bad (same ID scheme, possibly different behavior)
- Other series untested (From, House of the Dragon may also have issues)

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
