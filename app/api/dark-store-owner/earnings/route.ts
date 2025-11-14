import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/dark-store-owner/earnings - Get earnings for dark store owner
export async function GET(request: NextRequest) {
  try {
    // Get user from session (this should be called from authenticated route)
    // For now, we'll get userId from query params, but in production use session
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Find dark stores owned by this user
    const darkStores = await prisma.darkStore.findMany({
      where: {
        ownerUserId: BigInt(userId),
      },
      select: {
        id: true,
        name: true,
        paymentModel: true,
        perJarRateCents: true,
      },
    })

    if (darkStores.length === 0) {
      return NextResponse.json({
        deliveryEarnings: {
          total: 0,
          today: 0,
          thisMonth: 0,
          orders: [],
        },
        darkStoreEarnings: {
          total: 0,
          today: 0,
          thisMonth: 0,
          orders: [],
        },
        totalEarnings: 0,
        darkStores: [],
      })
    }

    const darkStoreIds = darkStores.map(ds => ds.id)

    // Get all orders from these dark stores
    const allOrders = await prisma.order.findMany({
      where: {
        darkStoreId: { in: darkStoreIds },
        orderStatus: 'delivered',
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            productType: true,
          },
        },
        darkStore: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        deliveredAt: 'desc',
      },
    })

    // Get orders delivered by this user (as delivery partner)
    const deliveredOrders = await prisma.order.findMany({
      where: {
        deliveryPersonId: BigInt(userId),
        orderStatus: 'delivered',
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            productType: true,
          },
        },
        darkStore: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        deliveredAt: 'desc',
      },
    })

    // Calculate delivery earnings
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const deliveryEarningsTotal = deliveredOrders.reduce((sum, order) => {
      return sum + Number(order.deliveryPartnerCommissionCents)
    }, 0) / 100

    const deliveryEarningsToday = deliveredOrders
      .filter(order => order.deliveredAt && new Date(order.deliveredAt) >= todayStart)
      .reduce((sum, order) => {
        return sum + Number(order.deliveryPartnerCommissionCents)
      }, 0) / 100

    const deliveryEarningsThisMonth = deliveredOrders
      .filter(order => order.deliveredAt && new Date(order.deliveredAt) >= monthStart)
      .reduce((sum, order) => {
        return sum + Number(order.deliveryPartnerCommissionCents)
      }, 0) / 100

    // Calculate dark store earnings (only for per_jar payment model)
    const darkStoreEarningsTotal = allOrders
      .filter(order => {
        const darkStore = darkStores.find(ds => ds.id.toString() === order.darkStoreId?.toString())
        return darkStore?.paymentModel === 'per_jar'
      })
      .reduce((sum, order) => {
        return sum + Number(order.darkStoreEarningsCents)
      }, 0) / 100

    const darkStoreEarningsToday = allOrders
      .filter(order => {
        const darkStore = darkStores.find(ds => ds.id.toString() === order.darkStoreId?.toString())
        return darkStore?.paymentModel === 'per_jar' && order.deliveredAt && new Date(order.deliveredAt) >= todayStart
      })
      .reduce((sum, order) => {
        return sum + Number(order.darkStoreEarningsCents)
      }, 0) / 100

    const darkStoreEarningsThisMonth = allOrders
      .filter(order => {
        const darkStore = darkStores.find(ds => ds.id.toString() === order.darkStoreId?.toString())
        return darkStore?.paymentModel === 'per_jar' && order.deliveredAt && new Date(order.deliveredAt) >= monthStart
      })
      .reduce((sum, order) => {
        return sum + Number(order.darkStoreEarningsCents)
      }, 0) / 100

    return NextResponse.json({
      deliveryEarnings: {
        total: deliveryEarningsTotal,
        today: deliveryEarningsToday,
        thisMonth: deliveryEarningsThisMonth,
        orders: deliveredOrders.map(order => ({
          id: order.id.toString(),
          orderId: `ORD-${order.id.toString().slice(-6)}`,
          product: {
            id: order.product.id.toString(),
            title: order.product.title,
            productType: order.product.productType,
          },
          qty: order.qty,
          commission: Number(order.deliveryPartnerCommissionCents) / 100,
          customer: order.user.name || 'Unknown',
          customerPhone: order.user.phone || '',
          deliveredAt: order.deliveredAt?.toISOString(),
        })),
      },
      darkStoreEarnings: {
        total: darkStoreEarningsTotal,
        today: darkStoreEarningsToday,
        thisMonth: darkStoreEarningsThisMonth,
        orders: allOrders
          .filter(order => {
            const darkStore = darkStores.find(ds => ds.id.toString() === order.darkStoreId?.toString())
            return darkStore?.paymentModel === 'per_jar'
          })
          .map(order => {
            const darkStore = darkStores.find(ds => ds.id.toString() === order.darkStoreId?.toString())
            return {
              id: order.id.toString(),
              orderId: `ORD-${order.id.toString().slice(-6)}`,
              darkStore: {
                id: order.darkStore?.id.toString() || '',
                name: order.darkStore?.name || '',
              },
              product: {
                id: order.product.id.toString(),
                title: order.product.title,
                productType: order.product.productType,
              },
              qty: order.qty,
              earnings: Number(order.darkStoreEarningsCents) / 100,
              perJarRate: darkStore ? Number(darkStore.perJarRateCents) / 100 : 0,
              customer: order.user.name || 'Unknown',
              customerPhone: order.user.phone || '',
              deliveredAt: order.deliveredAt?.toISOString(),
            }
          }),
      },
      totalEarnings: deliveryEarningsTotal + darkStoreEarningsTotal,
      darkStores: darkStores.map(ds => ({
        id: ds.id.toString(),
        name: ds.name,
        paymentModel: ds.paymentModel,
        perJarRate: ds.paymentModel === 'per_jar' ? Number(ds.perJarRateCents) / 100 : 0,
      })),
    })
  } catch (error) {
    console.error('Error fetching dark store owner earnings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}

