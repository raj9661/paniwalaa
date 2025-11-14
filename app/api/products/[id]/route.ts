import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...product,
      id: product.id.toString(),
      priceCents: product.priceCents.toString(),
      securityDepositCents: product.securityDepositCents?.toString(),
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const body = await request.json()
    const {
      title,
      description,
      productType,
      imageUrl,
      priceCents,
      securityDepositCents,
      isAvailable,
      isOneTimePurchase,
      volumeMl,
      brand,
    } = body

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Validate product type if provided
    if (productType) {
      const validTypes = ['20L_jar', '10L_jar', 'water_dispenser']
      if (!validTypes.includes(productType)) {
        return NextResponse.json(
          { error: 'Invalid product type. Must be one of: 20L_jar, 10L_jar, water_dispenser' },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(productType !== undefined && { productType }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(priceCents !== undefined && { priceCents: BigInt(priceCents) }),
        ...(securityDepositCents !== undefined && { 
          securityDepositCents: securityDepositCents ? BigInt(securityDepositCents) : null 
        }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(isOneTimePurchase !== undefined && { isOneTimePurchase }),
        ...(volumeMl !== undefined && { volumeMl }),
        ...(brand !== undefined && { brand }),
      },
    })

    return NextResponse.json({
      ...product,
      id: product.id.toString(),
      priceCents: product.priceCents.toString(),
      securityDepositCents: product.securityDepositCents?.toString(),
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product is used in any orders
    const orderCount = await prisma.order.count({
      where: { productId: id },
    })

    if (orderCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product that has been ordered. Mark as unavailable instead.' },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}

