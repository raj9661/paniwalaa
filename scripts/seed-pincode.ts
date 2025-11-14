import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding default pincode 110092...')

  // Check if pincode already exists
  const existing = await prisma.deliverablePincode.findUnique({
    where: { pincode: '110092' },
  })

  if (existing) {
    console.log('Pincode 110092 already exists, skipping...')
    return
  }

  // Create default pincode
  const pincode = await prisma.deliverablePincode.create({
    data: {
      pincode: '110092',
      areaName: 'Laxmi Nagar',
      city: 'Delhi',
      state: 'Delhi',
      isActive: true,
      estimatedDeliveryMinutes: 30,
      notes: 'Default deliverable area',
    },
  })

  console.log('Successfully seeded pincode:', pincode)
}

main()
  .catch((e) => {
    console.error('Error seeding pincode:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

