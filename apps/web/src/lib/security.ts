import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'

export const emailSchema = z.string().email('Invalid email address').max(255, 'Email too long')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long').regex(/[A-Z]/, 'Password must contain an uppercase letter').regex(/[a-z]/, 'Password must contain a lowercase letter').regex(/[0-9]/, 'Password must contain a digit')
export const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long').transform(s => s.trim())

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
})

export const BODY_SIZE_LIMIT = 10 * 1024

export function getBodySize(request: Request): number {
  const contentLength = request.headers.get('content-length')
  return contentLength ? parseInt(contentLength, 10) : 0
}

let _registerLimiter: Ratelimit | null = null
let _watchlistLimiter: Ratelimit | null = null
let _loginLimiter: Ratelimit | null = null

function getLimiter(prefix: string, max: number, windowMs: number): Ratelimit | null {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowMs} ms` as const),
    prefix: `ratelimit:${prefix}`,
    analytics: true,
  })
}

export function getRegisterLimiter(): Ratelimit | null {
  if (!_registerLimiter) _registerLimiter = getLimiter('register', 5, 60000)
  return _registerLimiter
}

export function getLoginLimiter(): Ratelimit | null {
  if (!_loginLimiter) _loginLimiter = getLimiter('login', 10, 60000)
  return _loginLimiter
}

export function getWatchlistLimiter(): Ratelimit | null {
  if (!_watchlistLimiter) _watchlistLimiter = getLimiter('watchlist', 30, 60000)
  return _watchlistLimiter
}

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  process.env.NEXTAUTH_URL,
].filter(Boolean) as string[]

export function isValidOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const source = origin ?? (referer ? new URL(referer).origin : null)
  if (!source) return false
  if (process.env.NODE_ENV === 'development' && source.startsWith('http://localhost:')) return true
  return ALLOWED_ORIGINS.includes(source)
}

export function sanitize(input: string): string {
  return input.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }
    return map[char] ?? char
  })
}

export function parseId(value: string | null): number | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!/^-?\d+$/.test(trimmed)) return null
  const num = parseInt(trimmed, 10)
  return Number.isNaN(num) ? null : num
}

// ─── New rate limiters for streaming features ───

let _adminLimiter: Ratelimit | null = null
let _commentLimiter: Ratelimit | null = null
let _reviewLimiter: Ratelimit | null = null
let _reportLimiter: Ratelimit | null = null
let _videoLimiter: Ratelimit | null = null
let _historyLimiter: Ratelimit | null = null
let _favoriteLimiter: Ratelimit | null = null

export function getAdminLimiter(): Ratelimit | null {
  if (!_adminLimiter) _adminLimiter = getLimiter('admin:login', 5, 60000)
  return _adminLimiter
}

export function getCommentLimiter(): Ratelimit | null {
  if (!_commentLimiter) _commentLimiter = getLimiter('comment', 10, 60000)
  return _commentLimiter
}

export function getReviewLimiter(): Ratelimit | null {
  if (!_reviewLimiter) _reviewLimiter = getLimiter('review', 10, 60000)
  return _reviewLimiter
}

export function getReportLimiter(): Ratelimit | null {
  if (!_reportLimiter) _reportLimiter = getLimiter('report', 5, 60000)
  return _reportLimiter
}

export function getVideoLimiter(): Ratelimit | null {
  if (!_videoLimiter) _videoLimiter = getLimiter('video', 30, 60000)
  return _videoLimiter
}

export function getHistoryLimiter(): Ratelimit | null {
  if (!_historyLimiter) _historyLimiter = getLimiter('history', 30, 60000)
  return _historyLimiter
}

export function getFavoriteLimiter(): Ratelimit | null {
  if (!_favoriteLimiter) _favoriteLimiter = getLimiter('favorite', 30, 60000)
  return _favoriteLimiter
}

// ─── Embed URL validation ───

export function getWhitelistedDomains(): string[] {
  const raw = process.env.EMBED_DOMAINS ?? ''
  if (!raw) return []
  return raw.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
}

export function validateEmbedUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Embed URL must use HTTPS' }
    }
    const domains = getWhitelistedDomains()
    if (domains.length > 0) {
      const hostname = parsed.hostname.toLowerCase()
      const allowed = domains.some(d => hostname === d || hostname.endsWith('.' + d))
      if (!allowed) {
        return { valid: false, error: 'Embed domain is not in the whitelist' }
      }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}
