import { NextRequest, NextResponse } from 'next/server'
import { uploadImageToGCS } from '@/lib/gcs'

/**
 * API endpoint for uploading images to Google Cloud Storage
 * Reference: https://cloud.google.com/storage/docs/uploading-objects
 * 
 * POST /api/upload/image
 * Body: multipart/form-data with 'file' field
 * Returns: { url: string, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Google Cloud Storage
    // Using the upload method that follows Google Cloud Storage best practices
    const publicUrl = await uploadImageToGCS(
      buffer,
      file.name,
      file.type
    )

    return NextResponse.json({
      url: publicUrl,
      message: 'Image uploaded successfully',
      fileName: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error('Error uploading image to GCS:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      // Handle GCS-specific errors
      if (error.message.includes('bucket')) {
        return NextResponse.json(
          { error: 'Storage bucket not found. Please check your GCS configuration.' },
          { status: 500 }
        )
      }
      if (error.message.includes('permission') || error.message.includes('credentials')) {
        return NextResponse.json(
          { error: 'Authentication failed. Please check your GCS credentials.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to upload image. Please try again.' },
      { status: 500 }
    )
  }
}

