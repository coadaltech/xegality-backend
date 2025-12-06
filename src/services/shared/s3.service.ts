import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export const uploadFileToS3 = async (
  file: File,
  folder: string = "documents"
): Promise<{
  success: boolean;
  url?: string;
  key?: string;
  message?: string;
}> => {
  try {
    const key = `${folder}/${Date.now()}-${file.name}`;
    const buffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: file.type,
    });

    await s3Client.send(command);

    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { success: true, url, key };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return { success: false, message: "Failed to upload file" };
  }
};

export const deleteFileFromS3 = async (
  key: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return { success: true };
  } catch (error) {
    console.error("S3 Delete Error:", error);
    return { success: false, message: "Failed to delete file" };
  }
};

export const getSignedUrlFromS3 = async (
  key: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; message?: string }> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return { success: true, url };
  } catch (error) {
    console.error("S3 Signed URL Error:", error);
    return { success: false, message: "Failed to generate signed URL" };
  }
};
