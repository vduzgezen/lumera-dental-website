// portal/lib/storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// --- CONFIGURATION ---
// You will need to add these to your .env file later
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Check for missing config in production
if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
  // We don't throw error in dev so the app doesn't crash if you're just testing UI
  if (process.env.NODE_ENV === "production") {
    throw new Error("Fatal: Missing S3 Storage Configuration");
  }
}

// Initialize S3 Client (Works for AWS S3, Cloudflare R2, DigitalOcean Spaces, etc.)
// Currently configured for Cloudflare R2 (Recommended for zero egress fees)
// If using AWS, remove the "endpoint" line and "region" logic might differ.
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, // Replace with AWS endpoint if using AWS
  credentials: {
    accessKeyId: ACCESS_KEY_ID || "",
    secretAccessKey: SECRET_ACCESS_KEY || "",
  },
});

/**
 * Uploads a file buffer to S3
 */
export async function uploadFile(
  buffer: Buffer, 
  key: string, 
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);

  // Return the key (path) to store in the DB
  return key;
}

/**
 * Generates a temporary signed URL for viewing private files (Secure)
 * Valid for 1 hour.
 */
export async function getSignedFileUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  
  // URL expires in 3600 seconds (1 hour)
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

/**
 * Deletes a file from S3
 */
export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await s3.send(command);
}

/**
 * Helper to get a raw stream (Useful for batch zipping)
 */
export async function getFileStream(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  const response = await s3.send(command);
  return response.Body;
}