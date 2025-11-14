import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users/[id]/suspend - Suspend user account (super_admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const body = await request.json()
    const { reason } = body

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent suspending super admin accounts
    if (user.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot suspend super admin accounts' },
        { status: 403 }
      )
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isSuspended: true,
        suspensionReason: reason || 'Account suspended by administrator',
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
      message: 'Account suspended successfully',
    })
  } catch (error) {
    console.error('Error suspending user account:', error)
    return NextResponse.json(
      { error: 'Failed to suspend account' },
      { status: 500 }
    )
  }
}

