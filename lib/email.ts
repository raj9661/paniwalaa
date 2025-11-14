import nodemailer from 'nodemailer'
import { prisma } from './prisma'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

// Get email settings from database
async function getEmailSettings() {
  const settings = await prisma.emailSettings.findFirst({
    orderBy: { updatedAt: 'desc' },
  })

  if (!settings || !settings.smtpEmail || !settings.smtpPassword) {
    throw new Error('Email settings not configured. Please configure SMTP settings in admin panel.')
  }

  return settings
}

// Create email transporter
async function createTransporter() {
  const settings = await getEmailSettings()

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost || 'smtp.gmail.com',
    port: settings.smtpPort || 465,
    secure: settings.smtpSecure !== false, // true for 465, false for other ports
    auth: {
      user: settings.smtpEmail,
      pass: settings.smtpPassword,
    },
  })

  // Verify connection
  try {
    await transporter.verify()
  } catch (error) {
    console.error('Email transporter verification failed:', error)
    throw new Error('Failed to connect to email server. Please check your SMTP settings.')
  }

  return transporter
}

// Get email footer from settings
async function getEmailFooter(): Promise<string> {
  const settings = await getEmailSettings()
  return settings.emailFooter || `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; text-align: center;">
      <p>© ${new Date().getFullYear()} Paniwalaa. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  `
}

// Create email template with footer
async function createEmailTemplate(content: string, customFooter?: string): Promise<string> {
  const footer = customFooter || await getEmailFooter()
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 30px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Paniwalaa</div>
        </div>
        <div class="content">
          ${content}
        </div>
        ${footer}
      </div>
    </body>
    </html>
  `
}

// Send email
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const settings = await getEmailSettings()
    const transporter = await createTransporter()

    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    
    // Create email HTML with template
    const html = await createEmailTemplate(options.html)

    const mailOptions = {
      from: `"${settings.fromName || 'Paniwalaa'}" <${settings.fromEmail || settings.smtpEmail}>`,
      to: recipients.join(', '),
      subject: options.subject,
      html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Plain text version
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

// Send welcome email
export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; font-size: 32px; margin: 0;">Welcome to Paniwalaa! 🎉</h1>
    </div>
    <p>Hello ${name || 'there'},</p>
    <p>Thank you for creating an account with Paniwalaa! We're excited to have you on board.</p>
    <p>With Paniwalaa, you can:</p>
    <ul style="margin: 20px 0; padding-left: 20px;">
      <li>Order premium 20L and 10L water jars</li>
      <li>Get fast 30-minute delivery to your doorstep</li>
      <li>Track your orders in real-time</li>
      <li>Manage your addresses and wallet</li>
    </ul>
    <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af;"><strong>Get started:</strong> Browse our products and place your first order today!</p>
    </div>
    <p>If you have any questions, feel free to contact our support team. We're here to help!</p>
    <p>Happy ordering!</p>
    <p><strong>The Paniwalaa Team</strong></p>
  `

  await sendEmail({
    to: email,
    subject: 'Welcome to Paniwalaa! 🎉',
    html: content,
  })
}

