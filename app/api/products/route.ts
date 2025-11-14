import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productType = searchParams.get('productType')
    const availableOnly = searchParams.get('availableOnly') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit

    const where: any = {}
    if (productType) {
      where.productType = productType
    }
    if (availableOnly) {
      where.isAvailable = true
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products: products.map(product => ({
        ...product,
        id: product.id.toString(),
        priceCents: product.priceCents.toString(),
        securityDepositCents: product.securityDepositCents?.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    if (!title || !productType || priceCents === undefined) {
      return NextResponse.json(
        { error: 'Title, product type, and price are required' },
        { status: 400 }
      )
    }

    // Validate product type
    const validTypes = ['20L_jar', '10L_jar', 'water_dispenser']
    if (!validTypes.includes(productType)) {
      return NextResponse.json(
        { error: 'Invalid product type. Must be one of: 20L_jar, 10L_jar, water_dispenser' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        title,
        description,
        productType,
        imageUrl,
        priceCents: BigInt(priceCents),
        securityDepositCents: securityDepositCents ? BigInt(securityDepositCents) : null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        isOneTimePurchase: isOneTimePurchase !== undefined ? isOneTimePurchase : false,
        volumeMl,
        brand,
      },
    })

    return NextResponse.json({
      ...product,
      id: product.id.toString(),
      priceCents: product.priceCents.toString(),
      securityDepositCents: product.securityDepositCents?.toString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

