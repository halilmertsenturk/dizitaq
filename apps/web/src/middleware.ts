import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot|webp|avif)$/

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  process.env.NEXTAUTH_URL,
].filter(Boolean) as string[]

function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const source = origin ?? (referer ? new URL(referer).origin : null)
  if (!source) return false
  if (process.env.NODE_ENV === 'development' && source.startsWith('http://localhost:')) return true
  return ALLOWED_ORIGINS.includes(source)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (STATIC_EXTENSIONS.test(pathname)) {
    return NextResponse.next()
  }

  const requestId = crypto.randomUUID()
  const start = Date.now()

  const response = NextResponse.next()

  response.headers.set('X-Request-Id', requestId)

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  const embedDomains = process.env.EMBED_DOMAINS ?? ''
  const frameSrc = embedDomains
    ? `frame-src 'self' ${embedDomains.split(',').join(' ')}`
    : "frame-src 'self'"

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://cdn.watchmode.com https://img.watchmode.com https://image.tmdb.org",
      "font-src 'self'",
      "connect-src 'self' https://api.watchmode.com https://vitals.vercel-insights.com",
      frameSrc,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (STATE_CHANGING_METHODS.includes(request.method)) {
    if (pathname.startsWith('/api/') && !isValidOrigin(request)) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      )
    }
  }

  if (process.env.NODE_ENV !== 'production' || process.env.LOG_REQUESTS === 'true') {
    const duration = Date.now() - start
    console.log(`[${requestId}] ${request.method} ${pathname} ${response.status} ${duration}ms`)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
