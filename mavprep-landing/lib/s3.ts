import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  region: process.env.MAVPREP_AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.MAVPREP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.MAVPREP_AWS_SECRET_ACCESS_KEY || "",
  },
});

export const BUCKET_NAME =
  process.env.S3_EXAM_PAPERS_BUCKET || "mavprep-exam-papers-prod";

// Generate presigned URL for upload (client uploads directly to S3)
export async function generateUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(client, command, { expiresIn: 300 }); // 5 minutes
}

// Generate presigned URL for download
export async function generateDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn: 3600 }); // 1 hour
}

// Delete file from S3 (admin or owner only)
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await client.send(command);
}

export { client as s3Client };