// Send password reset code email
export async function sendPasswordResetCode(email: string, code: string, name?: string): Promise<void> {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #2563eb; font-size: 24px; margin: 0;">Password Reset Request</h2>
    </div>
    <p>Hello ${name || 'User'},</p>
    <p>We received a request to reset your password for your Paniwalaa account. Please use the following verification code to proceed:</p>
    <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
      <h1 style="color: #2563eb; font-size: 36px; margin: 0; letter-spacing: 8px; font-weight: bold;">${code}</h1>
    </div>
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e;"><strong>Important:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #92400e;">
        <li>This code will expire in <strong>15 minutes</strong></li>
        <li>Never share this code with anyone</li>
        <li>If you didn't request this, please ignore this email</li>
      </ul>
    </div>
    <p>Enter this code on the password reset page to create a new password.</p>
    <p>Stay secure!</p>
    <p><strong>The Paniwalaa Team</strong></p>
  `

  await sendEmail({
    to: email,
    subject: 'Password Reset Verification Code - Paniwalaa',
    html: content,
  })
}

// Send phone number change OTP email
export async function sendPhoneNumberChangeOTP(email: string, code: string, newPhoneNumber: string, name?: string): Promise<void> {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #2563eb; font-size: 24px; margin: 0;">Phone Number Change Request</h2>
    </div>
    <p>Hello ${name || 'User'},</p>
    <p>We received a request to change your phone number to <strong>${newPhoneNumber}</strong> for your Paniwalaa account. Please use the following verification code to proceed:</p>
    <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
      <h1 style="color: #2563eb; font-size: 36px; margin: 0; letter-spacing: 8px; font-weight: bold;">${code}</h1>
    </div>
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e;"><strong>Important:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #92400e;">
        <li>This code will expire in <strong>15 minutes</strong></li>
        <li>Never share this code with anyone</li>
        <li>If you didn't request this change, please ignore this email and contact support immediately</li>
      </ul>
    </div>
    <p>Enter this code on the phone number change page to complete the update.</p>
    <p>Stay secure!</p>
    <p><strong>The Paniwalaa Team</strong></p>
  `

  await sendEmail({
    to: email,
    subject: 'Phone Number Change Verification Code - Paniwalaa',
    html: content,
  })
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(
  email: string,
  orderData: {
    orderId: string
    name?: string
    orderDate: string
    items: Array<{
      productName: string
      quantity: number
      price: number
    }>
    subtotal: number
    floorCharge?: number
    floorChargeWaived?: number
    securityDeposit?: number
    discount?: number
    promoCode?: string
    total: number
    deliveryAddress: string
    estimatedDelivery?: string
  }
): Promise<void> {
  const { name, orderId, orderDate, items, subtotal, floorCharge, floorChargeWaived, securityDeposit, discount, promoCode, total, deliveryAddress, estimatedDelivery } = orderData

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #10b981; font-size: 32px; margin: 0;">Thank You for Your Order! 🎉</h1>
    </div>
    <p>Hello ${name || 'Valued Customer'},</p>
    <p>We've received your order and it's being processed. Here are your order details:</p>
    
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #111827;">Order Information</h3>
      <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderId}</p>
      <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(orderDate).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</p>
      ${estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
    </div>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #111827;">Delivery Address</h3>
      <p style="margin: 0; white-space: pre-line;">${deliveryAddress}</p>
    </div>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #111827;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Quantity</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Unit Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #166534;">Order Summary</h3>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0;">Subtotal:</td>
          <td style="padding: 8px 0; text-align: right;"><strong>₹${subtotal.toFixed(2)}</strong></td>
        </tr>
        ${floorCharge && floorCharge > 0 ? `
        <tr>
          <td style="padding: 8px 0;">Floor Charge:</td>
          <td style="padding: 8px 0; text-align: right;"><strong>₹${floorCharge.toFixed(2)}</strong></td>
        </tr>
        ${floorChargeWaived && floorChargeWaived > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #10b981;">Floor Charge Waived (Discount):</td>
          <td style="padding: 8px 0; text-align: right;"><strong style="color: #10b981;">-₹${floorChargeWaived.toFixed(2)}</strong></td>
        </tr>
        ` : ''}
        ` : ''}
        ${securityDeposit ? `
        <tr>
          <td style="padding: 8px 0;">Security Deposit:</td>
          <td style="padding: 8px 0; text-align: right;"><strong>₹${securityDeposit.toFixed(2)}</strong></td>
        </tr>
        ` : ''}
        ${discount ? `
        <tr>
          <td style="padding: 8px 0;">Discount${promoCode ? ` (${promoCode})` : ''}:</td>
          <td style="padding: 8px 0; text-align: right;"><strong style="color: #10b981;">-₹${discount.toFixed(2)}</strong></td>
        </tr>
        ` : ''}
        <tr style="border-top: 2px solid #86efac; margin-top: 10px;">
          <td style="padding: 12px 0; font-size: 18px;"><strong>Total Amount:</strong></td>
          <td style="padding: 12px 0; text-align: right; font-size: 18px;"><strong style="color: #166534;">₹${total.toFixed(2)}</strong></td>
        </tr>
      </table>
    </div>

    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af;"><strong>What's Next?</strong></p>
      <p style="margin: 10px 0 0 0; color: #1e40af;">Your order is being prepared and will be delivered to you soon. You'll receive updates as your order progresses.</p>
    </div>

    <p>Thank you for choosing Paniwalaa! We appreciate your business.</p>
    <p>If you have any questions about your order, please don't hesitate to contact us.</p>
    <p>Best regards,<br><strong>The Paniwalaa Team</strong></p>
  `

  await sendEmail({
    to: email,
    subject: `Order Confirmation - Order #${orderId} - Paniwalaa`,
    html: content,
  })
}

// Send custom email to users
export async function sendCustomEmail(
  recipients: string[],
  subject: string,
  message: string,
  customFooter?: string
): Promise<void> {
  const content = `
    <div style="white-space: pre-wrap;">${message}</div>
  `

  // Send to each recipient
  for (const recipient of recipients) {
    await sendEmail({
      to: recipient,
      subject,
      html: await createEmailTemplate(content, customFooter),
    })
  }
}

