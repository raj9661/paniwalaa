import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetCode } from '@/lib/email'
import crypto from 'crypto'

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset code has been sent.',
      })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')

    // Set expiration to 15 minutes
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    // Invalidate any existing tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: {
        used: true,
      },
    })

    // Create new password reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        code,
        expiresAt,
      },
    })

    // Send email with code
    try {
      await sendPasswordResetCode(user.email!, code, user.name || undefined)
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please check email configuration.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset code has been sent.',
      token, // Return token for verification step
    })
  } catch (error) {
    console.error('Error processing password reset request:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}

