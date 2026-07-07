import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVideoLimiter, parseId } from '@/lib/security'

export async function GET(request: NextRequest) {
  const limiter = getVideoLimiter()
  if (limiter) {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const { success } = await limiter.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  const { searchParams } = new URL(request.url)
  const watchmodeId = parseId(searchParams.get('watchmodeId'))
  const episodeId = searchParams.get('episodeId')

  if (!watchmodeId && !episodeId) {
    return NextResponse.json({ error: 'Provide watchmodeId or episodeId' }, { status: 400 })
  }

  const where = episodeId
    ? { episodeId }
    : { watchmodeId }

  const sources = await prisma.videoSource.findMany({
    where: { ...where, isActive: true },
    select: {
      id: true,
      embedUrl: true,
      sourceName: true,
      quality: true,
      language: true,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ sources })
}
