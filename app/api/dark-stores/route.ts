import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/dark-stores - Get all dark stores
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeLowStock = searchParams.get('includeLowStock') === 'true'
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where: any = {}
    if (activeOnly) {
      where.isActive = true
    }

    const darkStores = await prisma.darkStore.findMany({
      where,
      include: {
        pincodes: {
          select: {
            id: true,
            pincode: true,
            areaName: true,
            isActive: true,
            darkStoreId: true,
          },
        },
        deliveryPartners: {
          where: { isActive: true },
          select: {
            id: true,
            deliveryPartnerId: true,
            pincodes: true,
          },
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
      orderBy: { createdAt: 'desc' },
    })

    // Filter low stock if requested (based on product-specific inventory)
    let filteredStores = darkStores
    if (includeLowStock) {
      filteredStores = darkStores.filter((store) => {
        // Check if any product in this store has low stock
        return store.products?.some((p: any) => p.currentStock <= p.lowStockThreshold) || false
      })
    }

    return NextResponse.json({
      darkStores: filteredStores.map((store) => {
        // Extract base fields without nested relations and BigInt fields
        const {
          pincodes,
          deliveryPartners,
          products,
          _count,
          id,
          managerId,
          ownerUserId,
          rentAmountCents,
          perJarRateCents,
          createdAt,
          updatedAt,
          ...baseStore
        } = store

        // Calculate product-specific inventory totals
        const totalCurrentStock = products?.reduce((sum: number, p: any) => sum + p.currentStock, 0) || 0
        const totalMaxCapacity = products?.reduce((sum: number, p: any) => sum + p.maxStockCapacity, 0) || 0
        const hasLowStock = products?.some((p: any) => p.currentStock <= p.lowStockThreshold) || false
        const lowStockProducts = products?.filter((p: any) => p.currentStock <= p.lowStockThreshold) || []

        return {
          ...baseStore,
          id: id.toString(),
          managerId: managerId?.toString() || null,
          ownerUserId: ownerUserId?.toString() || null,
          rentAmountCents: rentAmountCents?.toString() || null,
          perJarRateCents: perJarRateCents.toString(),
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
          // Product-specific inventory summary
          totalCurrentStock,
          totalMaxCapacity,
          isLowStock: hasLowStock,
          stockPercentage: totalMaxCapacity > 0 
            ? (totalCurrentStock / totalMaxCapacity) * 100 
            : 0,
          products: products?.map((p: any) => ({
            id: p.id.toString(),
            productId: p.productId.toString(),
            currentStock: p.currentStock,
            maxStockCapacity: p.maxStockCapacity,
            lowStockThreshold: p.lowStockThreshold,
            isLowStock: p.currentStock <= p.lowStockThreshold,
            stockPercentage: p.maxStockCapacity > 0 
              ? (p.currentStock / p.maxStockCapacity) * 100 
              : 0,
            product: {
              id: p.product.id.toString(),
              title: p.product.title,
              productType: p.product.productType,
            },
          })) || [],
          lowStockProducts: lowStockProducts.map((p: any) => ({
            productTitle: p.product.title,
            currentStock: p.currentStock,
            threshold: p.lowStockThreshold,
          })),
          pincodes: pincodes?.map((p: any) => ({
            id: p.id.toString(),
            pincode: p.pincode,
            areaName: p.areaName,
            isActive: p.isActive,
            darkStoreId: p.darkStoreId?.toString() || null,
          })) || [],
          deliveryPartners: deliveryPartners?.map((dp: any) => ({
            id: dp.id.toString(),
            darkStoreId: dp.darkStoreId.toString(),
            deliveryPartnerId: dp.deliveryPartnerId.toString(),
            pincodes: dp.pincodes,
          })) || [],
          _count: _count,
        }
      }),
      lowStockCount: filteredStores.filter((store) => 
        store.products?.some((p: any) => p.currentStock <= p.lowStockThreshold)
      ).length,
    })
  } catch (error) {
    console.error('Error fetching dark stores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dark stores' },
      { status: 500 }
    )
  }
}

// POST /api/dark-stores - Create a new dark store
export async function POST(request: NextRequest) {
  try {
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
      maxStockCapacity,
      lowStockThreshold,
      managerId,
      deliveryRadiusKm,
      isActive,
      notes,
      createdBy,
    } = body

    if (!name || !address || !pincode || !ownerName || !ownerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Validate payment model
    if (paymentModel === 'rent' && !rentAmountCents) {
      return NextResponse.json(
        { error: 'Rent amount is required when payment model is rent' },
        { status: 400 }
      )
    }

    const darkStore = await prisma.darkStore.create({
      data: {
        name,
        address,
        pincode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        phone: phone || null,
        email: email || null,
        ownerName,
        ownerPhone,
        ownerEmail: ownerEmail || null,
        ownerAddress: ownerAddress || null,
        ownerUserId: ownerUserId ? BigInt(ownerUserId) : null,
        paymentModel: paymentModel || 'per_jar',
        rentAmountCents: paymentModel === 'rent' && rentAmountCents ? BigInt(rentAmountCents) : null,
        perJarRateCents: perJarRateCents ? BigInt(perJarRateCents) : BigInt(500),
        ownerSelfDelivery: ownerSelfDelivery || false,
        currentInventory: 0, // Keep for backward compatibility, but not used
        maxStockCapacity: 0, // Keep for backward compatibility, but not used
        lowStockThreshold: 0, // Keep for backward compatibility, but not used
        managerId: managerId ? BigInt(managerId) : null,
        deliveryRadiusKm: deliveryRadiusKm ? parseFloat(deliveryRadiusKm) : 3.0,
        isActive: isActive !== undefined ? isActive : true,
        notes: notes || null,
      },
    })

    return NextResponse.json({
      ...darkStore,
      id: darkStore.id.toString(),
      managerId: darkStore.managerId?.toString() || null,
      rentAmountCents: darkStore.rentAmountCents?.toString() || null,
      perJarRateCents: darkStore.perJarRateCents.toString(),
      createdAt: darkStore.createdAt.toISOString(),
      updatedAt: darkStore.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating dark store:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create dark store' },
      { status: 500 }
    )
  }
}

