import { t } from "elysia";

export const CreateBlogSchema = t.Object({
  title: t.String(),
  excerpt: t.String(),
  image: t.String(),
  category: t.String(),
  author: t.String(),
  keywords: t.Array(t.String()),
  sections: t.Array(t.Object({
    heading: t.String(),
    paragraphs: t.Array(t.String()),
    images: t.Array(t.String()),
  })),
});

export const UpdateBlogSchema = t.Object({
  title: t.Optional(t.String()),
  excerpt: t.Optional(t.String()),
  image: t.Optional(t.String()),
  category: t.Optional(t.String()),
  author: t.Optional(t.String()),
  keywords: t.Optional(t.Array(t.String())),
  sections: t.Optional(t.Array(t.Object({
    heading: t.String(),
    paragraphs: t.Array(t.String()),
    images: t.Array(t.String()),
  }))),
});
