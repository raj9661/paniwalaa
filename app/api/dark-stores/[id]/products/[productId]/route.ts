import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/dark-stores/[id]/products/[productId] - Update product inventory settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const { id: idParam, productId: productIdParam } = await params
    const id = BigInt(idParam)
    const productId = BigInt(productIdParam)
    const body = await request.json()
    const { maxStockCapacity, lowStockThreshold } = body

    if (maxStockCapacity === undefined || lowStockThreshold === undefined) {
      return NextResponse.json(
        { error: 'Max stock capacity and low stock threshold are required' },
        { status: 400 }
      )
    }

    const darkStoreProduct = await prisma.darkStoreProduct.findUnique({
      where: {
        darkStoreId_productId: {
          darkStoreId: id,
          productId,
        },
      },
    })

    if (!darkStoreProduct) {
      return NextResponse.json(
        { error: 'Product not found in this dark store' },
        { status: 404 }
      )
    }

    // Validate current stock doesn't exceed new max capacity
    if (darkStoreProduct.currentStock > parseInt(maxStockCapacity)) {
      return NextResponse.json(
        { error: `Current stock (${darkStoreProduct.currentStock}) cannot exceed max stock capacity (${maxStockCapacity})` },
        { status: 400 }
      )
    }

    const updated = await prisma.darkStoreProduct.update({
      where: {
        darkStoreId_productId: {
          darkStoreId: id,
          productId,
        },
      },
      data: {
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

    return NextResponse.json({
      id: updated.id.toString(),
      darkStoreId: updated.darkStoreId.toString(),
      productId: updated.productId.toString(),
      currentStock: updated.currentStock,
      maxStockCapacity: updated.maxStockCapacity,
      lowStockThreshold: updated.lowStockThreshold,
      isLowStock: updated.currentStock <= updated.lowStockThreshold,
      stockPercentage: updated.maxStockCapacity > 0
        ? (updated.currentStock / updated.maxStockCapacity) * 100
        : 0,
      product: {
        id: updated.product.id.toString(),
        title: updated.product.title,
        productType: updated.product.productType,
        imageUrl: updated.product.imageUrl,
      },
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Error updating dark store product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update dark store product' },
      { status: 500 }
    )
  }
}

// DELETE /api/dark-stores/[id]/products/[productId] - Remove product from dark store
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const { id: idParam, productId: productIdParam } = await params
    const id = BigInt(idParam)
    const productId = BigInt(productIdParam)

    const darkStoreProduct = await prisma.darkStoreProduct.findUnique({
      where: {
        darkStoreId_productId: {
          darkStoreId: id,
          productId,
        },
      },
    })

    if (!darkStoreProduct) {
      return NextResponse.json(
        { error: 'Product not found in this dark store' },
        { status: 404 }
      )
    }

    // Only allow deletion if current stock is 0
    if (darkStoreProduct.currentStock > 0) {
      return NextResponse.json(
        { error: 'Cannot remove product with existing stock. Please remove all stock first.' },
        { status: 400 }
      )
    }

    await prisma.darkStoreProduct.delete({
      where: {
        darkStoreId_productId: {
          darkStoreId: id,
          productId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing product from dark store:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove product from dark store' },
      { status: 500 }
    )
  }
}

