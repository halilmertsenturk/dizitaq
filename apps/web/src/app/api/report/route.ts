import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { prisma } from '@/lib/prisma'
import { getReportLimiter, getBodySize, BODY_SIZE_LIMIT } from '@/lib/security'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limiter = getReportLimiter()
  if (limiter) {
    const { success } = await limiter.limit(user.id)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
  }

  const size = getBodySize(request)
  if (size > BODY_SIZE_LIMIT) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }

  try {
    const { sourceId, reason } = await request.json()

    if (!sourceId || !reason) {
      return NextResponse.json({ error: 'sourceId and reason are required' }, { status: 400 })
    }

    const validReasons = ['broken', 'wrong', 'malicious', 'other']
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
    }

    const source = await prisma.videoSource.findUnique({ where: { id: sourceId } })
    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    await prisma.report.create({
      data: {
        userId: user.id,
        sourceId,
        reason,
      },
    })

    await prisma.videoSource.update({
      where: { id: sourceId },
      data: { reportsCount: { increment: 1 } },
    })

    return NextResponse.json({ message: 'Report submitted' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
