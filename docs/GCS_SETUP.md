# Google Cloud Storage Setup Guide

This guide will help you set up Google Cloud Storage for storing blog images.

**Reference:** [Google Cloud Storage Upload Documentation](https://cloud.google.com/storage/docs/uploading-objects)

## Prerequisites

1. A Google Cloud Platform account
2. A GCP project with billing enabled
3. Access to the [Google Cloud Console](https://console.cloud.google.com)

## Step 1: Create a Storage Bucket

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Storage** > **Buckets**
3. Click **Create Bucket**
4. Set the bucket name: `paniwalla-blog-image` (or your preferred name)
5. Choose a location type (Region/Multi-region)
6. Select **Standard** storage class
7. Choose **Uniform** access control
8. Click **Create**

## Step 2: Create a Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Enter a name: `blog-image-uploader`
4. Click **Create and Continue**
5. Grant the role: **Storage Object Admin** (or **Storage Admin** for full access)
6. Click **Continue** and then **Done**

## Step 3: Generate Service Account Key

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Click **Create** - this will download a JSON file

## Step 4: Configure Environment Variables

Add the following to your `.env` file:

```env
# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GCS_BUCKET_NAME="paniwalla-blog-image"
GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**Important Notes:**
- Replace `your-project-id` with your actual GCP project ID
- Replace the `GOOGLE_CLOUD_CREDENTIALS` value with the entire contents of the downloaded JSON file (as a single-line JSON string)
- Make sure the JSON is properly escaped for use in environment variables

## Step 5: Make Bucket Public (Optional)

If you want images to be publicly accessible:

1. Go to your bucket in Cloud Storage
2. Click on the **Permissions** tab
3. Click **Grant Access**
4. Add principal: `allUsers`
5. Select role: **Storage Object Viewer**
6. Click **Save**

**Note:** The code automatically makes uploaded files public, but the bucket itself needs to allow public access.

## Step 6: Install Dependencies

```bash
pnpm install
```

This will install `@google-cloud/storage` package.

## Step 7: Test the Integration

1. Start your development server: `pnpm dev`
2. Go to `/admin/blogs/new`
3. Try uploading an image using the image upload component
4. Check your GCS bucket to verify the image was uploaded

## Troubleshooting

### Error: "Could not load the default credentials"

- Make sure `GOOGLE_CLOUD_CREDENTIALS` is set correctly in your `.env` file
- Verify the JSON credentials are valid and properly escaped
- Check that the service account has the correct permissions

### Error: "Bucket not found"

- Verify `GCS_BUCKET_NAME` matches your bucket name exactly
- Ensure the bucket exists in your GCP project
- Check that your service account has access to the bucket

### Images not publicly accessible

- Make sure the bucket allows public access (see Step 5)
- Verify the service account has permission to make files public
- Check that the uploaded file has public read permissions

## Security Best Practices

1. **Never commit credentials to version control** - Always use environment variables
2. **Use least privilege** - Only grant necessary permissions to the service account
3. **Enable bucket versioning** - For backup and recovery
4. **Set up lifecycle policies** - To manage storage costs
5. **Monitor access** - Use Cloud Audit Logs to track access

## API Endpoints

- **POST `/api/upload/image`** - Upload an image to GCS
  - Accepts: `multipart/form-data` with `file` field
  - Returns: `{ url: string, message: string, fileName: string, size: number }`
  - Max file size: 10MB
  - Allowed types: JPEG, PNG, GIF, WebP
  - Implementation follows [Google Cloud Storage upload best practices](https://cloud.google.com/storage/docs/uploading-objects)

## Implementation Details

The upload implementation uses the following Google Cloud Storage features:

1. **Buffer Upload**: Files are uploaded as buffers using `file.save()` method
2. **Precondition Options**: Uses `ifGenerationMatch: 0` to prevent race conditions
3. **Public Access**: Automatically makes uploaded files publicly accessible
4. **Metadata**: Sets appropriate content-type and cache-control headers
5. **Unique Filenames**: Generates unique filenames with timestamps to prevent conflicts

For more information, see the [official Google Cloud Storage upload documentation](https://cloud.google.com/storage/docs/uploading-objects).

## Storage Structure

Images are stored with the following naming convention:
```
{timestamp}-{sanitized-filename}
```

Example: `1699123456789-my-blog-image.jpg`

This ensures unique filenames and prevents conflicts.

