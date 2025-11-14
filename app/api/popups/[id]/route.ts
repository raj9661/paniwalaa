import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/popups/[id] - Get a single popup
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const popup = await prisma.popup.findUnique({
      where: { id },
    })

    if (!popup) {
      return NextResponse.json(
        { error: 'Popup not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...popup,
      id: popup.id.toString(),
      createdBy: popup.createdBy?.toString() || null,
      startDate: popup.startDate?.toISOString() || null,
      endDate: popup.endDate?.toISOString() || null,
      createdAt: popup.createdAt.toISOString(),
      updatedAt: popup.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching popup:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popup' },
      { status: 500 }
    )
  }
}

// PUT /api/popups/[id] - Update a popup
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
    } = body

    const existingPopup = await prisma.popup.findUnique({
      where: { id },
    })

    if (!existingPopup) {
      return NextResponse.json(
        { error: 'Popup not found' },
        { status: 404 }
      )
    }

    const popup = await prisma.popup.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
        ...(position !== undefined && { position }),
        ...(isActive !== undefined && { isActive }),
        ...(showOnAllPages !== undefined && { showOnAllPages }),
        ...(targetPages !== undefined && { targetPages: targetPages ? JSON.stringify(targetPages) : null }),
        ...(targetRoles !== undefined && { targetRoles: targetRoles ? JSON.stringify(targetRoles) : null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(showOnce !== undefined && { showOnce }),
        ...(buttonText !== undefined && { buttonText }),
        ...(buttonLink !== undefined && { buttonLink }),
        ...(imageUrl !== undefined && { imageUrl }),
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
    })
  } catch (error) {
    console.error('Error updating popup:', error)
    return NextResponse.json(
      { error: 'Failed to update popup' },
      { status: 500 }
    )
  }
}

// DELETE /api/popups/[id] - Delete a popup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)

    const popup = await prisma.popup.findUnique({
      where: { id },
    })

    if (!popup) {
      return NextResponse.json(
        { error: 'Popup not found' },
        { status: 404 }
      )
    }

    await prisma.popup.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Popup deleted successfully' })
  } catch (error) {
    console.error('Error deleting popup:', error)
    return NextResponse.json(
      { error: 'Failed to delete popup' },
      { status: 500 }
    )
  }
}

