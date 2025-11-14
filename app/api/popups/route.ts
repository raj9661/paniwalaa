import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/popups - Get all popups (admin) or active popups (users)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const role = searchParams.get('role') || 'all'
    const page = searchParams.get('page') || '/'

    if (activeOnly) {
      // For users - get active popups that match their role and page
      const now = new Date()
      const popups = await prisma.popup.findMany({
        where: {
          isActive: true,
          OR: [
            { startDate: null },
            { startDate: { lte: now } },
          ],
          AND: [
            {
              OR: [
                { endDate: null },
                { endDate: { gte: now } },
              ],
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })

      // Filter by role and page
      const filteredPopups = popups.filter((popup) => {
        // Check role targeting
        if (popup.targetRoles) {
          try {
            const roles = JSON.parse(popup.targetRoles)
            if (!roles.includes('all') && !roles.includes(role)) {
              return false
            }
          } catch {
            // Invalid JSON, skip role filtering
          }
        }

        // Check page targeting
        if (!popup.showOnAllPages && popup.targetPages) {
          try {
            const pages = JSON.parse(popup.targetPages)
            if (!pages.some((p: string) => page.startsWith(p))) {
              return false
            }
          } catch {
            // Invalid JSON, skip page filtering
          }
        }

        return true
      })

      return NextResponse.json({ 
        popups: filteredPopups.map(p => ({
          ...p,
          id: p.id.toString(),
          createdBy: p.createdBy?.toString() || null,
          startDate: p.startDate?.toISOString() || null,
          endDate: p.endDate?.toISOString() || null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))
      })
    } else {
      // For admin - get all popups
      const allPopups = await prisma.popup.findMany({
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ 
        popups: allPopups.map(p => ({
          ...p,
          id: p.id.toString(),
          createdBy: p.createdBy?.toString() || null,
          startDate: p.startDate?.toISOString() || null,
          endDate: p.endDate?.toISOString() || null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))
      })
    }
  } catch (error) {
    console.error('Error fetching popups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popups' },
      { status: 500 }
    )
  }
}

// POST /api/popups - Create a new popup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      content,
      type,
      position,
      isActive,
      showOnAllPages,
      targetPages,
      targetRoles,
      startDate,
      endDate,
      showOnce,
      buttonText,
      buttonLink,
      imageUrl,
      createdBy,
    } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const popup = await prisma.popup.create({
      data: {
        title,
        content,
        type: type || 'info',
        position: position || 'center',
        isActive: isActive !== undefined ? isActive : true,
        showOnAllPages: showOnAllPages !== undefined ? showOnAllPages : true,
        targetPages: targetPages ? JSON.stringify(targetPages) : null,
        targetRoles: targetRoles ? JSON.stringify(targetRoles) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        showOnce: showOnce || false,
        buttonText,
        buttonLink,
        imageUrl,
        createdBy: createdBy ? BigInt(createdBy) : null,
      },
    })

    return NextResponse.json({
      ...popup,
      id: popup.id.toString(),
      createdBy: popup.createdBy?.toString() || null,
      startDate: popup.startDate?.toISOString() || null,
      endDate: popup.endDate?.toISOString() || null,
      createdAt: popup.createdAt.toISOString(),
      updatedAt: popup.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating popup:', error)
    return NextResponse.json(
      { error: 'Failed to create popup' },
      { status: 500 }
    )
  }
}

