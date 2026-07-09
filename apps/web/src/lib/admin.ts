import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'admin_token'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET is not set')
  return secret
}

function sign(payload: string): string {
  const hmac = crypto.createHmac('sha256', getSecret())
  hmac.update(payload)
  return hmac.digest('hex')
}

export function createAdminToken(): string {
  const timestamp = Date.now().toString()
  const signature = sign(timestamp)
  return `${timestamp}.${signature}`
}

export function validateAdminToken(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return false
    const [timestamp, signature] = parts
    const ts = parseInt(timestamp, 10)
    if (isNaN(ts)) return false
    if (Date.now() - ts > SESSION_DURATION) return false
    const expected = sign(timestamp)
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export function isAdmin(): boolean {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return false
    return validateAdminToken(token)
  } catch {
    return false
  }
}

function secureFlag(): string {
  return process.env.NODE_ENV === 'production' ? '; Secure' : ''
}

export function setAdminCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; HttpOnly${secureFlag()}; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION / 1000}`
}

export function clearAdminCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly${secureFlag()}; SameSite=Lax; Path=/; Max-Age=0`
}
