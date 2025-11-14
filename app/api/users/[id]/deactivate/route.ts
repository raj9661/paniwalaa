import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users/[id]/deactivate - Deactivate user account (super_admin only)
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

    // Prevent deactivating super admin accounts
    if (user.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot deactivate super admin accounts' },
        { status: 403 }
      )
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      ...updated,
      id: updated.id.toString(),
      message: 'Account deactivated successfully',
    })
  } catch (error) {
    console.error('Error deactivating user account:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate account' },
      { status: 500 }
    )
  }
}

