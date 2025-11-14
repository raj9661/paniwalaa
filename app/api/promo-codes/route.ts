import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/promo-codes - Get all promo codes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (code) {
      where.code = { contains: code, mode: 'insensitive' }
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.promoCode.count({ where }),
    ])

    return NextResponse.json({
      promoCodes: promoCodes.map(pc => ({
        ...pc,
        id: pc.id.toString(),
        discountValue: pc.discountValue.toString(),
        minOrderAmountCents: pc.minOrderAmountCents?.toString() || null,
        maxDiscountCents: pc.maxDiscountCents?.toString() || null,
        createdBy: pc.createdBy?.toString() || null,
        validFrom: pc.validFrom.toISOString(),
        validUntil: pc.validUntil.toISOString(),
        createdAt: pc.createdAt.toISOString(),
        updatedAt: pc.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    )
  }
}

// POST /api/promo-codes - Create new promo code (super admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmountCents,
      maxDiscountCents,
      maxUses,
      maxUsesPerUser,
      validFrom,
      validUntil,
      isActive,
      applicableRoles,
      createdBy,
    } = body

    // Validate required fields
    if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: 'Code, discount type, discount value, valid from, and valid until are required' },
        { status: 400 }
      )
    }

    // Validate discount type
    if (discountType !== 'percentage' && discountType !== 'fixed') {
      return NextResponse.json(
        { error: 'Discount type must be "percentage" or "fixed"' },
        { status: 400 }
      )
    }

    // Validate discount value
    if (discountType === 'percentage' && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (discountType === 'fixed' && discountValue < 0) {
      return NextResponse.json(
        { error: 'Fixed discount must be positive' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (existingCode) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 400 }
      )
    }

    // Create promo code
    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        description: description || null,
        discountType,
        discountValue: BigInt(discountValue),
        minOrderAmountCents: minOrderAmountCents ? BigInt(minOrderAmountCents) : null,
        maxDiscountCents: maxDiscountCents ? BigInt(maxDiscountCents) : null,
        maxUses: maxUses || null,
        maxUsesPerUser: maxUsesPerUser || null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isActive: isActive !== false,
        applicableRoles: applicableRoles || null,
        createdBy: createdBy ? BigInt(createdBy) : null,
        usedCount: 0,
      },
    })

    return NextResponse.json({
      ...promoCode,
      id: promoCode.id.toString(),
      discountValue: promoCode.discountValue.toString(),
      minOrderAmountCents: promoCode.minOrderAmountCents?.toString() || null,
      maxDiscountCents: promoCode.maxDiscountCents?.toString() || null,
      createdBy: promoCode.createdBy?.toString() || null,
      validFrom: promoCode.validFrom.toISOString(),
      validUntil: promoCode.validUntil.toISOString(),
      createdAt: promoCode.createdAt.toISOString(),
      updatedAt: promoCode.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating promo code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create promo code' },
      { status: 500 }
    )
  }
}

