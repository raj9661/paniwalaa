import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPhoneNumberChangeOTP } from '@/lib/email'
import crypto from 'crypto'

// POST /api/users/change-phone/send-otp - Send OTP for phone number change
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, newPhoneNumber } = body

    if (!userId || !newPhoneNumber) {
      return NextResponse.json(
        { error: 'User ID and new phone number are required' },
        { status: 400 }
      )
    }

    // Validate phone number format (10 digits, numeric only)
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

    // Check if email exists (required for OTP)
    if (!user.email) {
      return NextResponse.json(
        { error: 'Email address is required to change phone number. Please add an email to your account first.' },
        { status: 400 }
      )
    }

    // Check if new phone number is already in use by another user
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

    // Check if phone number is same as current
    if (user.phone === newPhoneNumber) {
      return NextResponse.json(
        { error: 'New phone number must be different from current phone number' },
        { status: 400 }
      )
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Set expiration to 15 minutes from now
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    // Delete any existing unused OTPs for this user
    await prisma.phoneNumberChangeOTP.deleteMany({
      where: {
        userId: BigInt(userId),
        used: false,
      },
    })

    // Create new OTP record
    await prisma.phoneNumberChangeOTP.create({
      data: {
        userId: BigInt(userId),
        newPhoneNumber,
        code,
        expiresAt,
        used: false,
      },
    })

    // Send OTP email
    try {
      await sendPhoneNumberChangeOTP(user.email, code, newPhoneNumber, user.name || undefined)
    } catch (emailError) {
      console.error('Error sending phone number change OTP email:', emailError)
      // Delete the OTP record if email fails
      await prisma.phoneNumberChangeOTP.deleteMany({
        where: {
          userId: BigInt(userId),
          code,
        },
      })
      return NextResponse.json(
        { error: 'Failed to send verification email. Please check your email settings.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Verification code sent to your email address',
    })
  } catch (error: any) {
    console.error('Error sending phone number change OTP:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send verification code' },
      { status: 500 }
    )
  }
}

