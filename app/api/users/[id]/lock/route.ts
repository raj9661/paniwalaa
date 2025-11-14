import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users/[id]/lock - Lock user account (super_admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const body = await request.json()
    const { lockDurationMinutes } = body // Optional: lock duration in minutes

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent locking super admin accounts
    if (user.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot lock super admin accounts' },
        { status: 403 }
      )
    }

    const lockUntil = lockDurationMinutes
      ? new Date(Date.now() + lockDurationMinutes * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default: 30 days

    const updated = await prisma.user.update({
      where: { id },
      data: {
        lockedUntil: lockUntil,
        failedLoginAttempts: 5, // Set to max to show as locked
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        lockedUntil: true,
      },
    })

    return NextResponse.json({
      ...updated,
      id: updated.id.toString(),
      message: 'Account locked successfully',
    })
  } catch (error) {
    console.error('Error locking user account:', error)
    return NextResponse.json(
      { error: 'Failed to lock account' },
      { status: 500 }
    )
  }
}

