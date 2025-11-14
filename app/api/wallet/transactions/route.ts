import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/wallet/transactions - Get wallet transactions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: BigInt(userId) },
    })

    if (!wallet) {
      return NextResponse.json({
        transactions: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.walletTransaction.count({
        where: { walletId: wallet.id },
      }),
    ])

    return NextResponse.json({
      transactions: transactions.map(txn => ({
        id: txn.id.toString(),
        amount: Number(txn.amount) / 100, // Convert from paise to rupees
        type: txn.type,
        reference: txn.reference,
        createdAt: txn.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching wallet transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet transactions' },
      { status: 500 }
    )
  }
}

