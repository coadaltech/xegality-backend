import db from "../../config/db";
import { media_model } from "../../models/shared/docs.model";
import { uploadFileToS3 } from "./s3.service";
import { eq } from "drizzle-orm";

export const upload_case_document = async (
  file: File,
  caseId: string,
  uploaderId: number,
  title?: string
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
        title: title || file.name,
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

export const upload_chat_file = async (
  file: File,
  uploaderId: number,
  title?: string
) => {
  try {
    const result = await uploadFileToS3(file, `chat/${uploaderId}`);

    console.log("result", result);

    if (!result.success || !result.url) {
      return { code: 500, success: false, message: "Failed to upload file" };
    }

    const [media] = await db
      .insert(media_model)
      .values({
        url: result.url,
        title: title || file.name,
        type: file.type,
        size: file.size,
        uploader_id: uploaderId,
        // case_id is optional for chat files
      })
      .returning();

    return { code: 200, success: true, data: media };
  } catch (error) {
    console.error("Upload chat file error:", error);
    return { code: 500, success: false, message: "Failed to upload chat file" };
  }
};

export const update_document_title = async (
  documentId: number,
  title: string
) => {
  try {
    const [updatedDocument] = await db
      .update(media_model)
      .set({ title })
      .where(eq(media_model.id, documentId))
      .returning();

    if (!updatedDocument) {
      return { code: 404, success: false, message: "Document not found" };
    }

    return { code: 200, success: true, data: updatedDocument };
  } catch (error) {
    console.error("Update document title error:", error);
    return {
      code: 500,
      success: false,
      message: "Failed to update document title",
    };
  }
};
