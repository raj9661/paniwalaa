import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/contact/[id] - Get a single contact submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Contact submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...submission,
      id: submission.id.toString(),
      readBy: submission.readBy?.toString() || null,
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
      readAt: submission.readAt?.toISOString() || null,
    })
  } catch (error) {
    console.error('Error fetching contact submission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact submission' },
      { status: 500 }
    )
  }
}

// PUT /api/contact/[id] - Update contact submission (mark as read, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const body = await request.json()
    const { isRead, isSpam, readBy } = body

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Contact submission not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (isRead !== undefined) {
      updateData.isRead = isRead
      if (isRead && !submission.readAt) {
        updateData.readAt = new Date()
      } else if (!isRead) {
        updateData.readAt = null
      }
    }
    if (isSpam !== undefined) {
      updateData.isSpam = isSpam
    }
    if (readBy !== undefined) {
      updateData.readBy = readBy ? BigInt(readBy) : null
    }

    const updated = await prisma.contactSubmission.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      ...updated,
      id: updated.id.toString(),
      readBy: updated.readBy?.toString() || null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      readAt: updated.readAt?.toISOString() || null,
    })
  } catch (error) {
    console.error('Error updating contact submission:', error)
    return NextResponse.json(
      { error: 'Failed to update contact submission' },
      { status: 500 }
    )
  }
}

// DELETE /api/contact/[id] - Delete contact submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Contact submission not found' },
        { status: 404 }
      )
    }

    await prisma.contactSubmission.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Contact submission deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact submission:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact submission' },
      { status: 500 }
    )
  }
}

