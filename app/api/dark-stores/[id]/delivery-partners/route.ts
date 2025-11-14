import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/dark-stores/[id]/delivery-partners - Get delivery partners assigned to a dark store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)

    const darkStore = await prisma.darkStore.findUnique({
      where: { id },
    })

    if (!darkStore) {
      return NextResponse.json(
        { error: 'Dark store not found' },
        { status: 404 }
      )
    }

    const assignments = await prisma.darkStoreDeliveryPartner.findMany({
      where: { darkStoreId: id },
      orderBy: { assignedAt: 'desc' },
    })

    // Fetch user details for delivery partners
    const partnerIds = assignments.map(a => a.deliveryPartnerId)
    const partners = await prisma.user.findMany({
      where: {
        id: { in: partnerIds },
        role: 'delivery_partner',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    })

    const assignmentsWithDetails = assignments.map((assignment) => {
      const partner = partners.find(p => p.id === assignment.deliveryPartnerId)
      return {
        ...assignment,
        id: assignment.id.toString(),
        darkStoreId: assignment.darkStoreId.toString(),
        deliveryPartnerId: assignment.deliveryPartnerId.toString(),
        assignedBy: assignment.assignedBy?.toString() || null,
        pincodes: assignment.pincodes ? JSON.parse(assignment.pincodes) : [],
        assignedAt: assignment.assignedAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
        partner: partner ? {
          id: partner.id.toString(),
          name: partner.name,
          email: partner.email,
          phone: partner.phone,
        } : null,
      }
    })

    return NextResponse.json({
      assignments: assignmentsWithDetails,
    })
  } catch (error) {
    console.error('Error fetching delivery partners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delivery partners' },
      { status: 500 }
    )
  }
}

// POST /api/dark-stores/[id]/delivery-partners - Assign delivery partner to dark store
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const body = await request.json()
    const { deliveryPartnerId, pincodes, assignedBy } = body

    if (!deliveryPartnerId) {
      return NextResponse.json(
        { error: 'Delivery partner ID is required' },
        { status: 400 }
      )
    }

    const darkStore = await prisma.darkStore.findUnique({
      where: { id },
    })

    if (!darkStore) {
      return NextResponse.json(
        { error: 'Dark store not found' },
        { status: 404 }
      )
    }

    // Verify delivery partner exists and is a delivery partner
    const partner = await prisma.user.findUnique({
      where: { id: BigInt(deliveryPartnerId) },
    })

    if (!partner || partner.role !== 'delivery_partner') {
      return NextResponse.json(
        { error: 'Invalid delivery partner' },
        { status: 400 }
      )
    }

    // Check if assignment already exists
    const existing = await prisma.darkStoreDeliveryPartner.findFirst({
      where: {
        darkStoreId: id,
        deliveryPartnerId: BigInt(deliveryPartnerId),
      },
    })

    if (existing) {
      // Update existing assignment
      const assignment = await prisma.darkStoreDeliveryPartner.update({
        where: { id: existing.id },
        data: {
          pincodes: pincodes ? JSON.stringify(pincodes) : null,
          isActive: true,
        },
      })

      return NextResponse.json({
        ...assignment,
        id: assignment.id.toString(),
        darkStoreId: assignment.darkStoreId.toString(),
        deliveryPartnerId: assignment.deliveryPartnerId.toString(),
        assignedBy: assignment.assignedBy?.toString() || null,
        pincodes: assignment.pincodes ? JSON.parse(assignment.pincodes) : [],
        assignedAt: assignment.assignedAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
      })
    }

    // Create new assignment
    const assignment = await prisma.darkStoreDeliveryPartner.create({
      data: {
        darkStoreId: id,
        deliveryPartnerId: BigInt(deliveryPartnerId),
        pincodes: pincodes ? JSON.stringify(pincodes) : null,
        assignedBy: assignedBy ? BigInt(assignedBy) : null,
      },
    })

    return NextResponse.json({
      ...assignment,
      id: assignment.id.toString(),
      darkStoreId: assignment.darkStoreId.toString(),
      deliveryPartnerId: assignment.deliveryPartnerId.toString(),
      assignedBy: assignment.assignedBy?.toString() || null,
      pincodes: assignment.pincodes ? JSON.parse(assignment.pincodes) : [],
      assignedAt: assignment.assignedAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error assigning delivery partner:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to assign delivery partner' },
      { status: 500 }
    )
  }
}

// DELETE /api/dark-stores/[id]/delivery-partners - Remove delivery partner assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const searchParams = request.nextUrl.searchParams
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    const assignment = await prisma.darkStoreDeliveryPartner.findUnique({
      where: { id: BigInt(assignmentId) },
    })

    if (!assignment || assignment.darkStoreId !== id) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.darkStoreDeliveryPartner.update({
      where: { id: BigInt(assignmentId) },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Delivery partner assignment removed successfully' })
  } catch (error) {
    console.error('Error removing delivery partner assignment:', error)
    return NextResponse.json(
      { error: 'Failed to remove delivery partner assignment' },
      { status: 500 }
    )
  }
}

