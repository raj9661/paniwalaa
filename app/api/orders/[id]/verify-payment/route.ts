import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/orders/[id]/verify-payment - Verify or reject payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { verified, verifiedBy, notes } = body

    if (verified === undefined) {
      return NextResponse.json(
        { error: 'verified status is required' },
        { status: 400 }
      )
    }

    const { id: idParam } = await params
    const orderId = BigInt(idParam)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Update order payment status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentVerified: verified,
        paymentStatus: verified ? 'verified' : 'failed',
        paymentVerifiedBy: verifiedBy ? BigInt(verifiedBy) : null,
        paymentVerifiedAt: verified ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: true,
        address: true,
      },
    })

    return NextResponse.json({
      ...updatedOrder,
      id: updatedOrder.id.toString(),
      userId: updatedOrder.userId.toString(),
      addressId: updatedOrder.addressId.toString(),
      productId: updatedOrder.productId.toString(),
      paymentVerifiedBy: updatedOrder.paymentVerifiedBy?.toString(),
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

