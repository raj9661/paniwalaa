import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/dark-stores/[id] - Get a single dark store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)

    const darkStore = await prisma.darkStore.findUnique({
      where: { id },
      include: {
        pincodes: true,
        deliveryPartners: {
          include: {
            darkStore: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        inventoryTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                productType: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            inventoryTransactions: true,
          },
        },
      },
    })

    if (!darkStore) {
      return NextResponse.json(
        { error: 'Dark store not found' },
        { status: 404 }
      )
    }

    // Extract BigInt fields to convert them
    const {
      id: storeId,
      managerId: storeManagerId,
      ownerUserId: storeOwnerUserId,
      rentAmountCents: storeRentAmountCents,
      perJarRateCents: storePerJarRateCents,
      createdAt: storeCreatedAt,
      updatedAt: storeUpdatedAt,
      pincodes: storePincodes,
      deliveryPartners: storeDeliveryPartners,
      inventoryTransactions: storeInventoryTransactions,
      products: storeProducts,
      _count: storeCount,
      ...storeBase
    } = darkStore

    return NextResponse.json({
      ...storeBase,
      id: storeId.toString(),
      managerId: storeManagerId?.toString() || null,
      ownerUserId: storeOwnerUserId?.toString() || null,
      rentAmountCents: storeRentAmountCents?.toString() || null,
      perJarRateCents: storePerJarRateCents.toString(),
      createdAt: storeCreatedAt.toISOString(),
      updatedAt: storeUpdatedAt.toISOString(),
      // Product-specific inventory summary
      totalCurrentStock: storeProducts?.reduce((sum: number, p: any) => sum + p.currentStock, 0) || 0,
      totalMaxCapacity: storeProducts?.reduce((sum: number, p: any) => sum + p.maxStockCapacity, 0) || 0,
      isLowStock: storeProducts?.some((p: any) => p.currentStock <= p.lowStockThreshold) || false,
      stockPercentage: (storeProducts?.reduce((sum: number, p: any) => sum + p.maxStockCapacity, 0) || 0) > 0
        ? ((storeProducts?.reduce((sum: number, p: any) => sum + p.currentStock, 0) || 0) / (storeProducts?.reduce((sum: number, p: any) => sum + p.maxStockCapacity, 0) || 1)) * 100
        : 0,
      products: storeProducts?.map((p: any) => ({
        id: p.id.toString(),
        productId: p.productId.toString(),
        currentStock: p.currentStock,
        maxStockCapacity: p.maxStockCapacity,
        lowStockThreshold: p.lowStockThreshold,
        isLowStock: p.currentStock <= p.lowStockThreshold,
        product: {
          id: p.product.id.toString(),
          title: p.product.title,
          productType: p.product.productType,
        },
      })) || [],
      pincodes: storePincodes?.map((p: any) => ({
        ...p,
        id: p.id.toString(),
        darkStoreId: p.darkStoreId?.toString() || null,
        deliveryChargeCents: p.deliveryChargeCents?.toString() || null,
        createdBy: p.createdBy?.toString() || null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })) || [],
      deliveryPartners: storeDeliveryPartners?.map((dp: any) => ({
        ...dp,
        id: dp.id.toString(),
        darkStoreId: dp.darkStoreId.toString(),
        deliveryPartnerId: dp.deliveryPartnerId.toString(),
        assignedBy: dp.assignedBy?.toString() || null,
        assignedAt: dp.assignedAt.toISOString(),
        updatedAt: dp.updatedAt.toISOString(),
      })) || [],
      inventoryTransactions: storeInventoryTransactions?.map((txn: any) => ({
        ...txn,
        id: txn.id.toString(),
        darkStoreId: txn.darkStoreId.toString(),
        productId: txn.productId?.toString() || null,
        orderId: txn.orderId?.toString() || null,
        createdBy: txn.createdBy?.toString() || null,
        createdAt: txn.createdAt.toISOString(),
      })) || [],
      _count: storeCount,
    })
  } catch (error) {
    console.error('Error fetching dark store:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dark store' },
      { status: 500 }
    )
  }
}

