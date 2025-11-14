'use client'

import { PrismaClient } from '@prisma/client'

// For client-side usage, create a new instance
// Note: In production, you should use API routes instead of direct client access
export function getPrismaClient() {
  return new PrismaClient()
}

