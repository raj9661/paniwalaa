import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/popups/[id]/track - Track popup view or dismissal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const body = await request.json()
    const { action } = body // 'view' or 'dismiss'

    if (action === 'view') {
      await prisma.popup.update({
        where: { id },
        data: {
          views: {
            increment: 1,
          },
        },
      })
    } else if (action === 'dismiss') {
      await prisma.popup.update({
        where: { id },
        data: {
          dismissals: {
            increment: 1,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking popup:', error)
    return NextResponse.json(
      { error: 'Failed to track popup' },
      { status: 500 }
    )
  }
}

