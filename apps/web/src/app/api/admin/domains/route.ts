import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getWhitelistedDomains } from '@/lib/security'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const domains = getWhitelistedDomains()
  const currentRaw = process.env.EMBED_DOMAINS ?? ''

  return NextResponse.json({ domains, raw: currentRaw })
}

export async function POST(request: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { domain } = await request.json()
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!clean || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(clean)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    const current = getWhitelistedDomains()
    if (current.includes(clean)) {
      return NextResponse.json({ error: 'Domain already in whitelist' }, { status: 409 })
    }

    current.push(clean)

    await prisma.adminLog.create({
      data: {
        action: 'domain.add',
        targetType: 'domain',
        targetId: clean,
        metadata: { domains: current },
      },
    })

    return NextResponse.json({ message: 'Domain added. Note: this change applies to EMBED_DOMAINS env variable. Update it in your hosting platform for persistence.' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')
  if (!domain) return NextResponse.json({ error: 'Missing domain' }, { status: 400 })

  const current = getWhitelistedDomains()
  const filtered = current.filter(d => d !== domain)

  await prisma.adminLog.create({
    data: {
      action: 'domain.remove',
      targetType: 'domain',
      targetId: domain,
      metadata: { domains: filtered },
    },
  })

  return NextResponse.json({ message: 'Domain removed. Update EMBED_DOMAINS env variable for persistence.' })
}
