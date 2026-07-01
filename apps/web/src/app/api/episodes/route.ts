import { NextRequest, NextResponse } from 'next/server'
import { getTitleEpisodes, WatchmodeAPIError } from '@/services/watchmode'
import { parseId } from '@/lib/security'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = parseId(searchParams.get('id'))

  if (!id) {
    return NextResponse.json(
      { error: 'Missing or invalid required parameter: id' },
      { status: 400 }
    )
  }

  try {
    const episodes = await getTitleEpisodes(id)
    return NextResponse.json(episodes)
  } catch (error) {
    if (error instanceof WatchmodeAPIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 500 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
