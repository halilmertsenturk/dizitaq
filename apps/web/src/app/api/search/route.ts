import { NextRequest, NextResponse } from 'next/server'
import { searchTitles, WatchmodeAPIError } from '@/services/watchmode'
import type { TitleFilters } from '@dizitaq/shared'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const filters: TitleFilters = {
    query: searchParams.get('query') ?? undefined,
    genre: searchParams.get('genre') ?? undefined,
    year: searchParams.get('year') ?? undefined,
    type: (searchParams.get('type') as TitleFilters['type']) ?? undefined,
    'min-rating': searchParams.get('min-rating')
      ? parseFloat(searchParams.get('min-rating')!)
      : undefined,
    page: searchParams.get('page')
      ? parseInt(searchParams.get('page')!)
      : 1,
    limit: searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 20,
  }

  try {
    const results = await searchTitles(filters)
    return NextResponse.json(results)
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
