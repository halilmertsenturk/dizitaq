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
