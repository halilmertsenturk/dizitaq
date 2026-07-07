import { NextRequest, NextResponse } from 'next/server'
import { getAdminLimiter, getBodySize, BODY_SIZE_LIMIT } from '@/lib/security'
import { createAdminToken, setAdminCookie, clearAdminCookie } from '@/lib/admin'

export async function POST(request: NextRequest) {
  const size = getBodySize(request)
  if (size > BODY_SIZE_LIMIT) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }

  const limiter = getAdminLimiter()
  if (limiter) {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const { success } = await limiter.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
  }

  try {
    const contentType = request.headers.get('content-type') ?? ''
    let password = ''
    let _action = ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      password = body.password ?? ''
      _action = body._action ?? ''
    } else {
      const formData = await request.formData()
      password = (formData.get('password') as string) ?? ''
      _action = (formData.get('_action') as string) ?? ''
    }

    if (_action === 'logout') {
      const response = NextResponse.json({ message: 'Logged out' })
      response.headers.set('Set-Cookie', clearAdminCookie())
      return response
    }

    const secret = process.env.ADMIN_SECRET
    if (!secret || password !== secret) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = createAdminToken()
    const response = NextResponse.json({ message: 'Authenticated' })
    response.headers.set('Set-Cookie', setAdminCookie(token))
    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
