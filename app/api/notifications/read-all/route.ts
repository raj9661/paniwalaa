import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/notifications/read-all - Mark all notifications as read for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, role } = body

    if (!userId && !role) {
      return NextResponse.json(
        { error: 'userId or role is required' },
        { status: 400 }
      )
    }

    const where: any = {
      isRead: false,
    }

    if (userId) {
      where.OR = [
        { userId: BigInt(userId) },
        { targetType: 'all' },
        {
          targetType: 'role',
          targetRoles: {
            contains: role || 'all',
          },
        },
      ]
    } else if (role) {
      where.OR = [
        { targetType: 'all' },
        {
          targetType: 'role',
          targetRoles: {
            contains: role,
          },
        },
      ]
    }

    await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}

