import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/auth/login-logs - Get login logs (admin only)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (userId) {
      where.userId = BigInt(userId)
    }
    if (role) {
      where.role = role
    }
    if (status) {
      where.loginStatus = status
    }

    const [logs, total] = await Promise.all([
      prisma.loginLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      }),
      prisma.loginLog.count({ where }),
    ])

    return NextResponse.json({
      logs: logs.map(log => ({
        ...log,
        id: log.id.toString(),
        userId: log.userId.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching login logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch login logs' },
      { status: 500 }
    )
  }
}

