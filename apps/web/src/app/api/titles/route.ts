import { NextRequest, NextResponse } from 'next/server'
import { getTrending, getFullTitleDetails, WatchmodeAPIError } from '@/services/watchmode'
import { parseId } from '@/lib/security'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = parseId(searchParams.get('id'))
  const page = parseId(searchParams.get('page')) ?? 1
  const type = searchParams.get('type') as 'movie' | 'series' | null
  const limit = parseId(searchParams.get('limit')) ?? 20

  try {
    if (id) {
      const details = await getFullTitleDetails(id)
      return NextResponse.json(details)
    }

    const titles = await getTrending(page, limit, type ?? undefined)
    return NextResponse.json(titles)
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
