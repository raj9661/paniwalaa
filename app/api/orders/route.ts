import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmationEmail } from '@/lib/email'

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      addressId,
      productId,
      qty,
      securityDepositCents,
      floorChargeCents,
      baseTotalCents,
      surgeMultiplier,
      promoCodeId,
      discountCents,
      finalTotalCents,
      paymentMethod,
      paymentStatus,
      utrNumber,
      specialInstructions,
    } = body

    // Validate required fields
    if (!userId || !addressId || !productId || !qty || finalTotalCents === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user and product details
    const [user, product, address] = await Promise.all([
      prisma.user.findUnique({ where: { id: BigInt(userId) } }),
      prisma.product.findUnique({ 
        where: { id: BigInt(productId) },
      }) as Promise<any>,
      prisma.address.findUnique({ where: { id: BigInt(addressId) } }),
    ])

    // If security deposit is not provided but product requires it (and is not one-time purchase), calculate it
    let calculatedSecurityDeposit = securityDepositCents
    if (!calculatedSecurityDeposit && product && !product.isOneTimePurchase && product.securityDepositCents) {
      calculatedSecurityDeposit = Number(product.securityDepositCents) * qty
    }
    // If product is one-time purchase, ensure security deposit is null
    if (product && product.isOneTimePurchase) {
      calculatedSecurityDeposit = null
    }

    if (!user || !product || !address) {
      return NextResponse.json(
        { error: 'Invalid user, product, or address' },
        { status: 400 }
      )
    }

    // Check if pincode is deliverable and get linked dark store
    const deliverablePincode = await (prisma.deliverablePincode.findUnique({
      where: { pincode: address.pincode },
      include: {
        darkStore: true,
      },
    } as any)) as any

    if (!deliverablePincode || !deliverablePincode.isActive) {
      return NextResponse.json(
        { error: 'We do not deliver to this pincode. Please update your delivery address.' },
        { status: 400 }
      )
    }

    // Check if pincode has a linked dark store
    if (!deliverablePincode.darkStoreId || !deliverablePincode.darkStore) {
      return NextResponse.json(
        { error: 'No dark store assigned to this pincode. Please contact support.' },
        { status: 400 }
      )
    }

    const darkStore = deliverablePincode.darkStore as any // Type assertion for darkStore relation

    // Check if dark store is active
    if (!darkStore || !darkStore.isActive) {
      return NextResponse.json(
        { error: 'Dark store is currently inactive. Please try again later.' },
        { status: 400 }
      )
    }

    // Check product-specific inventory availability
    const orderQuantity = parseInt(qty)
    const darkStoreProduct = await (prisma as any).darkStoreProduct.findUnique({
      where: {
        darkStoreId_productId: {
          darkStoreId: darkStore.id,
          productId: BigInt(productId),
        },
      },
    })

    if (!darkStoreProduct) {
      return NextResponse.json(
        { error: 'This product is not available in the dark store serving your area.' },
        { status: 400 }
      )
    }

    if (darkStoreProduct.currentStock < orderQuantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Only ${darkStoreProduct.currentStock} ${product.title} available in stock.` },
        { status: 400 }
      )
    }

    // Update promo code usage count if promo code is used
    if (promoCodeId) {
      await prisma.promoCode.update({
        where: { id: BigInt(promoCodeId) },
        data: {
          usedCount: { increment: 1 },
        },
      })
    }

    // Get site settings for commission rates
    const siteSettings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    }) as any

    // Check if owner self-delivery is enabled and owner is linked to a user account
    let ownerUserId: BigInt | null = null
    let isOwnerDelivering = false
    
    if (darkStore && darkStore.ownerSelfDelivery) {
      // Try to find owner by phone or email
      if (darkStore.ownerPhone) {
        const ownerUser = await prisma.user.findFirst({
          where: {
            phone: darkStore.ownerPhone,
            role: 'delivery_partner',
          },
        })
        if (ownerUser) {
          ownerUserId = ownerUser.id
          isOwnerDelivering = true
        }
      }
      
      // If not found by phone, try email
      if (!ownerUserId && darkStore.ownerEmail) {
        const ownerUser = await prisma.user.findFirst({
          where: {
            email: darkStore.ownerEmail,
            role: 'delivery_partner',
          },
        })
        if (ownerUser) {
          ownerUserId = ownerUser.id
          isOwnerDelivering = true
        }
      }
      
      // If ownerUserId is set in dark store, use it
      if (!ownerUserId && darkStore.ownerUserId) {
        ownerUserId = darkStore.ownerUserId
        isOwnerDelivering = true
      }
    }

    // Calculate delivery partner commission - use product-specific commission or default
    let deliveryPartnerCommissionCents = BigInt(0)
    let commissionPerUnit = 0
    
    // Get commission from product-specific setting, or use default from site settings
    if (product.deliveryCommissionCents) {
      commissionPerUnit = Number(product.deliveryCommissionCents)
    } else {
      // Use default commission from site settings
      commissionPerUnit = siteSettings?.defaultDeliveryPartnerCommissionCents 
        ? Number(siteSettings.defaultDeliveryPartnerCommissionCents) 
        : 1000 // Default ₹10 per unit
    }
    
    // If owner is delivering, add extra commission
    if (isOwnerDelivering && commissionPerUnit > 0) {
      const extraCommissionPerUnit = siteSettings?.darkStoreOwnerSelfDeliveryCommissionCents
        ? Number(siteSettings.darkStoreOwnerSelfDeliveryCommissionCents)
        : 1000 // Default ₹10 extra
      deliveryPartnerCommissionCents = BigInt((commissionPerUnit + extraCommissionPerUnit) * orderQuantity)
    } else if (commissionPerUnit > 0) {
      deliveryPartnerCommissionCents = BigInt(commissionPerUnit * orderQuantity)
    }

    // Calculate dark store earnings (per jar rate if payment model is per_jar)
    let darkStoreEarningsCents = BigInt(0)
    if (darkStore && darkStore.paymentModel === 'per_jar') {
      const perJarRate = Number(darkStore.perJarRateCents) || 500 // ₹5 per jar default
      darkStoreEarningsCents = BigInt(perJarRate * orderQuantity)
    }
    // Note: If payment model is 'rent', dark store owner gets monthly rent, not per order earnings

    // Create order and deduct inventory in a transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // Deduct inventory from product-specific stock
      const stockBefore = darkStoreProduct.currentStock
      const stockAfter = stockBefore - orderQuantity

      // Update product-specific inventory
      await (tx as any).darkStoreProduct.update({
        where: {
          darkStoreId_productId: {
            darkStoreId: darkStore.id,
            productId: BigInt(productId),
          },
        },
        data: {
          currentStock: stockAfter,
        },
      })

      // Create inventory transaction record
      await (tx as any).darkStoreInventoryTransaction.create({
        data: {
          darkStoreId: darkStore.id,
          productId: BigInt(productId),
          type: 'order_deduction',
          quantity: -orderQuantity, // Negative for deduction
          stockBefore,
          stockAfter,
          reason: `Order placed - ${orderQuantity} jar(s)`,
          orderId: null, // Will be updated after order creation
          createdBy: null,
        },
      })

      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: BigInt(userId),
          addressId: BigInt(addressId),
          productId: BigInt(productId),
          qty: orderQuantity,
          securityDepositCents: calculatedSecurityDeposit ? BigInt(calculatedSecurityDeposit) : null,
          floorChargeCents: BigInt(floorChargeCents || 0),
          floorChargeWaivedCents: null,
          deliveryPartnerCommissionCents: deliveryPartnerCommissionCents,
          darkStoreEarningsCents: darkStoreEarningsCents,
          baseTotalCents: BigInt(baseTotalCents || 0),
          surgeMultiplier: surgeMultiplier || 1.0,
          promoCodeId: promoCodeId ? BigInt(promoCodeId) : null,
          discountCents: discountCents ? BigInt(discountCents) : null,
          finalTotalCents: BigInt(finalTotalCents),
          paymentMethod: paymentMethod || 'cod',
          paymentStatus: paymentStatus || (paymentMethod === 'cod' ? 'pending' : 'unverified'),
          utrNumber: utrNumber || null,
          paymentVerified: false,
          darkStoreId: darkStore.id,
          deliveryPersonId: isOwnerDelivering && ownerUserId ? BigInt(ownerUserId.toString()) : null,
          isOwnerDelivered: isOwnerDelivering, // Set to true if owner is delivering
          specialInstructions: specialInstructions || null,
          orderStatus: isOwnerDelivering ? 'assigned' : 'created', // Auto-assign if owner delivering
        } as any,
      })

      // Update inventory transaction with order ID
      await (tx as any).darkStoreInventoryTransaction.updateMany({
        where: {
          darkStoreId: darkStore.id,
          type: 'order_deduction',
          orderId: null,
          createdAt: {
            gte: new Date(Date.now() - 5000), // Within last 5 seconds
          },
        },
        data: {
          orderId: newOrder.id,
        },
      })

      return newOrder
    })

    // Fetch order with relations for response
    const orderWithRelations = await (prisma.order.findUnique({
      where: { id: newOrder.id },
      include: {
        product: true,
        address: true,
        user: true,
        darkStore: true,
      } as any,
    }) as Promise<any>)

    if (!orderWithRelations) {
      return NextResponse.json(
        { error: 'Failed to fetch created order' },
        { status: 500 }
      )
    }

    const order = orderWithRelations

    // Send order confirmation email (don't fail if email fails)
    try {
      if (user.email) {
        const estimatedDelivery = new Date()
        estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 30) // 30 minutes from now

        // Get promo code details if used
        let promoCodeDetails = null
        if (orderWithRelations.promoCodeId) {
          promoCodeDetails = await prisma.promoCode.findUnique({
            where: { id: orderWithRelations.promoCodeId },
          })
        }

        await sendOrderConfirmationEmail(user.email, {
          orderId: orderWithRelations.id.toString(),
          name: user.name || undefined,
          orderDate: orderWithRelations.placedAt.toISOString(),
          items: [{
            productName: product.title,
            quantity: orderWithRelations.qty,
            price: Number(product.priceCents) / 100,
          }],
          subtotal: Number(orderWithRelations.baseTotalCents) / 100,
          floorCharge: Number(orderWithRelations.floorChargeCents) / 100,
          floorChargeWaived: orderWithRelations.floorChargeWaivedCents ? Number(orderWithRelations.floorChargeWaivedCents) / 100 : undefined,
          securityDeposit: orderWithRelations.securityDepositCents ? Number(orderWithRelations.securityDepositCents) / 100 : undefined,
          discount: orderWithRelations.discountCents ? Number(orderWithRelations.discountCents) / 100 : undefined,
          promoCode: promoCodeDetails?.code || undefined,
          total: Number(orderWithRelations.finalTotalCents) / 100,
          deliveryAddress: `${address.line1}, Floor ${address.floor}, Pincode: ${address.pincode}`,
          estimatedDelivery: estimatedDelivery.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }),
        })
      }
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError)
      // Continue even if email fails
    }

    return NextResponse.json({
      order: {
        ...orderWithRelations,
        id: orderWithRelations.id.toString(),
        userId: orderWithRelations.userId.toString(),
        addressId: orderWithRelations.addressId.toString(),
        productId: orderWithRelations.productId.toString(),
        finalTotalCents: orderWithRelations.finalTotalCents.toString(),
        baseTotalCents: orderWithRelations.baseTotalCents.toString(),
        floorChargeCents: orderWithRelations.floorChargeCents.toString(),
        floorChargeWaivedCents: orderWithRelations.floorChargeWaivedCents?.toString(),
        deliveryPartnerCommissionCents: orderWithRelations.deliveryPartnerCommissionCents.toString(),
        darkStoreEarningsCents: (orderWithRelations as any).darkStoreEarningsCents?.toString() || '0',
        discountCents: orderWithRelations.discountCents?.toString(),
        securityDepositCents: orderWithRelations.securityDepositCents?.toString(),
        paymentVerifiedBy: orderWithRelations.paymentVerifiedBy?.toString(),
        darkStoreId: (orderWithRelations as any).darkStoreId?.toString() || null,
        isOwnerDelivered: (orderWithRelations as any).isOwnerDelivered || false,
        darkStore: (orderWithRelations as any).darkStore ? {
          id: (orderWithRelations as any).darkStore.id.toString(),
          name: (orderWithRelations as any).darkStore.name,
          address: (orderWithRelations as any).darkStore.address,
        } : null,
      },
      message: 'Order created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// GET /api/orders - Get orders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (userId) {
      where.userId = BigInt(userId)
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { placedAt: 'desc' },
        include: {
          product: true,
          address: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders: orders.map(order => ({
        ...order,
        id: order.id.toString(),
        userId: order.userId.toString(),
        addressId: order.addressId.toString(),
        productId: order.productId.toString(),
        finalTotalCents: order.finalTotalCents.toString(),
        baseTotalCents: order.baseTotalCents.toString(),
        floorChargeCents: order.floorChargeCents.toString(),
        floorChargeWaivedCents: order.floorChargeWaivedCents?.toString(),
        deliveryPartnerCommissionCents: order.deliveryPartnerCommissionCents.toString(),
        darkStoreEarningsCents: (order as any).darkStoreEarningsCents?.toString() || '0',
        discountCents: order.discountCents?.toString(),
        securityDepositCents: order.securityDepositCents?.toString(),
        paymentVerifiedBy: order.paymentVerifiedBy?.toString(),
        darkStoreId: (order as any).darkStoreId?.toString() || null,
        isOwnerDelivered: (order as any).isOwnerDelivered || false,
        darkStore: (order as any).darkStore ? {
          id: (order as any).darkStore.id.toString(),
          name: (order as any).darkStore.name,
          address: (order as any).darkStore.address,
        } : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

