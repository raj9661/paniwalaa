import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/wallet - Get wallet balance and transactions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        txns: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 transactions
        },
      },
    })

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: BigInt(userId),
          balance: BigInt(0),
        },
        include: {
          txns: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      })
    }

    return NextResponse.json({
      wallet: {
        id: wallet.id.toString(),
        userId: wallet.userId.toString(),
        balance: Number(wallet.balance) / 100, // Convert from paise to rupees
        transactions: wallet.txns.map(txn => ({
          id: txn.id.toString(),
          amount: Number(txn.amount) / 100, // Convert from paise to rupees
          type: txn.type,
          reference: txn.reference,
          createdAt: txn.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching wallet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    )
  }
}

// POST /api/wallet - Add money to wallet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, paymentMethod, utrNumber } = body

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'User ID and amount are required' },
        { status: 400 }
      )
    }

    const amountInPaise = Math.round(parseFloat(amount) * 100)

    if (amountInPaise <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: BigInt(userId) },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: BigInt(userId),
          balance: BigInt(0),
        },
      })
    }

    // Update wallet balance
    const newBalance = wallet.balance + BigInt(amountInPaise)
    
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
      },
    })

    // Create transaction record
    const transaction = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: BigInt(amountInPaise),
        type: 'credit',
        reference: paymentMethod === 'upi' && utrNumber 
          ? `UPI: ${utrNumber}` 
          : paymentMethod === 'cod' 
            ? 'Cash Deposit' 
            : 'Wallet Top-up',
      },
    })

    return NextResponse.json({
      wallet: {
        id: updatedWallet.id.toString(),
        userId: updatedWallet.userId.toString(),
        balance: Number(updatedWallet.balance) / 100,
      },
      transaction: {
        id: transaction.id.toString(),
        amount: Number(transaction.amount) / 100,
        type: transaction.type,
        reference: transaction.reference,
        createdAt: transaction.createdAt.toISOString(),
      },
      message: 'Money added to wallet successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding money to wallet:', error)
    return NextResponse.json(
      { error: 'Failed to add money to wallet' },
      { status: 500 }
    )
  }
}

