import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users/change-phone/verify - Verify OTP and update phone number
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, code, newPhoneNumber } = body

    if (!userId || !code || !newPhoneNumber) {
      return NextResponse.json(
        { error: 'User ID, verification code, and new phone number are required' },
        { status: 400 }
      )
    }

    // Validate phone number format
    if (!/^\d{10}$/.test(newPhoneNumber)) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 10 digits (numbers only)' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find valid OTP
    const otpRecord = await prisma.phoneNumberChangeOTP.findFirst({
      where: {
        userId: BigInt(userId),
        newPhoneNumber,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Check if new phone number is still available
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: newPhoneNumber,
        id: { not: BigInt(userId) },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'This phone number is already registered to another account' },
        { status: 400 }
      )
    }

    // Update user phone number
    const updatedUser = await prisma.user.update({
      where: { id: BigInt(userId) },
      data: {
        phone: newPhoneNumber,
      },
    })

    // Mark OTP as used
    await prisma.phoneNumberChangeOTP.update({
      where: { id: otpRecord.id },
      data: { used: true },
    })

    // Delete all other unused OTPs for this user
    await prisma.phoneNumberChangeOTP.deleteMany({
      where: {
        userId: BigInt(userId),
        used: false,
      },
    })

    return NextResponse.json({
      message: 'Phone number updated successfully',
      user: {
        ...updatedUser,
        id: updatedUser.id.toString(),
      },
    })
  } catch (error: any) {
    console.error('Error verifying phone number change:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update phone number' },
      { status: 500 }
    )
  }
}

