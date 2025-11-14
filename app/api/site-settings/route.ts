import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/site-settings - Get site settings
export async function GET() {
  try {
    // Get the latest site settings (or create default if none exist)
    let settings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    })

    // If no settings exist, return default values
    if (!settings) {
      return NextResponse.json({
        heroTitle: 'Fresh Water Delivered in 30 Minutes',
        heroSubtitle: '',
        heroDescription: 'Order premium 20L drinking water and get it delivered to your doorstep faster than ever. Serving Laxmi Nagar, Delhi.',
        heroImageUrl: null,
        heroButtonText: 'Order Now',
        heroButtonLink: '/signup',
        siteTitle: 'Paniwalaa - Fresh Water in 30 Minutes | Laxmi Nagar, Delhi',
        siteDescription: '20L premium drinking water delivered to your doorstep in 30 minutes. Serving Laxmi Nagar, Delhi.',
        siteKeywords: 'water delivery, drinking water, 20L water jar, Laxmi Nagar, Delhi',
        faviconUrl: null,
        ogImageUrl: null,
        contactPhone: '+91 98765 43210',
        contactEmail: 'info@paniwalaa.com',
        contactAddress: 'Laxmi Nagar, Delhi - 110092',
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
        footerCopyright: `© ${new Date().getFullYear()} Paniwalaa. All rights reserved.`,
        upiId: null,
        floorChargeEnabled: true,
        floorChargePerFloorCents: 500, // ₹5 per floor
        defaultDeliveryPartnerCommissionCents: 1000, // ₹10 default commission per product unit (used when product doesn't have specific commission)
        darkStoreOwnerSelfDeliveryCommissionCents: 1000, // ₹10 extra for owner self-delivery
      })
    }

    return NextResponse.json({
      ...settings,
      id: settings.id.toString(),
      updatedBy: settings.updatedBy?.toString() || null,
      updatedAt: settings.updatedAt?.toISOString() || null,
      createdAt: settings.createdAt?.toISOString() || null,
      floorChargeEnabled: settings.floorChargeEnabled !== undefined ? settings.floorChargeEnabled : true,
      floorChargePerFloorCents: settings.floorChargePerFloorCents ? Number(settings.floorChargePerFloorCents) : 500,
      defaultDeliveryPartnerCommissionCents: settings.defaultDeliveryPartnerCommissionCents ? Number(settings.defaultDeliveryPartnerCommissionCents) : 1000,
      darkStoreOwnerSelfDeliveryCommissionCents: settings.darkStoreOwnerSelfDeliveryCommissionCents ? Number(settings.darkStoreOwnerSelfDeliveryCommissionCents) : 1000,
      settings: {
        ...settings,
        id: settings.id.toString(),
        updatedBy: settings.updatedBy?.toString() || null,
        updatedAt: settings.updatedAt?.toISOString() || null,
        createdAt: settings.createdAt?.toISOString() || null,
        floorChargeEnabled: settings.floorChargeEnabled !== undefined ? settings.floorChargeEnabled : true,
        floorChargePerFloorCents: settings.floorChargePerFloorCents ? Number(settings.floorChargePerFloorCents) : 500,
        deliveryPartnerCommissionPer20LJarCents: settings.deliveryPartnerCommissionPer20LJarCents ? Number(settings.deliveryPartnerCommissionPer20LJarCents) : 1000,
        darkStoreOwnerSelfDeliveryCommissionCents: settings.darkStoreOwnerSelfDeliveryCommissionCents ? Number(settings.darkStoreOwnerSelfDeliveryCommissionCents) : 1000,
      }, // Also return as nested object for compatibility
    })
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    )
  }
}

