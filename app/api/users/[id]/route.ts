import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isSuspended: true,
        suspensionReason: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        lastLoginAt: true,
        deviceFingerprint: true,
        ipAddress: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...user,
      id: user.id.toString(),
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user (super_admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const body = await request.json()
    const {
      isActive,
      isSuspended,
      suspensionReason,
      lockedUntil,
      failedLoginAttempts,
    } = body

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (isActive !== undefined) {
      updateData.isActive = isActive
    }
    if (isSuspended !== undefined) {
      updateData.isSuspended = isSuspended
      if (isSuspended && suspensionReason !== undefined) {
        updateData.suspensionReason = suspensionReason
      } else if (!isSuspended) {
        updateData.suspensionReason = null
      }
    }
    if (suspensionReason !== undefined) {
      updateData.suspensionReason = suspensionReason
    }
    if (lockedUntil !== undefined) {
      updateData.lockedUntil = lockedUntil ? new Date(lockedUntil) : null
      // If unlocking, reset failed attempts
      if (!lockedUntil) {
        updateData.failedLoginAttempts = 0
      }
    }
    if (failedLoginAttempts !== undefined) {
      updateData.failedLoginAttempts = failedLoginAttempts
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isSuspended: true,
        suspensionReason: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    return NextResponse.json({
      ...updated,
      id: updated.id.toString(),
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

