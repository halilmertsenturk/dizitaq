import { NextRequest, NextResponse } from 'next/server'
import { getTitleSources, WatchmodeAPIError } from '@/services/watchmode'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'Missing required parameter: id' },
      { status: 400 }
    )
  }

  try {
    const sources = await getTitleSources(parseInt(id))
    return NextResponse.json(sources)
  } catch (error) {
    if (error instanceof WatchmodeAPIError) {
      return NextResponse.json(
        { error: error.message, endpoint: error.endpoint },
        { status: error.status ?? 500 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
