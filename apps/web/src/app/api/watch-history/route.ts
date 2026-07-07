import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { prisma } from '@/lib/prisma'
import { getHistoryLimiter, getBodySize, BODY_SIZE_LIMIT } from '@/lib/security'

async function getUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  return prisma.user.findUnique({ where: { email: session.user.email } })
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const history = await prisma.watchHistory.findMany({
    where: { userId: user.id },
    orderBy: { watchedAt: 'desc' },
    take: 50,
    include: {
      title: { select: { id: true, watchmodeId: true, title: true, poster: true, type: true } },
      episode: { select: { id: true, epNum: true, title: true } },
    },
  })

  return NextResponse.json(history)
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limiter = getHistoryLimiter()
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
    const { watchmodeId, episodeId, timestamp, completed } = await request.json()

    const title = await prisma.cachedTitle.findUnique({ where: { watchmodeId } })
    if (!title) return NextResponse.json({ error: 'Title not found' }, { status: 404 })

    const existing = await prisma.watchHistory.findFirst({
      where: {
        userId: user.id,
        titleId: title.id,
        episodeId: episodeId ?? null,
      },
    })

    if (existing) {
      await prisma.watchHistory.update({
        where: { id: existing.id },
        data: {
          timestamp: timestamp ?? 0,
          completed: completed ?? false,
          watchedAt: new Date(),
        },
      })
    } else {
      await prisma.watchHistory.create({
        data: {
          userId: user.id,
          titleId: title.id,
          episodeId: episodeId ?? null,
          timestamp: timestamp ?? 0,
          completed: completed ?? false,
        },
      })
    }

    return NextResponse.json({ message: 'Updated' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
