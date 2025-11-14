import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/dark-stores/[id]/products - Get all products for a dark store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)

    const darkStore = await prisma.darkStore.findUnique({
      where: { id },
    })

    if (!darkStore) {
      return NextResponse.json(
        { error: 'Dark store not found' },
        { status: 404 }
      )
    }

    const products = await prisma.darkStoreProduct.findMany({
      where: { darkStoreId: id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            productType: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      products: products.map((dp) => ({
        id: dp.id.toString(),
        darkStoreId: dp.darkStoreId.toString(),
        productId: dp.productId.toString(),
        currentStock: dp.currentStock,
        maxStockCapacity: dp.maxStockCapacity,
        lowStockThreshold: dp.lowStockThreshold,
        isLowStock: dp.currentStock <= dp.lowStockThreshold,
        stockPercentage: dp.maxStockCapacity > 0
          ? (dp.currentStock / dp.maxStockCapacity) * 100
          : 0,
        product: {
          id: dp.product.id.toString(),
          title: dp.product.title,
          productType: dp.product.productType,
          imageUrl: dp.product.imageUrl,
        },
        createdAt: dp.createdAt.toISOString(),
        updatedAt: dp.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching dark store products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dark store products' },
      { status: 500 }
    )
  }
}

// POST /api/dark-stores/[id]/products - Add or update a product in dark store
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const body = await request.json()
    const { productId, maxStockCapacity, lowStockThreshold, currentStock } = body

    if (!productId || !maxStockCapacity || !lowStockThreshold) {
      return NextResponse.json(
        { error: 'Product ID, max stock capacity, and low stock threshold are required' },
        { status: 400 }
      )
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: BigInt(productId) },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Validate dark store exists
    const darkStore = await prisma.darkStore.findUnique({
      where: { id },
    })

    if (!darkStore) {
      return NextResponse.json(
        { error: 'Dark store not found' },
        { status: 404 }
      )
    }

    // Check if product already exists in this dark store
    const existingProduct = await prisma.darkStoreProduct.findUnique({
      where: {
        darkStoreId_productId: {
          darkStoreId: id,
          productId: BigInt(productId),
        },
      },
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product already exists in this dark store. Use PUT to update.' },
        { status: 400 }
      )
    }

    // Validate currentStock if provided
    const initialStock = currentStock ? parseInt(currentStock) : 0
    if (initialStock > parseInt(maxStockCapacity)) {
      return NextResponse.json(
        { error: 'Current stock cannot exceed max stock capacity' },
        { status: 400 }
      )
    }

    const darkStoreProduct = await prisma.darkStoreProduct.create({
      data: {
        darkStoreId: id,
        productId: BigInt(productId),
        currentStock: initialStock,
        maxStockCapacity: parseInt(maxStockCapacity),
        lowStockThreshold: parseInt(lowStockThreshold),
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            productType: true,
            imageUrl: true,
          },
        },
      },
    })

    // Create initial inventory transaction if stock is added
    if (initialStock > 0) {
      await prisma.darkStoreInventoryTransaction.create({
        data: {
          darkStoreId: id,
          productId: BigInt(productId),
          type: 'stock_in',
          quantity: initialStock,
          stockBefore: 0,
          stockAfter: initialStock,
          reason: 'Initial stock setup',
        },
      })
    }

    return NextResponse.json({
      id: darkStoreProduct.id.toString(),
      darkStoreId: darkStoreProduct.darkStoreId.toString(),
      productId: darkStoreProduct.productId.toString(),
      currentStock: darkStoreProduct.currentStock,
      maxStockCapacity: darkStoreProduct.maxStockCapacity,
      lowStockThreshold: darkStoreProduct.lowStockThreshold,
      isLowStock: darkStoreProduct.currentStock <= darkStoreProduct.lowStockThreshold,
      stockPercentage: darkStoreProduct.maxStockCapacity > 0
        ? (darkStoreProduct.currentStock / darkStoreProduct.maxStockCapacity) * 100
        : 0,
      product: {
        id: darkStoreProduct.product.id.toString(),
        title: darkStoreProduct.product.title,
        productType: darkStoreProduct.product.productType,
        imageUrl: darkStoreProduct.product.imageUrl,
      },
      createdAt: darkStoreProduct.createdAt.toISOString(),
      updatedAt: darkStoreProduct.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error adding product to dark store:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add product to dark store' },
      { status: 500 }
    )
  }
}

