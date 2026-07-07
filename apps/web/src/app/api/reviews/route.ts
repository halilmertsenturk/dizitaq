import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { prisma } from '@/lib/prisma'
import { getReviewLimiter, getBodySize, BODY_SIZE_LIMIT, sanitize } from '@/lib/security'

async function getUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  return prisma.user.findUnique({ where: { email: session.user.email } })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const watchmodeId = parseInt(searchParams.get('watchmodeId') ?? '', 10)
  if (!watchmodeId) return NextResponse.json({ error: 'watchmodeId required' }, { status: 400 })

  const title = await prisma.cachedTitle.findUnique({ where: { watchmodeId } })
  if (!title) return NextResponse.json({ error: 'Title not found' }, { status: 404 })

  const reviews = await prisma.review.findMany({
    where: { titleId: title.id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  })

  const avgResult = await prisma.review.aggregate({
    where: { titleId: title.id },
    _avg: { rating: true },
    _count: true,
  })

  return NextResponse.json({
    reviews: reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      content: sanitize(r.content ?? ''),
      user: r.user.name ?? r.user.email,
      createdAt: r.createdAt,
    })),
    averageRating: avgResult._avg.rating ?? 0,
    totalReviews: avgResult._count,
  })
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limiter = getReviewLimiter()
  if (limiter) {
    const { success } = await limiter.limit(user.id)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  const size = getBodySize(request)
  if (size > BODY_SIZE_LIMIT) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }

  try {
    const { watchmodeId, rating, content } = await request.json()
    if (typeof watchmodeId !== 'number') {
      return NextResponse.json({ error: 'watchmodeId required' }, { status: 400 })
    }

    const ratingNum = parseInt(rating, 10)
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
      return NextResponse.json({ error: 'Rating must be between 1 and 10' }, { status: 400 })
    }

    if (content && content.length > 1000) {
      return NextResponse.json({ error: 'Review too long (max 1000 characters)' }, { status: 400 })
    }

    const title = await prisma.cachedTitle.findUnique({ where: { watchmodeId } })
    if (!title) return NextResponse.json({ error: 'Title not found' }, { status: 404 })

    await prisma.review.upsert({
      where: { userId_titleId: { userId: user.id, titleId: title.id } },
      update: { rating: ratingNum, content: content ?? null },
      create: { userId: user.id, titleId: title.id, rating: ratingNum, content: content ?? null },
    })

    return NextResponse.json({ message: 'Review saved' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
