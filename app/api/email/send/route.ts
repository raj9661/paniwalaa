import { NextRequest, NextResponse } from 'next/server'
import { sendCustomEmail } from '@/lib/email'

// POST /api/email/send - Send custom email to users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipients, subject, message, customFooter } = body

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients list is required' },
        { status: 400 }
      )
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      )
    }

    // Limit number of recipients per request
    if (recipients.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 recipients per request' },
        { status: 400 }
      )
    }

    // Send emails
    await sendCustomEmail(recipients, subject, message, customFooter)

    return NextResponse.json({
      message: `Email sent successfully to ${recipients.length} recipient(s)`,
    })
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

