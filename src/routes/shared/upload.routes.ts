import { Elysia, t } from "elysia";
import {
  uploadFileToS3,
  deleteFileFromS3,
  getSignedUrlFromS3,
} from "../../services/shared/s3.service";

export const uploadRoutes = new Elysia({ prefix: "/upload" })
  .post(
    "/",
    async ({ body }) => {
      const { file, folder } = body;

      if (!file) {
        return { success: false, message: "No file provided" };
      }

      const result = await uploadFileToS3(file, folder || "documents");
      return result;
    },
    {
      body: t.Object({
        file: t.File(),
        folder: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    "/",
    async ({ body }) => {
      const { key } = body;

      if (!key) {
        return { success: false, message: "No file key provided" };
      }

      const result = await deleteFileFromS3(key);
      return result;
    },
    {
      body: t.Object({
        key: t.String(),
      }),
    }
  )
  .get(
    "/signed-url",
    async ({ query }) => {
      const { key, expiresIn } = query;

      if (!key) {
        return { success: false, message: "No file key provided" };
      }

      const result = await getSignedUrlFromS3(
        key,
        expiresIn ? parseInt(expiresIn) : 3600
      );
      return result;
    },
    {
      query: t.Object({
        key: t.String(),
        expiresIn: t.Optional(t.String()),
      }),
    }
  );
