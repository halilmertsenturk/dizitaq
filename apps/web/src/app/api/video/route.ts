import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVideoLimiter, parseId } from '@/lib/security'

const SOURCE_PRIORITY: Record<string, number> = {
  'CineX': 0,
  'vidsrc.to': 1,
  'VidSrc Embed': 2,
  '2Embed': 3,
  'VidSrc': 4,
  'VSEmbed': 5,
  'MultiEmbed': 6,
  'StreamSrc': 7,
}

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
  const seasonParam = parseId(searchParams.get('season'))
  const episodeParam = parseId(searchParams.get('episode'))

  if (!watchmodeId) {
    return NextResponse.json({ error: 'Provide watchmodeId' }, { status: 400 })
  }

  let sources = await prisma.videoSource.findMany({
    where: { watchmodeId, isActive: true },
    select: {
      id: true,
      embedUrl: true,
      sourceName: true,
      quality: true,
      language: true,
      isActive: true,
    },
  })

  sources.sort((a, b) => (SOURCE_PRIORITY[a.sourceName] ?? 99) - (SOURCE_PRIORITY[b.sourceName] ?? 99))

  const mapped = sources.map(s => ({
    ...s,
    embedUrl: (seasonParam && episodeParam)
      ? s.embedUrl.replace('{season}', String(seasonParam)).replace('{episode}', String(episodeParam))
      : s.embedUrl,
  }))

  return NextResponse.json({ sources: mapped })
}
