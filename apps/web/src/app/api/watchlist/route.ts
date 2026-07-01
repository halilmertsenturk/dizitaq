import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { prisma } from '@/lib/prisma'
import { getTitleDetails } from '@/services/watchmode'
import { getWatchlistLimiter, getBodySize, BODY_SIZE_LIMIT, parseId } from '@/lib/security'

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  return user?.id ?? null
}

async function ensureTitle(watchmodeId: number): Promise<string> {
  const existing = await prisma.cachedTitle.findUnique({ where: { watchmodeId } })
  if (existing && existing.title !== `Title ${watchmodeId}`) return existing.id

  const details = await getTitleDetails(watchmodeId)

  const data = {
    watchmodeId,
    title: details.title,
    type: details.type,
    year: details.year,
    genres: details.genres,
    poster: details.poster,
    rating: details.rating,
    plot: details.plot,
    imdbId: details.imdb_id,
    tmdbId: details.tmdb_id,
  }

  const updated = await prisma.cachedTitle.upsert({
    where: { watchmodeId },
    update: data,
    create: data,
  })
  return updated.id
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const entries = await prisma.watchlist.findMany({
    where: { userId },
    include: { title: true },
    orderBy: { addedAt: 'desc' },
  })

  return NextResponse.json(entries)
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limiter = getWatchlistLimiter()
  if (limiter) {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const { success } = await limiter.limit(`post:${userId}`)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
  }

  const size = getBodySize(request)
  if (size > BODY_SIZE_LIMIT) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }

  const { watchmodeId } = await request.json()

  if (typeof watchmodeId !== 'number' || watchmodeId <= 0 || !Number.isInteger(watchmodeId)) {
    return NextResponse.json(
      { error: 'Missing or invalid required field: watchmodeId' },
      { status: 400 }
    )
  }

  const titleId = await ensureTitle(watchmodeId)

  const existing = await prisma.watchlist.findUnique({
    where: { userId_titleId: { userId, titleId } },
  })

  if (existing) {
    return NextResponse.json({ message: 'Already in watchlist' })
  }

  const entry = await prisma.watchlist.create({
    data: { userId, titleId },
  })

  return NextResponse.json(entry, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limiter = getWatchlistLimiter()
  if (limiter) {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const { success } = await limiter.limit(`delete:${userId}`)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
  }

  const { searchParams } = new URL(request.url)
  const watchmodeId = parseId(searchParams.get('watchmodeId'))

  if (!watchmodeId) {
    return NextResponse.json(
      { error: 'Missing or invalid required parameter: watchmodeId' },
      { status: 400 }
    )
  }

  const cachedTitle = await prisma.cachedTitle.findUnique({
    where: { watchmodeId },
  })

  if (!cachedTitle) {
    return NextResponse.json({ message: 'Not in watchlist' })
  }

  try {
    await prisma.watchlist.delete({
      where: { userId_titleId: { userId, titleId: cachedTitle.id } },
    })
    return NextResponse.json({ message: 'Removed from watchlist' })
  } catch {
    return NextResponse.json({ message: 'Not in watchlist' })
  }
}
