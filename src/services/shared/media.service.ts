import db from "../../config/db";
import { media_model } from "../../models/shared/docs.model";
import { uploadFileToS3 } from "./s3.service";
import { eq } from "drizzle-orm";

export const upload_case_document = async (
  file: File,
  caseId: string,
  uploaderId: number
) => {
  try {
    const result = await uploadFileToS3(file, `cases/${caseId}`);

    if (!result.success || !result.url) {
      return { code: 500, success: false, message: "Failed to upload file" };
    }

    const [media] = await db
      .insert(media_model)
      .values({
        url: result.url,
        type: file.type,
        size: file.size,
        uploader_id: uploaderId,
        case_id: caseId,
      })
      .returning();

    return { code: 200, success: true, data: media };
  } catch (error) {
    console.error("Upload document error:", error);
    return { code: 500, success: false, message: "Failed to upload document" };
  }
};

export const get_case_documents = async (caseId: string) => {
  try {
    const documents = await db
      .select()
      .from(media_model)
      .where(eq(media_model.case_id, caseId));

    return { code: 200, success: true, data: documents };
  } catch (error) {
    console.error("Get documents error:", error);
    return { code: 500, success: false, message: "Failed to fetch documents" };
  }
};
