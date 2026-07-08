import { NextRequest, NextResponse } from 'next/server'

const OS_API = 'https://api.opensubtitles.com/api/v1'

function srtToVtt(srt: string): string {
  let vtt = 'WEBVTT\n\n'
  // Remove BOM
  srt = srt.replace(/^\uFEFF/, '')
  // Split by double newlines
  const blocks = srt.split(/\n\n+/)
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue
    // Skip the number line, find the timestamp line
    const timeLineIdx = lines.findIndex(l => l.includes('-->'))
    if (timeLineIdx === -1) continue
    // Convert timestamps: SRT uses comma, VTT uses dot
    const timeLine = lines[timeLineIdx].replace(/,/g, '.')
    const textLines = lines.slice(timeLineIdx + 1).join('\n')
    vtt += `${timeLine}\n${textLines}\n\n`
  }
  return vtt
}

async function searchSubtitles(tmdbId: number, season?: number, episode?: number, lang = 'tr') {
  const apiKey = process.env.OPENSUBTITLES_API_KEY
  if (!apiKey) return null

  const params = new URLSearchParams({
    tmdb_id: String(tmdbId),
    language: lang,
    order_by: 'download_count',
    order_direction: 'desc',
  })
  if (season !== undefined) params.set('season_number', String(season))
  if (episode !== undefined) params.set('episode_number', String(episode))

  const res = await fetch(`${OS_API}/subtitles?${params}`, {
    headers: { 'Api-Key': apiKey, 'User-Agent': 'Dizitaq v1' },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) return null

  const data = await res.json()
  if (!data?.data) return null

  // OpenSubtitles API doesn't strictly filter by language — filter client-side
  return data.data.find(
    (sub: any) => sub.attributes?.language === lang
  ) ?? null
}

async function downloadSubtitleSrt(fileId: number): Promise<string | null> {
  const apiKey = process.env.OPENSUBTITLES_API_KEY
  if (!apiKey) return null

  const res = await fetch(`${OS_API}/download`, {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'Dizitaq v1',
    },
    body: JSON.stringify({ file_id: fileId }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null

  const data = await res.json()
  if (!data?.link) return null

  // Fetch the actual subtitle file
  const fileRes = await fetch(data.link, {
    signal: AbortSignal.timeout(8000),
  })
  if (!fileRes.ok) return null

  return fileRes.text()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tmdbIdParam = searchParams.get('tmdbId')
  const seasonParam = searchParams.get('season')
  const episodeParam = searchParams.get('episode')
  const lang = searchParams.get('lang') || 'tr'

  if (!tmdbIdParam) {
    return NextResponse.json({ error: 'Provide tmdbId' }, { status: 400 })
  }

  const tmdbId = parseInt(tmdbIdParam, 10)
  const season = seasonParam ? parseInt(seasonParam, 10) : undefined
  const episode = episodeParam ? parseInt(episodeParam, 10) : undefined

  if (!process.env.OPENSUBTITLES_API_KEY) {
    const msg = `WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nAltyazı için OPENSUBTITLES_API_KEY gerekli.\n00:00:04.000 --> 00:00:08.000\nhttps://opensubtitles.com/api adresinden ücretsiz key alın.`
    return new NextResponse(msg, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  const sub = await searchSubtitles(tmdbId, season, episode, lang)
  if (!sub) {
    const msg = 'WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nTürkçe altyazı bulunamadı.'
    return new NextResponse(msg, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  const fileId = sub.attributes?.files?.[0]?.file_id
  if (!fileId) {
    const msg = 'WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nAltyazı dosya ID bulunamadı.'
    return new NextResponse(msg, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  const srt = await downloadSubtitleSrt(fileId)
  if (!srt) {
    const msg = 'WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nAltyazı indirilemedi.'
    return new NextResponse(msg, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  const vtt = srtToVtt(srt)

  return new NextResponse(vtt, {
    status: 200,
    headers: {
      'Content-Type': 'text/vtt; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
