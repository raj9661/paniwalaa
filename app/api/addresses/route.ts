import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - prevent static analysis during build
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST /api/addresses - Create a new address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      line1,
      pincode,
      floor,
      isDefault,
    } = body

    // Validate required fields
    if (!userId || !line1 || !pincode || floor === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, line1, pincode, and floor are required' },
        { status: 400 }
      )
    }

    // Validate floor is a number
    if (typeof floor !== 'number' || floor < 0) {
      return NextResponse.json(
        { error: 'Floor must be a non-negative number' },
        { status: 400 }
      )
    }

    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Pincode must be exactly 6 digits' },
        { status: 400 }
      )
    }

    // Check if pincode is deliverable
    const deliverablePincode = await prisma.deliverablePincode.findUnique({
      where: { pincode },
    })

    if (!deliverablePincode || !deliverablePincode.isActive) {
      return NextResponse.json(
        { error: 'We do not deliver to this pincode. Please update your delivery address.' },
        { status: 400 }
      )
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: BigInt(userId) },
        data: { isDefault: false },
      })
    }

    // Create address
    const address = await prisma.address.create({
      data: {
        userId: BigInt(userId),
        line1,
        pincode,
        floor,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({
      address: {
        ...address,
        id: address.id.toString(),
        userId: address.userId.toString(),
      },
      message: 'Address created successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating address:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create address' },
      { status: 500 }
    )
  }
}

// GET /api/addresses - Get addresses for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const addresses = await prisma.address.findMany({
      where: { userId: BigInt(userId) },
      orderBy: [
        { isDefault: 'desc' },
        { id: 'desc' },
      ],
    })

    return NextResponse.json({
      addresses: addresses.map(address => ({
        ...address,
        id: address.id.toString(),
        userId: address.userId.toString(),
      })),
    })
  } catch (error: any) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

// PUT /api/addresses - Update an address
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      line1,
      pincode,
      floor,
      isDefault,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      )
    }

    // Get existing address to get userId
    const existingAddress = await prisma.address.findUnique({
      where: { id: BigInt(id) },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    // If pincode is being updated, validate it
    if (pincode && pincode !== existingAddress.pincode) {
      if (!/^\d{6}$/.test(pincode)) {
        return NextResponse.json(
          { error: 'Pincode must be exactly 6 digits' },
          { status: 400 }
        )
      }

      // Check if new pincode is deliverable
      const deliverablePincode = await prisma.deliverablePincode.findUnique({
        where: { pincode },
      })

      if (!deliverablePincode || !deliverablePincode.isActive) {
        return NextResponse.json(
          { error: 'We do not deliver to this pincode. Please update your delivery address.' },
          { status: 400 }
        )
      }
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { 
          userId: existingAddress.userId,
          id: { not: BigInt(id) },
        },
        data: { isDefault: false },
      })
    }

    // Update address
    const updateData: any = {}
    if (line1 !== undefined) updateData.line1 = line1
    if (pincode !== undefined) updateData.pincode = pincode
    if (floor !== undefined) {
      if (typeof floor !== 'number' || floor < 0) {
        return NextResponse.json(
          { error: 'Floor must be a non-negative number' },
          { status: 400 }
        )
      }
      updateData.floor = floor
    }
    if (isDefault !== undefined) updateData.isDefault = isDefault

    const address = await prisma.address.update({
      where: { id: BigInt(id) },
      data: updateData,
    })

    return NextResponse.json({
      address: {
        ...address,
        id: address.id.toString(),
        userId: address.userId.toString(),
      },
      message: 'Address updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating address:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update address' },
      { status: 500 }
    )
  }
}

// DELETE /api/addresses - Delete an address
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      )
    }

    // Check if address exists
    const address = await prisma.address.findUnique({
      where: { id: BigInt(id) },
    })

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    // Delete address
    await prisma.address.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({
      message: 'Address deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete address' },
      { status: 500 }
    )
  }
}

