import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users/cleanup-deleted-accounts - Permanently delete accounts scheduled for deletion (admin/super_admin only)
// This endpoint should be called by a scheduled job/cron daily
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here if needed
    // For now, this can be called by a cron job with a secret token

    const now = new Date()
    
    // Find all users scheduled for deletion where the deletion date has passed
    const usersToDelete = await prisma.user.findMany({
      where: {
        scheduledDeletionAt: {
          not: null,
          lte: now, // Less than or equal to now (deletion date has passed)
        },
        isActive: false, // Only delete inactive accounts
      },
      select: {
        id: true,
        email: true,
        name: true,
        scheduledDeletionAt: true,
      },
    })

    if (usersToDelete.length === 0) {
      return NextResponse.json({
        message: 'No accounts to delete',
        deletedCount: 0,
      })
    }

    // Delete related data first (to avoid foreign key constraints)
    const userIds = usersToDelete.map(u => u.id)

    // Delete wallet transactions
    await prisma.walletTransaction.deleteMany({
      where: {
        wallet: {
          userId: {
            in: userIds,
          },
        },
      },
    })

    // Delete wallets
    await prisma.wallet.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    // Delete addresses
    await prisma.address.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    // Delete login logs
    await prisma.loginLog.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    // Delete password reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    // Delete phone number change OTPs
    await prisma.phoneNumberChangeOTP.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    // Note: Orders should probably be kept for business records, but if you want to delete them:
    // await prisma.order.deleteMany({
    //   where: {
    //     userId: {
    //       in: userIds,
    //     },
    //   },
    // })

    // Finally, delete the users
    const deleteResult = await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    })

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.count} account(s)`,
      deletedCount: deleteResult.count,
      deletedUsers: usersToDelete.map(u => ({
        id: u.id.toString(),
        email: u.email,
        name: u.name,
        scheduledDeletionAt: u.scheduledDeletionAt?.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error cleaning up deleted accounts:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup deleted accounts' },
      { status: 500 }
    )
  }
}

