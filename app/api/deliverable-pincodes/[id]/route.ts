import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/deliverable-pincodes/[id] - Get single deliverable pincode
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const pincode = await prisma.deliverablePincode.findUnique({
      where: { id },
      include: {
        darkStore: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    })

    if (!pincode) {
      return NextResponse.json(
        { error: 'Deliverable pincode not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...pincode,
      id: pincode.id.toString(),
      darkStoreId: pincode.darkStoreId?.toString() || null,
      darkStore: pincode.darkStore ? {
        id: pincode.darkStore.id.toString(),
        name: pincode.darkStore.name,
        address: pincode.darkStore.address,
      } : null,
      deliveryChargeCents: pincode.deliveryChargeCents?.toString() || null,
      createdBy: pincode.createdBy?.toString() || null,
      createdAt: pincode.createdAt.toISOString(),
      updatedAt: pincode.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching deliverable pincode:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deliverable pincode' },
      { status: 500 }
    )
  }
}

// PUT /api/deliverable-pincodes/[id] - Update deliverable pincode (super admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
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
    } = body

    const deliverablePincode = await prisma.deliverablePincode.findUnique({
      where: { id },
    })

    if (!deliverablePincode) {
      return NextResponse.json(
        { error: 'Deliverable pincode not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (pincode !== undefined) {
      if (!/^\d{6}$/.test(pincode)) {
        return NextResponse.json(
          { error: 'Pincode must be exactly 6 digits' },
          { status: 400 }
        )
      }
      updateData.pincode = pincode
    }
    if (areaName !== undefined) updateData.areaName = areaName
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (isActive !== undefined) updateData.isActive = isActive
    if (deliveryChargeCents !== undefined) updateData.deliveryChargeCents = deliveryChargeCents ? BigInt(deliveryChargeCents) : null
    if (estimatedDeliveryMinutes !== undefined) updateData.estimatedDeliveryMinutes = estimatedDeliveryMinutes
    if (notes !== undefined) updateData.notes = notes
    if (darkStoreId !== undefined) {
      if (darkStoreId) {
        // Validate dark store exists
        const darkStore = await prisma.darkStore.findUnique({
          where: { id: BigInt(darkStoreId) },
        })
        if (!darkStore) {
          return NextResponse.json(
            { error: 'Dark store not found' },
            { status: 400 }
          )
        }
        updateData.darkStoreId = BigInt(darkStoreId)
      } else {
        updateData.darkStoreId = null
      }
    }

    const updated = await prisma.deliverablePincode.update({
      where: { id },
      data: updateData,
    })

    // Fetch updated pincode with dark store
    const updatedWithStore = await prisma.deliverablePincode.findUnique({
      where: { id },
      include: {
        darkStore: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...updatedWithStore,
      id: updatedWithStore!.id.toString(),
      darkStoreId: updatedWithStore!.darkStoreId?.toString() || null,
      darkStore: updatedWithStore!.darkStore ? {
        id: updatedWithStore!.darkStore.id.toString(),
        name: updatedWithStore!.darkStore.name,
        address: updatedWithStore!.darkStore.address,
      } : null,
      deliveryChargeCents: updatedWithStore!.deliveryChargeCents?.toString() || null,
      createdBy: updatedWithStore!.createdBy?.toString() || null,
      createdAt: updatedWithStore!.createdAt.toISOString(),
      updatedAt: updatedWithStore!.updatedAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Error updating deliverable pincode:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This pincode already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update deliverable pincode' },
      { status: 500 }
    )
  }
}

// DELETE /api/deliverable-pincodes/[id] - Delete deliverable pincode (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)

    const deliverablePincode = await prisma.deliverablePincode.findUnique({
      where: { id },
    })

    if (!deliverablePincode) {
      return NextResponse.json(
        { error: 'Deliverable pincode not found' },
        { status: 404 }
      )
    }

    await prisma.deliverablePincode.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Deliverable pincode deleted successfully' })
  } catch (error) {
    console.error('Error deleting deliverable pincode:', error)
    return NextResponse.json(
      { error: 'Failed to delete deliverable pincode' },
      { status: 500 }
    )
  }
}

