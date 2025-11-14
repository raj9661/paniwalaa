import { Storage } from '@google-cloud/storage'

// Initialize Google Cloud Storage
let storage: Storage | null = null

export function getStorageClient(): Storage {
  if (!storage) {
    // Initialize with credentials from environment variable
    const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS
      ? JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
      : undefined

    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials,
    })
  }

  return storage
}

/**
 * Upload an image file to Google Cloud Storage
 * @param file - File buffer to upload
 * @param fileName - Original filename
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadImageToGCS(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const storage = getStorageClient()
  const bucketName = process.env.GCS_BUCKET_NAME || 'paniwalla-blog-image'
  const bucket = storage.bucket(bucketName)

  // Generate unique filename with timestamp
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const uniqueFileName = `${timestamp}-${sanitizedFileName}`

  // Create file reference
  const fileRef = bucket.file(uniqueFileName)

  // Upload options following Google Cloud Storage best practices
  // Reference: https://cloud.google.com/storage/docs/uploading-objects
  const uploadOptions = {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
    },
    // Set precondition to avoid race conditions
    // If file doesn't exist, set ifGenerationMatch to 0
    preconditionOpts: {
      ifGenerationMatch: 0, // Only upload if file doesn't exist
    },
  }

  // Upload file buffer
  // For buffer uploads, we use file.save() method
  await fileRef.save(file, uploadOptions)

  // Make file publicly accessible
  await fileRef.makePublic()

  // Return public URL
  const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFileName}`
  return publicUrl
}

export async function deleteImageFromGCS(fileUrl: string): Promise<void> {
  try {
    const storage = getStorageClient()
    const bucketName = process.env.GCS_BUCKET_NAME || 'paniwalla-blog-image'
    const bucket = storage.bucket(bucketName)

    // Extract filename from URL
    const fileName = fileUrl.split('/').pop()
    if (!fileName) {
      throw new Error('Invalid file URL')
    }

    // Delete file
    await bucket.file(fileName).delete()
  } catch (error) {
    console.error('Error deleting image from GCS:', error)
    // Don't throw error, just log it
  }
}

