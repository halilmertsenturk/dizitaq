import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'
import { getBodySize, BODY_SIZE_LIMIT, validateEmbedUrl } from '@/lib/security'

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sources = await prisma.videoSource.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(sources)
}

export async function POST(request: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const size = getBodySize(request)
  if (size > BODY_SIZE_LIMIT) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }

  try {
    const { watchmodeId, episodeId, embedUrl, sourceName, quality, language } = await request.json()

    if (!embedUrl || !sourceName) {
      return NextResponse.json({ error: 'embedUrl and sourceName are required' }, { status: 400 })
    }

    const urlValidation = validateEmbedUrl(embedUrl)
    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 })
    }

    const source = await prisma.videoSource.create({
      data: {
        watchmodeId: typeof watchmodeId === 'number' ? watchmodeId : null,
        episodeId: episodeId || null,
        embedUrl,
        sourceName,
        quality: quality || null,
        language: language || 'en',
      },
    })

    await prisma.adminLog.create({
      data: {
        action: 'source.create',
        targetType: 'source',
        targetId: source.id,
        metadata: { watchmodeId, embedUrl, sourceName },
      },
    })

    return NextResponse.json(source, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.videoSource.delete({ where: { id } })

  await prisma.adminLog.create({
    data: {
      action: 'source.delete',
      targetType: 'source',
      targetId: id,
    },
  })

  return NextResponse.json({ message: 'Deleted' })
}
