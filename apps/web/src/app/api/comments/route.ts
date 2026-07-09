import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { prisma } from '@/lib/prisma'
import { getCommentLimiter, getBodySize, BODY_SIZE_LIMIT, sanitize } from '@/lib/security'

async function getUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  return prisma.user.findUnique({ where: { email: session.user.email } })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const watchmodeId = parseInt(searchParams.get('watchmodeId') ?? '', 10)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

  if (!watchmodeId) return NextResponse.json({ error: 'watchmodeId required' }, { status: 400 })

  const title = await prisma.cachedTitle.findUnique({ where: { watchmodeId } })
  if (!title) {
    return NextResponse.json({ comments: [], total: 0, page, totalPages: 0 })
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { titleId: title.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.comment.count({ where: { titleId: title.id } }),
  ])

  return NextResponse.json({
    comments: comments.map(c => ({
      id: c.id,
      content: sanitize(c.content),
      user: c.user.name ?? c.user.email,
      createdAt: c.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limiter = getCommentLimiter()
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
    const { watchmodeId, content } = await request.json()
    if (typeof watchmodeId !== 'number') {
      return NextResponse.json({ error: 'watchmodeId required' }, { status: 400 })
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Comment too long (max 1000 characters)' }, { status: 400 })
    }

    const title = await prisma.cachedTitle.findUnique({ where: { watchmodeId } })
    if (!title) return NextResponse.json({ error: 'Title not found' }, { status: 404 })

    const comment = await prisma.comment.create({
      data: { userId: user.id, titleId: title.id, content },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
