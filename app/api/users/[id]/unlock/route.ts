import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users/[id]/unlock - Unlock user account (super_admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent unlocking super admin accounts (though they shouldn't be locked)
    if (user.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot unlock super admin accounts' },
        { status: 403 }
      )
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        lockedUntil: true,
        failedLoginAttempts: true,
      },
    })

    return NextResponse.json({
      ...updated,
      id: updated.id.toString(),
      message: 'Account unlocked successfully',
    })
  } catch (error) {
    console.error('Error unlocking user account:', error)
    return NextResponse.json(
      { error: 'Failed to unlock account' },
      { status: 500 }
    )
  }
}