// PUT /api/dark-stores/[id] - Update a dark store
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const body = await request.json()

    const {
      name,
      address,
      pincode,
      latitude,
      longitude,
      phone,
      email,
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerAddress,
      ownerUserId,
      paymentModel,
      rentAmountCents,
      perJarRateCents,
      ownerSelfDelivery,
      managerId,
      deliveryRadiusKm,
      isActive,
      notes,
    } = body

    // Validate pincode format if provided
    if (pincode !== undefined && !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Pincode must be exactly 6 digits' },
        { status: 400 }
      )
    }

    const existingStore = await prisma.darkStore.findUnique({
      where: { id },
    })

    if (!existingStore) {
      return NextResponse.json(
        { error: 'Dark store not found' },
        { status: 404 }
      )
    }


    const darkStore = await prisma.darkStore.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(pincode !== undefined && { pincode }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(ownerName !== undefined && { ownerName }),
        ...(ownerPhone !== undefined && { ownerPhone }),
        ...(ownerEmail !== undefined && { ownerEmail }),
        ...(ownerAddress !== undefined && { ownerAddress }),
        ...(ownerUserId !== undefined && { ownerUserId: ownerUserId ? BigInt(ownerUserId) : null }),
        ...(paymentModel !== undefined && { paymentModel }),
        ...(rentAmountCents !== undefined && { rentAmountCents: rentAmountCents ? BigInt(rentAmountCents) : null }),
        ...(perJarRateCents !== undefined && { perJarRateCents: BigInt(perJarRateCents) }),
        ...(ownerSelfDelivery !== undefined && { ownerSelfDelivery }),
        ...(managerId !== undefined && { managerId: managerId ? BigInt(managerId) : null }),
        ...(deliveryRadiusKm !== undefined && { deliveryRadiusKm: parseFloat(deliveryRadiusKm) }),
        ...(isActive !== undefined && { isActive }),
        ...(notes !== undefined && { notes }),
      },
    })

    // Extract BigInt fields to convert them
    const {
      id: updatedId,
      managerId: updatedManagerId,
      ownerUserId: updatedOwnerUserId,
      rentAmountCents: updatedRentAmountCents,
      perJarRateCents: updatedPerJarRateCents,
      createdAt: updatedCreatedAt,
      updatedAt: updatedUpdatedAt,
      ...updatedBaseStore
    } = darkStore

    return NextResponse.json({
      ...updatedBaseStore,
      id: updatedId.toString(),
      managerId: updatedManagerId?.toString() || null,
      ownerUserId: updatedOwnerUserId?.toString() || null,
      rentAmountCents: updatedRentAmountCents?.toString() || null,
      perJarRateCents: updatedPerJarRateCents.toString(),
      createdAt: updatedCreatedAt.toISOString(),
      updatedAt: updatedUpdatedAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Error updating dark store:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update dark store' },
      { status: 500 }
    )
  }
}

// DELETE /api/dark-stores/[id] - Delete a dark store
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)

    const darkStore = await prisma.darkStore.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            pincodes: true,
          },
        },
      },
    })

    if (!darkStore) {
      return NextResponse.json(
        { error: 'Dark store not found' },
        { status: 404 }
      )
    }

    // Check if dark store has orders or pincodes
    if (darkStore._count.orders > 0 || darkStore._count.pincodes > 0) {
      return NextResponse.json(
        { error: 'Cannot delete dark store with existing orders or pincodes. Deactivate it instead.' },
        { status: 400 }
      )
    }

    await prisma.darkStore.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Dark store deleted successfully' })
  } catch (error) {
    console.error('Error deleting dark store:', error)
    return NextResponse.json(
      { error: 'Failed to delete dark store' },
      { status: 500 }
    )
  }
}

