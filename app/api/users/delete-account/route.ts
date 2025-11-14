import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users/delete-account - Delete user account (customer only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only allow customers to delete their own accounts
    if (user.role !== 'customer') {
      return NextResponse.json(
        { error: 'Only customer accounts can be deleted through this endpoint' },
        { status: 403 }
      )
    }

    // Calculate deletion date (30 days from now)
    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 30)

    // Deactivate account and set scheduled deletion date
    const updated = await prisma.user.update({
      where: { id: BigInt(userId) },
      data: {
        isActive: false,
        scheduledDeletionAt: deletionDate,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        scheduledDeletionAt: true,
      },
    })

    return NextResponse.json({
      ...updated,
      id: updated.id.toString(),
      scheduledDeletionAt: updated.scheduledDeletionAt?.toISOString() || null,
      message: 'Account deletion scheduled successfully',
    })
  } catch (error) {
    console.error('Error scheduling account deletion:', error)
    return NextResponse.json(
      { error: 'Failed to schedule account deletion' },
      { status: 500 }
    )
  }
}

