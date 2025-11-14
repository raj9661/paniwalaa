import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/dark-stores/[id]/inventory - Get inventory transactions for a dark store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const darkStore = await prisma.darkStore.findUnique({
      where: { id },
    })

    if (!darkStore) {
      return NextResponse.json(
        { error: 'Dark store not found' },
        { status: 404 }
      )
    }

    const [transactions, total] = await Promise.all([
      prisma.darkStoreInventoryTransaction.findMany({
        where: { darkStoreId: id },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              productType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.darkStoreInventoryTransaction.count({
        where: { darkStoreId: id },
      }),
    ])

    return NextResponse.json({
      transactions: transactions.map((txn) => ({
        ...txn,
        id: txn.id.toString(),
        darkStoreId: txn.darkStoreId.toString(),
        productId: txn.productId?.toString() || null,
        product: txn.product ? {
          id: txn.product.id.toString(),
          title: txn.product.title,
          productType: txn.product.productType,
        } : null,
        orderId: txn.orderId?.toString() || null,
        createdBy: txn.createdBy?.toString() || null,
        createdAt: txn.createdAt.toISOString(),
      })),
      darkStore: {
        id: darkStore.id.toString(),
        name: darkStore.name,
        currentInventory: darkStore.currentInventory,
        maxStockCapacity: darkStore.maxStockCapacity,
        lowStockThreshold: darkStore.lowStockThreshold,
        isLowStock: darkStore.currentInventory <= darkStore.lowStockThreshold,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching inventory transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory transactions' },
      { status: 500 }
    )
  }
}

// POST /api/dark-stores/[id]/inventory - Add or remove inventory
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const body = await request.json()
    const { type, quantity, reason, productId, createdBy } = body

    if (!type || !quantity || quantity === 0) {
      return NextResponse.json(
        { error: 'Type and quantity are required' },
        { status: 400 }
      )
    }

    // Product ID is required for all inventory transactions now
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required for inventory transactions' },
        { status: 400 }
      )
    }

    const darkStore = await prisma.darkStore.findUnique({
      where: { id },
    })

    if (!darkStore) {
      return NextResponse.json(
        { error: 'Dark store not found' },
        { status: 404 }
      )
    }

    // Get or create product-specific inventory
    let darkStoreProduct = await prisma.darkStoreProduct.findUnique({
      where: {
        darkStoreId_productId: {
          darkStoreId: id,
          productId: BigInt(productId),
        },
      },
    })

    if (!darkStoreProduct) {
      return NextResponse.json(
        { error: 'Product not configured in this dark store. Please add the product first with max capacity and low stock threshold.' },
        { status: 400 }
      )
    }

    const stockBefore = darkStoreProduct.currentStock
    let stockAfter = stockBefore

    // Calculate new stock
    if (type === 'stock_in' || type === 'adjustment') {
      stockAfter = stockBefore + parseInt(quantity)
      // Validate against max capacity
      if (stockAfter > darkStoreProduct.maxStockCapacity) {
        return NextResponse.json(
          { error: `Cannot add ${quantity} jars. Maximum capacity is ${darkStoreProduct.maxStockCapacity}. Current stock: ${stockBefore}. Maximum that can be added: ${darkStoreProduct.maxStockCapacity - stockBefore}` },
          { status: 400 }
        )
      }
    } else if (type === 'stock_out') {
      stockAfter = stockBefore - parseInt(quantity)
      if (stockAfter < 0) {
        return NextResponse.json(
          { error: `Cannot remove ${quantity} jars. Current stock is only ${stockBefore}` },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid transaction type. Use stock_in, stock_out, or adjustment' },
        { status: 400 }
      )
    }

    // Create transaction and update inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create inventory transaction
      const transaction = await tx.darkStoreInventoryTransaction.create({
        data: {
          darkStoreId: id,
          productId: BigInt(productId),
          type,
          quantity: parseInt(quantity),
          stockBefore,
          stockAfter,
          reason: reason || null,
          createdBy: createdBy ? BigInt(createdBy) : null,
        },
      })

      // Update product-specific inventory
      await tx.darkStoreProduct.update({
        where: {
          darkStoreId_productId: {
            darkStoreId: id,
            productId: BigInt(productId),
          },
        },
        data: {
          currentStock: stockAfter,
        },
      })

      return transaction
    })

    // Fetch product details if productId was provided
    let product = null
    if (productId) {
      const productData = await prisma.product.findUnique({
        where: { id: BigInt(productId) },
        select: {
          id: true,
          title: true,
          productType: true,
        },
      })
      if (productData) {
        product = {
          id: productData.id.toString(),
          title: productData.title,
          productType: productData.productType,
        }
      }
    }

    return NextResponse.json({
      ...result,
      id: result.id.toString(),
      darkStoreId: result.darkStoreId.toString(),
      productId: result.productId?.toString() || null,
      product,
      createdBy: result.createdBy?.toString() || null,
      createdAt: result.createdAt.toISOString(),
      stockBefore,
      stockAfter,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    )
  }
}

