import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/promo-codes/[id] - Get single promo code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
    })

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }

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
    })
  } catch (error) {
    console.error('Error fetching promo code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo code' },
      { status: 500 }
    )
  }
}

// PUT /api/promo-codes/[id] - Update promo code (super admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
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
    } = body

    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
    })

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (code !== undefined) updateData.code = code.toUpperCase()
    if (description !== undefined) updateData.description = description
    if (discountType !== undefined) updateData.discountType = discountType
    if (discountValue !== undefined) updateData.discountValue = BigInt(discountValue)
    if (minOrderAmountCents !== undefined) updateData.minOrderAmountCents = minOrderAmountCents ? BigInt(minOrderAmountCents) : null
    if (maxDiscountCents !== undefined) updateData.maxDiscountCents = maxDiscountCents ? BigInt(maxDiscountCents) : null
    if (maxUses !== undefined) updateData.maxUses = maxUses
    if (maxUsesPerUser !== undefined) updateData.maxUsesPerUser = maxUsesPerUser
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom)
    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil)
    if (isActive !== undefined) updateData.isActive = isActive
    if (applicableRoles !== undefined) updateData.applicableRoles = applicableRoles

    const updated = await prisma.promoCode.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      ...updated,
      id: updated.id.toString(),
      discountValue: updated.discountValue.toString(),
      minOrderAmountCents: updated.minOrderAmountCents?.toString() || null,
      maxDiscountCents: updated.maxDiscountCents?.toString() || null,
      createdBy: updated.createdBy?.toString() || null,
      validFrom: updated.validFrom.toISOString(),
      validUntil: updated.validUntil.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Error updating promo code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update promo code' },
      { status: 500 }
    )
  }
}

// DELETE /api/promo-codes/[id] - Delete promo code (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)

    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
    })

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }

    await prisma.promoCode.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Promo code deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting promo code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete promo code' },
      { status: 500 }
    )
  }
}

