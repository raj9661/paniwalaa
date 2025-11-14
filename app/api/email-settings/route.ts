import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/email-settings - Get email settings
export async function GET() {
  try {
    const settings = await prisma.emailSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    })

    if (!settings) {
      return NextResponse.json({
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpSecure: true,
        smtpEmail: '',
        smtpPassword: '',
        fromName: 'Paniwalaa',
        fromEmail: '',
        emailFooter: '',
      })
    }

    // Don't return password in response
    return NextResponse.json({
      id: settings.id.toString(),
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpSecure: settings.smtpSecure,
      smtpEmail: settings.smtpEmail,
      smtpPassword: settings.smtpPassword ? '***' : '', // Mask password
      fromName: settings.fromName,
      fromEmail: settings.fromEmail,
      emailFooter: settings.emailFooter,
      updatedAt: settings.updatedAt.toISOString(),
      updatedBy: settings.updatedBy?.toString() || null,
    })
  } catch (error) {
    console.error('Error fetching email settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email settings' },
      { status: 500 }
    )
  }
}

// PUT /api/email-settings - Update email settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpEmail,
      smtpPassword,
      fromName,
      fromEmail,
      emailFooter,
      updatedBy,
    } = body

    // Check if settings exist
    const existingSettings = await prisma.emailSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    })

    if (existingSettings) {
      // Update existing settings
      // Only update password if a new one is provided (not empty and not masked)
      const updateData: any = {
        ...(smtpHost !== undefined && { smtpHost }),
        ...(smtpPort !== undefined && { smtpPort }),
        ...(smtpSecure !== undefined && { smtpSecure }),
        ...(smtpEmail !== undefined && { smtpEmail }),
        ...(smtpPassword !== undefined && smtpPassword !== '' && smtpPassword !== '***' && { smtpPassword }),
        ...(fromName !== undefined && { fromName }),
        ...(fromEmail !== undefined && { fromEmail }),
        ...(emailFooter !== undefined && { emailFooter }),
        ...(updatedBy !== undefined && { updatedBy: updatedBy ? BigInt(updatedBy) : null }),
      }

      const settings = await prisma.emailSettings.update({
        where: { id: existingSettings.id },
        data: updateData,
      })

      return NextResponse.json({
        id: settings.id.toString(),
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpSecure: settings.smtpSecure,
        smtpEmail: settings.smtpEmail,
        smtpPassword: settings.smtpPassword ? '***' : '',
        fromName: settings.fromName,
        fromEmail: settings.fromEmail,
        emailFooter: settings.emailFooter,
        updatedAt: settings.updatedAt.toISOString(),
        updatedBy: settings.updatedBy?.toString() || null,
        message: 'Email settings updated successfully',
      })
    } else {
      // Create new settings
      const settings = await prisma.emailSettings.create({
        data: {
          smtpHost: smtpHost || 'smtp.gmail.com',
          smtpPort: smtpPort || 465,
          smtpSecure: smtpSecure !== false,
          smtpEmail: smtpEmail || '',
          smtpPassword: smtpPassword || '',
          fromName: fromName || 'Paniwalaa',
          fromEmail: fromEmail || '',
          emailFooter: emailFooter || '',
          updatedBy: updatedBy ? BigInt(updatedBy) : null,
        },
      })

      return NextResponse.json({
        id: settings.id.toString(),
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpSecure: settings.smtpSecure,
        smtpEmail: settings.smtpEmail,
        smtpPassword: settings.smtpPassword ? '***' : '',
        fromName: settings.fromName,
        fromEmail: settings.fromEmail,
        emailFooter: settings.emailFooter,
        updatedAt: settings.updatedAt.toISOString(),
        updatedBy: settings.updatedBy?.toString() || null,
        message: 'Email settings created successfully',
      })
    }
  } catch (error: any) {
    console.error('Error updating email settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update email settings' },
      { status: 500 }
    )
  }
}

// POST /api/email-settings/test - Test email configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testEmail } = body

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      )
    }

    // Import sendEmail function
    const { sendEmail } = await import('@/lib/email')

    // Send test email
    await sendEmail({
      to: testEmail,
      subject: 'Test Email from Paniwalaa',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify your email configuration.</p>
        <p>If you received this email, your SMTP settings are working correctly!</p>
      `,
    })

    return NextResponse.json({
      message: 'Test email sent successfully!',
    })
  } catch (error: any) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send test email. Please check your SMTP settings.' },
      { status: 500 }
    )
  }
}

