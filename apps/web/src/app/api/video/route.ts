import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVideoLimiter, parseId } from '@/lib/security'

const SOURCE_PRIORITY: Record<string, number> = {
  'VidLink': 0,
  'VidSrc': 1,
}

const SUBTITLE_LANG = 'tr'

function buildVidLinkUrl(tmdbId: number, type: string | null, season?: number, episode?: number): string {
  if (type === 'series' && season !== undefined && episode !== undefined) {
    return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`
  }
  return `https://vidlink.pro/movie/${tmdbId}`
}

function buildVidSrcUrl(tmdbId: number, type: string | null, season?: number, episode?: number): string {
  if (type === 'series' && season !== undefined && episode !== undefined) {
    return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}?ds_lang=tr`
  }
  return `https://vidsrc.cc/v2/embed/movie/${tmdbId}?ds_lang=tr`
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

  const title = await prisma.cachedTitle.findUnique({
    where: { watchmodeId },
    select: { tmdbId: true, type: true, imdbId: true, title: true },
  })

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

  // Fallback: no DB sources but we have tmdbId → construct dynamic sources
  if (sources.length === 0 && title?.tmdbId) {
    sources = [
      {
        id: `dynamic-vidlink-${watchmodeId}`,
        embedUrl: buildVidLinkUrl(title.tmdbId, title.type, seasonParam ?? undefined, episodeParam ?? undefined),
        sourceName: 'VidLink',
        quality: null,
        language: 'en',
        isActive: true,
      },
      {
        id: `dynamic-vidsrc-${watchmodeId}`,
        embedUrl: buildVidSrcUrl(title.tmdbId, title.type, seasonParam ?? undefined, episodeParam ?? undefined),
        sourceName: 'VidSrc',
        quality: null,
        language: 'tr',
        isActive: true,
      },
    ]
  }

  sources.sort((a, b) => (SOURCE_PRIORITY[a.sourceName] ?? 99) - (SOURCE_PRIORITY[b.sourceName] ?? 99))

  const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get('host') || 'localhost:3000'}`

  const mapped = sources.map(s => {
    let embedUrl = s.embedUrl
    // Replace DB placeholder patterns with actual season/episode values
    if (seasonParam) embedUrl = embedUrl.replace('{season}', String(seasonParam))
    if (episodeParam) embedUrl = embedUrl.replace('{episode}', String(episodeParam))
    // Append Turkish subtitle parameter for VidLink
    if (s.sourceName === 'VidLink' && title?.tmdbId) {
      const subUrl = `${baseUrl}/api/subtitle?tmdbId=${title.tmdbId}&imdbId=${title.imdbId ?? ''}&title=${encodeURIComponent(title.title)}${seasonParam ? `&season=${seasonParam}` : ''}${episodeParam ? `&episode=${episodeParam}` : ''}&lang=${SUBTITLE_LANG}`
      const separator = embedUrl.includes('?') ? '&' : '?'
      embedUrl += `${separator}sub_file=${encodeURIComponent(subUrl)}&sub_label=T%C3%BCrk%C3%A7e`
    }
    return { ...s, embedUrl }
  })

  return NextResponse.json({ sources: mapped })
}
