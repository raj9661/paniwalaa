import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/[id] - Get a single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(params.id) },
      include: {
        product: true,
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        promoCode: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      order: {
        ...order,
        id: order.id.toString(),
        userId: order.userId.toString(),
        addressId: order.addressId.toString(),
        productId: order.productId.toString(),
        finalTotalCents: order.finalTotalCents.toString(),
        baseTotalCents: order.baseTotalCents.toString(),
        floorChargeCents: order.floorChargeCents.toString(),
        floorChargeWaivedCents: order.floorChargeWaivedCents?.toString(),
        discountCents: order.discountCents?.toString(),
        securityDepositCents: order.securityDepositCents?.toString(),
        paymentVerifiedBy: order.paymentVerifiedBy?.toString(),
        promoCodeId: order.promoCodeId?.toString(),
      },
    })
  } catch (error: any) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - Update an order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      floorChargeWaivedCents,
      discountCents,
      orderStatus,
      updatedBy,
    } = body

    // Get existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id: BigInt(params.id) },
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Calculate new final total if floor charge is being waived or discount is being updated
    let newFinalTotalCents = BigInt(existingOrder.finalTotalCents)
    
    // If floor charge is being waived
    if (floorChargeWaivedCents !== undefined) {
      const waivedAmount = BigInt(floorChargeWaivedCents || 0)
      const currentWaived = existingOrder.floorChargeWaivedCents || BigInt(0)
      const waivedDifference = waivedAmount - currentWaived
      
      // Adjust final total (subtract the difference)
      newFinalTotalCents = newFinalTotalCents - waivedDifference
    }

    // If discount is being updated
    if (discountCents !== undefined) {
      const newDiscount = BigInt(discountCents || 0)
      const currentDiscount = existingOrder.discountCents || BigInt(0)
      const discountDifference = newDiscount - currentDiscount
      
      // Adjust final total (subtract the difference, as discount reduces total)
      newFinalTotalCents = newFinalTotalCents - discountDifference
    }

    // Ensure final total doesn't go negative
    if (newFinalTotalCents < 0) {
      newFinalTotalCents = BigInt(0)
    }

    // Update order
    const updateData: any = {}
    if (floorChargeWaivedCents !== undefined) {
      updateData.floorChargeWaivedCents = BigInt(floorChargeWaivedCents || 0)
    }
    if (discountCents !== undefined) {
      updateData.discountCents = discountCents ? BigInt(discountCents) : null
    }
    if (orderStatus !== undefined) {
      updateData.orderStatus = orderStatus
    }
    updateData.finalTotalCents = newFinalTotalCents

    const order = await prisma.order.update({
      where: { id: BigInt(params.id) },
      data: updateData,
      include: {
        product: true,
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        promoCode: true,
      },
    })

    return NextResponse.json({
      order: {
        ...order,
        id: order.id.toString(),
        userId: order.userId.toString(),
        addressId: order.addressId.toString(),
        productId: order.productId.toString(),
        finalTotalCents: order.finalTotalCents.toString(),
        baseTotalCents: order.baseTotalCents.toString(),
        floorChargeCents: order.floorChargeCents.toString(),
        floorChargeWaivedCents: order.floorChargeWaivedCents?.toString(),
        discountCents: order.discountCents?.toString(),
        securityDepositCents: order.securityDepositCents?.toString(),
        paymentVerifiedBy: order.paymentVerifiedBy?.toString(),
        promoCodeId: order.promoCodeId?.toString(),
      },
      message: 'Order updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}

