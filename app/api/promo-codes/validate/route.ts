import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/promo-codes/validate - Validate and calculate discount
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, orderAmountCents, userId, role } = body

    if (!code || !orderAmountCents) {
      return NextResponse.json(
        { error: 'Promo code and order amount are required' },
        { status: 400 }
      )
    }

    // Find promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Invalid promo code' },
        { status: 404 }
      )
    }

    // Check if code is active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { error: 'This promo code is not active' },
        { status: 400 }
      )
    }

    // Check validity dates
    const now = new Date()
    if (now < promoCode.validFrom) {
      return NextResponse.json(
        { error: 'This promo code is not yet valid' },
        { status: 400 }
      )
    }

    if (now > promoCode.validUntil) {
      return NextResponse.json(
        { error: 'This promo code has expired' },
        { status: 400 }
      )
    }

    // Check maximum uses
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json(
        { error: 'This promo code has reached its maximum usage limit' },
        { status: 400 }
      )
    }

    // Check minimum order amount
    if (promoCode.minOrderAmountCents && orderAmountCents < Number(promoCode.minOrderAmountCents)) {
      return NextResponse.json(
        { error: `Minimum order amount of ₹${Number(promoCode.minOrderAmountCents) / 100} required to use this promo code` },
        { status: 400 }
      )
    }

    // Check applicable roles
    if (promoCode.applicableRoles && role) {
      const roles = promoCode.applicableRoles.split(',').map(r => r.trim())
      if (!roles.includes(role)) {
        return NextResponse.json(
          { error: 'This promo code is not applicable for your account type' },
          { status: 400 }
        )
      }
    }

    // Check per-user usage limit
    if (userId && promoCode.maxUsesPerUser) {
      const userUsageCount = await prisma.order.count({
        where: {
          userId: BigInt(userId),
          promoCodeId: promoCode.id,
        },
      })

      if (userUsageCount >= promoCode.maxUsesPerUser) {
        return NextResponse.json(
          { error: 'You have reached the maximum usage limit for this promo code' },
          { status: 400 }
        )
      }
    }

    // Calculate discount
    let discountCents = BigInt(0)

    if (promoCode.discountType === 'percentage') {
      const percentage = Number(promoCode.discountValue)
      discountCents = BigInt(Math.floor((orderAmountCents * percentage) / 100))
      
      // Apply maximum discount limit if set
      if (promoCode.maxDiscountCents && discountCents > promoCode.maxDiscountCents) {
        discountCents = promoCode.maxDiscountCents
      }
    } else {
      // Fixed discount
      discountCents = promoCode.discountValue
      
      // Don't allow discount more than order amount
      if (discountCents > BigInt(orderAmountCents)) {
        discountCents = BigInt(orderAmountCents)
      }
    }

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id.toString(),
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: Number(promoCode.discountValue),
      },
      discountCents: Number(discountCents),
      discountAmount: Number(discountCents) / 100,
      finalAmount: (orderAmountCents - Number(discountCents)) / 100,
    })
  } catch (error) {
    console.error('Error validating promo code:', error)
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    )
  }
}

