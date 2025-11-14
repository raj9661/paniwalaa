import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '@/lib/email'
import crypto from 'crypto'

// Generate device fingerprint from request
function generateDeviceFingerprint(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const acceptLanguage = request.headers.get('accept-language') || 'unknown'
  
  const fingerprint = `${ip}-${userAgent}-${acceptLanguage}`
  return crypto.createHash('sha256').update(fingerprint).digest('hex')
}

// POST /api/users/create - Create user by super admin (admin or delivery_partner only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password, role, createdBy } = body

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // Generate server-side device fingerprint
    const serverFingerprint = generateDeviceFingerprint(request)

    // Validate required fields
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate role - only allow admin or delivery_partner
    if (role !== 'admin' && role !== 'delivery_partner') {
      return NextResponse.json(
        { error: 'Invalid role. Only admin or delivery_partner can be created' },
        { status: 400 }
      )
    }

    // Validate name - must be characters only
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      )
    }
    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      return NextResponse.json(
        { error: 'Name must contain only letters and spaces' },
        { status: 400 }
      )
    }

    // Validate phone - must be exactly 10 digits, numeric only
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 10 digits (numbers only)' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength - must be alphanumeric with special characters
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      )
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one letter' },
        { status: 400 }
      )
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' },
        { status: 400 }
      )
    }

    // Check if user already exists with same email or phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email or phone number already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user (device fingerprint and IP are optional for admin-created users)
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name: trimmedName,
        passwordHash,
        role,
      },
    })

    // Send welcome email (don't fail if email fails)
    try {
      if (email) {
        await sendWelcomeEmail(email, name)
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError)
      // Continue even if email fails
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        id: user.id.toString(),
      },
      message: 'User created successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      // Unique constraint violation
      if (error.meta?.target?.includes('email')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        )
      }
      if (error.meta?.target?.includes('phone')) {
        return NextResponse.json(
          { error: 'An account with this phone number already exists' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}

