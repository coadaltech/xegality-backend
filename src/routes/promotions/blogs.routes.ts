import Elysia, { t } from "elysia";
import { app_middleware } from "@/middlewares";
import {
  create_blog,
  get_all_blogs,
  get_blog_by_id,
  update_blog,
  delete_blog,
} from "@/services/shared/blog.service";
import { uploadFileToS3 } from "@/services/shared/s3.service";

const blog_routes = new Elysia({ prefix: "/blogs" })
  .get("/", async ({ set }) => {
    const result = await get_all_blogs();
    set.status = result.code;
    return result;
  })

  .get("/:id", async ({ params, set }) => {
    const result = await get_blog_by_id(Number(params.id));
    set.status = result.code;
    return result;
  })

  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({
        cookie,
        headers,
        allowed: ["admin"],
      });
      set.status = state_result.code;
      if (!state_result.data) return state_result;
      store.id = state_result.data.id;
      store.role = state_result.data.role;
    },
  })

  .post(
    "/",
    async ({ body, set }) => {
      const formData = body as any;
      const { url: image_url } = await uploadFileToS3(formData.image, "blogs");
      const keywords = JSON.parse(formData.keywords);
      const sectionsData = JSON.parse(formData.sections);

      const sections = await Promise.all(
        sectionsData.map(async (section: any, index: number) => {
          const imageFiles = formData[`section_${index}_images`];
          const images = imageFiles
            ? Array.isArray(imageFiles)
              ? imageFiles
              : [imageFiles]
            : [];
          const uploadedImages = await Promise.all(
            images.map((file) =>
              uploadFileToS3(file, "blogs").then((obj) => obj.url)
            )
          );

          return {
            heading: section.heading,
            paragraphs: section.paragraphs,
            images: uploadedImages,
          };
        })
      );

      const result = await create_blog({
        title: formData.title,
        excerpt: formData.excerpt,
        image: image_url,
        category: formData.category,
        author: formData.author,
        keywords,
        sections,
      });
      set.status = result.code;
      return result;
    },
    {
      body: t.Any(),
    }
  )

  .put(
    "/:id",
    async ({ params, body, set }) => {
      const formData = body as any;
      const update_data: any = {
        title: formData.title,
        excerpt: formData.excerpt,
        category: formData.category,
        author: formData.author,
      };

      if (formData.image) {
        const { url } = await uploadFileToS3(formData.image, "blogs");
        update_data.image = url;
      }

      if (formData.keywords) {
        update_data.keywords = JSON.parse(formData.keywords);
      }

      if (formData.sections) {
        const sectionsData = JSON.parse(formData.sections);
        update_data.sections = await Promise.all(
          sectionsData.map(async (section: any, index: number) => {
            const imageFiles = formData[`section_${index}_images`];
            const newImages = imageFiles
              ? Array.isArray(imageFiles)
                ? imageFiles
                : [imageFiles]
              : [];
            const uploadedNewImages = await Promise.all(
              newImages.map((file) =>
                uploadFileToS3(file, "blogs").then((obj) => obj.url)
              )
            );

            return {
              heading: section.heading,
              paragraphs: section.paragraphs,
              images: [...section.existingImages, ...uploadedNewImages],
            };
          })
        );
      }

      const result = await update_blog(Number(params.id), update_data);
      set.status = result.code;
      return result;
    },
    {
      body: t.Any(),
    }
  )

  .delete("/:id", async ({ params, set }) => {
    const result = await delete_blog(Number(params.id));
    set.status = result.code;
    return result;
  });

export default blog_routes;
