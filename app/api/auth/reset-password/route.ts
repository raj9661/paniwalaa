import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/auth/reset-password - Reset password with code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, code, newPassword } = body

    if (!token || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Token, code, and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength - must be alphanumeric with special characters
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check for at least one number
    if (!/\d/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      )
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one letter' },
        { status: 400 }
      )
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' },
        { status: 400 }
      )
    }

    // Find password reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'This reset code has already been used' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Reset code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Verify code
    if (resetToken.code !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    })

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    })

    return NextResponse.json({
      message: 'Password reset successfully. You can now login with your new password.',
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}

