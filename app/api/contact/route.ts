import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// XSS Prevention - Sanitize HTML
function sanitizeInput(input: string): string {
  if (!input) return ''
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  
  // Remove script tags and event handlers
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=/gi, '')
  
  return sanitized.trim()
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone format (optional, flexible)
function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return true // Phone is optional
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

// Basic spam detection
function calculateSpamScore(data: {
  name: string
  email: string
  subject: string
  message: string
  phone?: string
}): number {
  let score = 0
  
  // Check for common spam keywords
  const spamKeywords = [
    'viagra', 'casino', 'lottery', 'winner', 'congratulations',
    'click here', 'limited time', 'act now', 'free money',
    'nigerian prince', 'urgent', 'guaranteed', 'no risk'
  ]
  
  const text = `${data.subject} ${data.message}`.toLowerCase()
  spamKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 0.1
    }
  })
  
  // Check for excessive links
  const linkCount = (data.message.match(/https?:\/\//g) || []).length
  if (linkCount > 2) {
    score += 0.2
  }
  
  // Check for excessive caps
  const capsRatio = (data.message.match(/[A-Z]/g) || []).length / data.message.length
  if (capsRatio > 0.5 && data.message.length > 20) {
    score += 0.15
  }
  
  // Check for suspicious email patterns
  if (data.email.includes('+') && data.email.split('+').length > 2) {
    score += 0.1
  }
  
  // Check message length (very short or very long might be spam)
  if (data.message.length < 10) {
    score += 0.2
  }
  if (data.message.length > 5000) {
    score += 0.15
  }
  
  return Math.min(score, 1.0) // Cap at 1.0
}

// Rate limiting check (simple in-memory, for production use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(ip)
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 }) // 15 minutes
    return true
  }
  
  if (limit.count >= 5) { // Max 5 submissions per 15 minutes
    return false
  }
  
  limit.count++
  return true
}

// POST /api/contact - Submit contact form
export async function POST(request: NextRequest) {
  try {
    // Get client IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
    
    const body = await request.json()
    const { name, email, phone, subject, message } = body
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      )
    }
    
    // Validate field lengths
    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Name is too long (max 100 characters)' },
        { status: 400 }
      )
    }
    
    if (email.length > 255) {
      return NextResponse.json(
        { error: 'Email is too long' },
        { status: 400 }
      )
    }
    
    if (subject.length > 200) {
      return NextResponse.json(
        { error: 'Subject is too long (max 200 characters)' },
        { status: 400 }
      )
    }
    
    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long (max 5000 characters)' },
        { status: 400 }
      )
    }
    
    if (phone && phone.length > 20) {
      return NextResponse.json(
        { error: 'Phone number is too long' },
        { status: 400 }
      )
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Validate phone format
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }
    
    // Sanitize all inputs to prevent XSS
    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email).toLowerCase(),
      phone: phone ? sanitizeInput(phone) : null,
      subject: sanitizeInput(subject),
      message: sanitizeInput(message),
    }
    
    // Calculate spam score
    const spamScore = calculateSpamScore(sanitizedData)
    const isSpam = spamScore > 0.5 // Mark as spam if score > 0.5
    
    // Store in database
    const submission = await prisma.contactSubmission.create({
      data: {
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        subject: sanitizedData.subject,
        message: sanitizedData.message,
        ipAddress: ip,
        userAgent: userAgent.substring(0, 500), // Limit length
        isSpam,
        spamScore,
      },
    })
    
    // Don't reveal spam status to user
    return NextResponse.json({
      message: 'Thank you for contacting us! We will get back to you soon.',
      id: submission.id.toString(),
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error processing contact submission:', error)
    return NextResponse.json(
      { error: 'Failed to submit your message. Please try again later.' },
      { status: 500 }
    )
  }
}

// GET /api/contact - Get contact submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const spamOnly = searchParams.get('spamOnly') === 'true'
    
    const where: any = {}
    if (unreadOnly) {
      where.isRead = false
    }
    if (spamOnly) {
      where.isSpam = true
    }
    
    const [submissions, total] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contactSubmission.count({ where }),
    ])
    
    return NextResponse.json({
      submissions: submissions.map(s => ({
        ...s,
        id: s.id.toString(),
        readBy: s.readBy?.toString() || null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        readAt: s.readAt?.toISOString() || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching contact submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact submissions' },
      { status: 500 }
    )
  }
}

