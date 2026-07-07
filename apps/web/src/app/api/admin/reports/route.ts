import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export async function POST(request: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const sourceId = formData.get('sourceId') as string
    const action = formData.get('action') as string

    if (!sourceId || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (action === 'disable') {
      await prisma.videoSource.update({
        where: { id: sourceId },
        data: { isActive: false },
      })

      await prisma.adminLog.create({
        data: {
          action: 'source.disable',
          targetType: 'source',
          targetId: sourceId,
        },
      })
    }

    return NextResponse.json({ message: 'Done' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
