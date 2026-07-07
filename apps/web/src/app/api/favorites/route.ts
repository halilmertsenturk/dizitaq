import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { prisma } from '@/lib/prisma'
import { getFavoriteLimiter, getBodySize, BODY_SIZE_LIMIT, parseId } from '@/lib/security'

async function getUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  return prisma.user.findUnique({ where: { email: session.user.email } })
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      title: { select: { id: true, watchmodeId: true, title: true, poster: true, type: true, year: true, rating: true } },
    },
  })

  return NextResponse.json(favorites)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limiter = getFavoriteLimiter()
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
    const { watchmodeId } = await request.json()
    if (typeof watchmodeId !== 'number') {
      return NextResponse.json({ error: 'watchmodeId is required' }, { status: 400 })
    }

    const title = await prisma.cachedTitle.findUnique({ where: { watchmodeId } })
    if (!title) return NextResponse.json({ error: 'Title not found' }, { status: 404 })

    const existing = await prisma.favorite.findUnique({
      where: { userId_titleId: { userId: user.id, titleId: title.id } },
    })

    if (existing) return NextResponse.json({ message: 'Already in favorites' })

    await prisma.favorite.create({
      data: { userId: user.id, titleId: title.id },
    })

    return NextResponse.json({ message: 'Added to favorites' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const searchParams = new URL(request.url).searchParams
  const watchmodeId = parseId(searchParams.get('watchmodeId'))
  if (!watchmodeId) return NextResponse.json({ error: 'Invalid watchmodeId' }, { status: 400 })

  const title = await prisma.cachedTitle.findUnique({ where: { watchmodeId } })
  if (!title) return NextResponse.json({ message: 'Not in favorites' })

  try {
    await prisma.favorite.delete({
      where: { userId_titleId: { userId: user.id, titleId: title.id } },
    })
    return NextResponse.json({ message: 'Removed from favorites' })
  } catch {
    return NextResponse.json({ message: 'Not in favorites' })
  }
}