// PUT /api/site-settings - Update site settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      heroTitle,
      heroSubtitle,
      heroDescription,
      heroImageUrl,
      heroButtonText,
      heroButtonLink,
      siteTitle,
      siteDescription,
      siteKeywords,
      faviconUrl,
      ogImageUrl,
      contactPhone,
      contactEmail,
      contactAddress,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      footerCopyright,
      upiId,
      floorChargeEnabled,
      floorChargePerFloorCents,
      defaultDeliveryPartnerCommissionCents,
      darkStoreOwnerSelfDeliveryCommissionCents,
      updatedBy,
    } = body

    // Check if settings exist
    const existingSettings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    })

    if (existingSettings) {
      // Update existing settings
      const settings = await prisma.siteSettings.update({
        where: { id: existingSettings.id },
        data: {
          ...(heroTitle !== undefined && { heroTitle }),
          ...(heroSubtitle !== undefined && { heroSubtitle }),
          ...(heroDescription !== undefined && { heroDescription }),
          ...(heroImageUrl !== undefined && { heroImageUrl }),
          ...(heroButtonText !== undefined && { heroButtonText }),
          ...(heroButtonLink !== undefined && { heroButtonLink }),
          ...(siteTitle !== undefined && { siteTitle }),
          ...(siteDescription !== undefined && { siteDescription }),
          ...(siteKeywords !== undefined && { siteKeywords }),
          ...(faviconUrl !== undefined && { faviconUrl }),
          ...(ogImageUrl !== undefined && { ogImageUrl }),
          ...(contactPhone !== undefined && { contactPhone }),
          ...(contactEmail !== undefined && { contactEmail }),
          ...(contactAddress !== undefined && { contactAddress }),
          ...(facebookUrl !== undefined && { facebookUrl }),
          ...(twitterUrl !== undefined && { twitterUrl }),
          ...(instagramUrl !== undefined && { instagramUrl }),
          ...(footerCopyright !== undefined && { footerCopyright }),
          ...(upiId !== undefined && { upiId }),
          ...(floorChargeEnabled !== undefined && { floorChargeEnabled }),
          ...(floorChargePerFloorCents !== undefined && { floorChargePerFloorCents: BigInt(floorChargePerFloorCents) }),
          ...(defaultDeliveryPartnerCommissionCents !== undefined && { defaultDeliveryPartnerCommissionCents: BigInt(defaultDeliveryPartnerCommissionCents) }),
          ...(darkStoreOwnerSelfDeliveryCommissionCents !== undefined && { darkStoreOwnerSelfDeliveryCommissionCents: BigInt(darkStoreOwnerSelfDeliveryCommissionCents) }),
          ...(updatedBy !== undefined && { updatedBy: updatedBy ? BigInt(updatedBy) : null }),
        },
      })

      return NextResponse.json({
        ...settings,
        id: settings.id.toString(),
        updatedBy: settings.updatedBy?.toString() || null,
        updatedAt: settings.updatedAt?.toISOString() || null,
        createdAt: settings.createdAt?.toISOString() || null,
        floorChargeEnabled: settings.floorChargeEnabled !== undefined ? settings.floorChargeEnabled : true,
        floorChargePerFloorCents: settings.floorChargePerFloorCents ? Number(settings.floorChargePerFloorCents) : 500,
        deliveryPartnerCommissionPer20LJarCents: settings.deliveryPartnerCommissionPer20LJarCents ? Number(settings.deliveryPartnerCommissionPer20LJarCents) : 1000,
        darkStoreOwnerSelfDeliveryCommissionCents: settings.darkStoreOwnerSelfDeliveryCommissionCents ? Number(settings.darkStoreOwnerSelfDeliveryCommissionCents) : 1000,
      })
    } else {
      // Create new settings
      const settings = await prisma.siteSettings.create({
        data: {
          heroTitle: heroTitle || 'Fresh Water Delivered in 30 Minutes',
          heroSubtitle,
          heroDescription: heroDescription || 'Order premium 20L drinking water and get it delivered to your doorstep faster than ever. Serving Laxmi Nagar, Delhi.',
          heroImageUrl,
          heroButtonText: heroButtonText || 'Order Now',
          heroButtonLink: heroButtonLink || '/signup',
          siteTitle: siteTitle || 'Paniwalaa - Fresh Water in 30 Minutes | Laxmi Nagar, Delhi',
          siteDescription: siteDescription || '20L premium drinking water delivered to your doorstep in 30 minutes. Serving Laxmi Nagar, Delhi.',
          siteKeywords: siteKeywords || 'water delivery, drinking water, 20L water jar, Laxmi Nagar, Delhi',
          faviconUrl,
          ogImageUrl,
          contactPhone: contactPhone || '+91 98765 43210',
          contactEmail: contactEmail || 'info@paniwalaa.com',
          contactAddress: contactAddress || 'Laxmi Nagar, Delhi - 110092',
          facebookUrl,
          twitterUrl,
          instagramUrl,
          footerCopyright: footerCopyright || `© ${new Date().getFullYear()} Paniwalaa. All rights reserved.`,
          upiId: upiId || null,
          floorChargeEnabled: floorChargeEnabled !== undefined ? floorChargeEnabled : true,
          floorChargePerFloorCents: floorChargePerFloorCents ? BigInt(floorChargePerFloorCents) : BigInt(500),
          defaultDeliveryPartnerCommissionCents: defaultDeliveryPartnerCommissionCents ? BigInt(defaultDeliveryPartnerCommissionCents) : BigInt(1000),
          darkStoreOwnerSelfDeliveryCommissionCents: darkStoreOwnerSelfDeliveryCommissionCents ? BigInt(darkStoreOwnerSelfDeliveryCommissionCents) : BigInt(1000),
          updatedBy: updatedBy ? BigInt(updatedBy) : null,
        },
      })

      return NextResponse.json({
        ...settings,
        id: settings.id.toString(),
        updatedBy: settings.updatedBy?.toString() || null,
        updatedAt: settings.updatedAt?.toISOString() || null,
        createdAt: settings.createdAt?.toISOString() || null,
        floorChargeEnabled: settings.floorChargeEnabled !== undefined ? settings.floorChargeEnabled : true,
        floorChargePerFloorCents: settings.floorChargePerFloorCents ? Number(settings.floorChargePerFloorCents) : 500,
        deliveryPartnerCommissionPer20LJarCents: settings.deliveryPartnerCommissionPer20LJarCents ? Number(settings.deliveryPartnerCommissionPer20LJarCents) : 1000,
        darkStoreOwnerSelfDeliveryCommissionCents: settings.darkStoreOwnerSelfDeliveryCommissionCents ? Number(settings.darkStoreOwnerSelfDeliveryCommissionCents) : 1000,
      })
    }
  } catch (error: any) {
    console.error('Error updating site settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update site settings' },
      { status: 500 }
    )
  }
}

