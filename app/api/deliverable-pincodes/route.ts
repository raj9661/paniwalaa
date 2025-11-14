import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/deliverable-pincodes - Get all deliverable pincodes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pincode = searchParams.get('pincode')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit

    const where: any = {}
    if (pincode) {
      where.pincode = pincode
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [pincodes, total] = await Promise.all([
      prisma.deliverablePincode.findMany({
        where,
        skip,
        take: limit,
        include: {
          darkStore: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
        orderBy: { pincode: 'asc' },
      }),
      prisma.deliverablePincode.count({ where }),
    ])

    return NextResponse.json({
      pincodes: pincodes.map(pc => ({
        ...pc,
        id: pc.id.toString(),
        darkStoreId: pc.darkStoreId?.toString() || null,
        darkStore: pc.darkStore ? {
          id: pc.darkStore.id.toString(),
          name: pc.darkStore.name,
          address: pc.darkStore.address,
        } : null,
        deliveryChargeCents: pc.deliveryChargeCents?.toString() || null,
        createdBy: pc.createdBy?.toString() || null,
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
    console.error('Error fetching deliverable pincodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deliverable pincodes' },
      { status: 500 }
    )
  }
}

// POST /api/deliverable-pincodes - Create new deliverable pincode (super admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      pincode,
      areaName,
      city,
      state,
      isActive,
      deliveryChargeCents,
      estimatedDeliveryMinutes,
      notes,
      darkStoreId,
      createdBy,
    } = body

    // Validate required fields
    if (!pincode) {
      return NextResponse.json(
        { error: 'Pincode is required' },
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

    // Check if pincode already exists
    const existingPincode = await prisma.deliverablePincode.findUnique({
      where: { pincode },
    })

    if (existingPincode) {
      return NextResponse.json(
        { error: 'This pincode is already in the deliverable list' },
        { status: 400 }
      )
    }

    // Validate dark store if provided
    if (darkStoreId) {
      const darkStore = await prisma.darkStore.findUnique({
        where: { id: BigInt(darkStoreId) },
      })
      if (!darkStore) {
        return NextResponse.json(
          { error: 'Dark store not found' },
          { status: 400 }
        )
      }
    }

    // Create deliverable pincode
    const deliverablePincode = await prisma.deliverablePincode.create({
      data: {
        pincode,
        areaName: areaName || null,
        city: city || null,
        state: state || null,
        isActive: isActive !== false,
        deliveryChargeCents: deliveryChargeCents ? BigInt(deliveryChargeCents) : null,
        estimatedDeliveryMinutes: estimatedDeliveryMinutes || null,
        notes: notes || null,
        darkStoreId: darkStoreId ? BigInt(darkStoreId) : null,
        createdBy: createdBy ? BigInt(createdBy) : null,
      },
    })

    return NextResponse.json({
      ...deliverablePincode,
      id: deliverablePincode.id.toString(),
      darkStoreId: deliverablePincode.darkStoreId?.toString() || null,
      deliveryChargeCents: deliverablePincode.deliveryChargeCents?.toString() || null,
      createdBy: deliverablePincode.createdBy?.toString() || null,
      createdAt: deliverablePincode.createdAt.toISOString(),
      updatedAt: deliverablePincode.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating deliverable pincode:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This pincode is already in the deliverable list' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create deliverable pincode' },
      { status: 500 }
    )
  }
}

