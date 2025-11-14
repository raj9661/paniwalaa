import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users/[id]/unsuspend - Unsuspend user account (super_admin only)
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

    // Prevent unsuspending super admin accounts (though they shouldn't be suspended)
    if (user.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot unsuspend super admin accounts' },
        { status: 403 }
      )
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isSuspended: false,
        suspensionReason: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isSuspended: true,
        suspensionReason: true,
      },
    })

    return NextResponse.json({
      ...updated,
      id: updated.id.toString(),
      message: 'Account unsuspended successfully',
    })
  } catch (error) {
    console.error('Error unsuspending user account:', error)
    return NextResponse.json(
      { error: 'Failed to unsuspend account' },
      { status: 500 }
    )
  }
}

