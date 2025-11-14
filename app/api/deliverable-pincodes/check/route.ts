import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/deliverable-pincodes/check - Check if pincode is deliverable
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pincode } = body

    if (!pincode) {
      return NextResponse.json(
        { error: 'Pincode is required' },
        { status: 400 }
      )
    }

    // Validate pincode format
    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { deliverable: false, error: 'Invalid pincode format. Must be 6 digits.' },
        { status: 400 }
      )
    }

    // Check if pincode is deliverable
    const deliverablePincode = await prisma.deliverablePincode.findUnique({
      where: { pincode },
    })

    if (!deliverablePincode) {
      return NextResponse.json({
        deliverable: false,
        message: 'We currently do not deliver to this pincode. Please check back later or contact support.',
      })
    }

    if (!deliverablePincode.isActive) {
      return NextResponse.json({
        deliverable: false,
        message: 'Delivery to this pincode is temporarily unavailable.',
      })
    }

    return NextResponse.json({
      deliverable: true,
      pincode: deliverablePincode.pincode,
      areaName: deliverablePincode.areaName,
      city: deliverablePincode.city,
      state: deliverablePincode.state,
      deliveryCharge: deliverablePincode.deliveryChargeCents ? Number(deliverablePincode.deliveryChargeCents) / 100 : null,
      estimatedDeliveryMinutes: deliverablePincode.estimatedDeliveryMinutes,
    })
  } catch (error) {
    console.error('Error checking deliverable pincode:', error)
    return NextResponse.json(
      { error: 'Failed to check pincode' },
      { status: 500 }
    )
  }
}

