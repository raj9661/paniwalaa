import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/auth/login - Authenticate user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, password, deviceFingerprint } = body

    if (!password || (!email && !phone)) {
      return NextResponse.json(
        { error: 'Email or phone number and password are required' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Find user by email or phone
    let user = null
    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
      })
    } else if (phone) {
      user = await prisma.user.findUnique({
        where: { phone },
      })
    }

    // Log login attempt (even if user doesn't exist for security)
    const logLoginAttempt = async (status: string, reason?: string, targetUser?: any) => {
      try {
        // Only create log if user exists, or create a temporary entry
        if (targetUser) {
          await prisma.loginLog.create({
            data: {
              userId: targetUser.id,
              email: targetUser.email || email || null,
              phone: targetUser.phone || phone || null,
              role: targetUser.role || 'unknown',
              ipAddress: ip,
              userAgent: userAgent.substring(0, 500),
              deviceFingerprint: deviceFingerprint || null,
              loginStatus: status,
              failureReason: reason,
            },
          })
        } else {
          // For failed logins without user, we can't create a log with userId
          // This is acceptable - we still log the attempt in server logs
          console.log(`Failed login attempt: ${email || phone} from ${ip} - ${reason}`)
        }
      } catch (error) {
        console.error('Error logging login attempt:', error)
      }
    }

    // Check if user exists
    if (!user) {
      await logLoginAttempt('failed', 'User not found', null)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if account is locked (check this first before other status checks)
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      await logLoginAttempt('blocked', 'Account locked', user)
      return NextResponse.json(
        { error: 'Your account is locked. Please contact super admin to unlock your account.' },
        { status: 403 }
      )
    }

    // Check if account is suspended
    if (user.isSuspended) {
      await logLoginAttempt('blocked', `Account suspended: ${user.suspensionReason || 'No reason provided'}`, user)
      return NextResponse.json(
        { error: 'Your account is suspended. Please contact support for more information.' },
        { status: 403 }
      )
    }

    // Check if account has scheduled deletion and reactivate if user logs in within 30 days
    if (user.scheduledDeletionAt) {
      const now = new Date()
      const deletionDate = new Date(user.scheduledDeletionAt)
      
      // If user logs in before scheduled deletion, reactivate account
      if (now < deletionDate) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isActive: true,
            scheduledDeletionAt: null, // Clear scheduled deletion
          },
        })
        // Continue with login - account is now reactivated
      } else {
        // Account should have been permanently deleted, but if it still exists, block login
        await logLoginAttempt('blocked', 'Account permanently deleted', user)
        return NextResponse.json(
          { error: 'Your account has been permanently deleted. Please contact support for assistance.' },
          { status: 403 }
        )
      }
    }

    // Check if account is active (deactivated accounts without scheduled deletion)
    if (!user.isActive && !user.scheduledDeletionAt) {
      await logLoginAttempt('blocked', 'Account is inactive/deleted', user)
      return NextResponse.json(
        { error: 'Your account is deleted. Please contact support for assistance.' },
        { status: 403 }
      )
    }

    // Verify password
    if (!user.passwordHash) {
      await logLoginAttempt('failed', 'No password set', user)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash)

    if (!passwordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1
      const updateData: any = {
        failedLoginAttempts: failedAttempts,
      }

      // Lock account after 5 failed attempts - locked until super admin unlocks
      if (failedAttempts >= 5) {
        // Lock for 30 days (effectively permanent until super admin unlocks)
        const lockUntil = new Date()
        lockUntil.setDate(lockUntil.getDate() + 30)
        updateData.lockedUntil = lockUntil
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      })

      await logLoginAttempt('failed', 'Invalid password', user)
      
      const remainingAttempts = 5 - failedAttempts
      if (remainingAttempts > 0) {
        return NextResponse.json(
          { error: `Invalid email or password. ${remainingAttempts} attempt(s) remaining.` },
          { status: 401 }
        )
      } else {
        return NextResponse.json(
          { error: 'Too many failed login attempts. Account has been locked. Please contact super admin to unlock your account.' },
          { status: 403 }
        )
      }
    }

    // Reset failed login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    })

    // Log successful login
    await logLoginAttempt('success', undefined, user)

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        id: user.id.toString(),
      },
      message: 'Login successful',
    })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { error: 'Failed to process login request' },
      { status: 500 }
    )
  }
}

