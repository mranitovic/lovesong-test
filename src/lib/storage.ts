import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

/**
 * Download MP3 from Suno CDN and upload to S3
 */
export async function downloadAndStoreSong(
  sunoUrl: string,
  albumSessionId: string,
  songId: string,
  songTitle: string
): Promise<{ permanentUrl: string; key: string; size: number }> {
  console.log(`📥 [S3] Downloading song from Suno: ${songTitle}`);

  try {
    // 1. Download MP3 from Suno CDN
    const response = await fetch(sunoUrl);

    if (!response.ok) {
      throw new Error(`Failed to download from Suno: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const size = buffer.length;

    console.log(`✅ [S3] Downloaded ${size} bytes`);

    // 2. Generate S3 key (path)
    const sanitizedTitle = songTitle.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    const key = `songs/${albumSessionId}/${sanitizedTitle}_${songId}.mp3`;

    // 3. Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'audio/mpeg',
      ContentDisposition: `attachment; filename="${sanitizedTitle}.mp3"`,
      Metadata: {
        albumSessionId,
        songId,
        songTitle,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(uploadCommand);
    console.log(`✅ [S3] Uploaded to S3: ${key}`);

    // 4. Generate permanent public URL
    const permanentUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return {
      permanentUrl,
      key,
      size,
    };
  } catch (error) {
    console.error('❌ [S3] Error downloading/uploading song:', error);
    throw error;
  }
}

/**
 * Delete song from S3 (for GDPR/cleanup)
 */
export async function deleteSong(key: string): Promise<void> {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(deleteCommand);
    console.log(`🗑️ [S3] Deleted from S3: ${key}`);
  } catch (error) {
    console.error('❌ [S3] Error deleting file:', error);
    throw error;
  }
}
