import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/notifications - Get notifications for user or all (admin)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const adminView = searchParams.get('adminView') === 'true'

    if (adminView) {
      // Admin view - get all notifications
      const notifications = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
      return NextResponse.json({ 
        notifications: notifications.map(n => ({
          ...n,
          id: n.id.toString(),
          userId: n.userId?.toString() || null,
          createdBy: n.createdBy?.toString() || null,
          createdAt: n.createdAt.toISOString(),
          updatedAt: n.updatedAt.toISOString(),
          expiresAt: n.expiresAt?.toISOString() || null,
          readAt: n.readAt?.toISOString() || null,
        }))
      })
    } else {
      // User view - get relevant notifications
      const now = new Date()
      const where: any = {
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      }

      if (unreadOnly) {
        where.isRead = false
      }

      if (userId) {
        // User-specific notifications
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
        // Role-based notifications
        where.OR = [
          { targetType: 'all' },
          {
            targetType: 'role',
            targetRoles: {
              contains: role,
            },
          },
        ]
      } else {
        where.targetType = 'all'
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 50,
      })

      // Filter by role if targetRoles is set
      const filteredNotifications = notifications.filter((notif) => {
        if (notif.targetType === 'role' && notif.targetRoles) {
          try {
            const roles = JSON.parse(notif.targetRoles)
            return roles.includes('all') || (role && roles.includes(role))
          } catch {
            return true
          }
        }
        return true
      })

      return NextResponse.json({ 
        notifications: filteredNotifications.map(n => ({
          ...n,
          id: n.id.toString(),
          userId: n.userId?.toString() || null,
          createdBy: n.createdBy?.toString() || null,
          createdAt: n.createdAt.toISOString(),
          updatedAt: n.updatedAt.toISOString(),
          expiresAt: n.expiresAt?.toISOString() || null,
          readAt: n.readAt?.toISOString() || null,
        }))
      })
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      message,
      type,
      targetType,
      targetRoles,
      targetUserIds,
      userId,
      link,
      imageUrl,
      priority,
      expiresAt,
      createdBy,
    } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // If targetType is 'user' and userId is provided, create single notification
    if (targetType === 'user' && userId) {
      const notification = await prisma.notification.create({
        data: {
          title,
          message,
          type: type || 'info',
          targetType: 'user',
          userId: BigInt(userId),
          link,
          imageUrl,
          priority: priority || 'normal',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          createdBy: createdBy ? BigInt(createdBy) : null,
        },
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
      }, { status: 201 })
    }

    // For 'all' or 'role' target types
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || 'info',
        targetType: targetType || 'all',
        targetRoles: targetRoles ? JSON.stringify(targetRoles) : null,
        targetUserIds: targetUserIds ? JSON.stringify(targetUserIds) : null,
        link,
        imageUrl,
        priority: priority || 'normal',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: createdBy ? BigInt(createdBy) : null,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

