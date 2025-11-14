import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/notifications/[id] - Get a single notification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...notification,
      id: notification.id.toString(),
      userId: notification.userId?.toString() || null,
      createdBy: notification.createdBy?.toString() || null,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      expiresAt: notification.expiresAt?.toISOString() || null,
      readAt: notification.readAt?.toISOString() || null,
    })
  } catch (error) {
    console.error('Error fetching notification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/[id] - Update a notification (mark as read, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const body = await request.json()
    const { isRead, title, message, type, priority, expiresAt } = body

    const existingNotification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (isRead !== undefined) {
      updateData.isRead = isRead
      if (isRead && !existingNotification.readAt) {
        updateData.readAt = new Date()
      } else if (!isRead) {
        updateData.readAt = null
      }
    }
    if (title !== undefined) updateData.title = title
    if (message !== undefined) updateData.message = message
    if (type !== undefined) updateData.type = type
    if (priority !== undefined) updateData.priority = priority
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null

    const notification = await prisma.notification.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      ...notification,
      id: notification.id.toString(),
      userId: notification.userId?.toString() || null,
      createdBy: notification.createdBy?.toString() || null,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      expiresAt: notification.expiresAt?.toISOString() || null,
      readAt: notification.readAt?.toISOString() || null,
    })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)

    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    await prisma.notification.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}

