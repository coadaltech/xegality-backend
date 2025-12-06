import db from "@/config/db";
import { blogs } from "@/models/shared/blog.model";
import { eq } from "drizzle-orm";

export const create_blog = async (data: any) => {
  try {
    const [blog] = await db.insert(blogs).values(data).returning();
    return {
      success: true,
      code: 201,
      message: "Blog created successfully",
      data: blog,
    };
  } catch (error) {
    console.error("Error creating blog:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to create blog",
    };
  }
};

export const get_all_blogs = async () => {
  try {
    const all_blogs = await db.select().from(blogs);
    return {
      success: true,
      code: 200,
      data: all_blogs,
    };
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to fetch blogs",
    };
  }
};

export const get_blog_by_id = async (id: number) => {
  try {
    const [blog] = await db.select().from(blogs).where(eq(blogs.id, id));
    if (!blog) {
      return {
        success: false,
        code: 404,
        message: "Blog not found",
      };
    }
    return {
      success: true,
      code: 200,
      data: blog,
    };
  } catch (error) {
    console.error("Error fetching blog:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to fetch blog",
    };
  }
};

export const update_blog = async (id: number, data: any) => {
  try {
    const [updated_blog] = await db
      .update(blogs)
      .set({ ...data, updated_at: new Date() })
      .where(eq(blogs.id, id))
      .returning();

    if (!updated_blog) {
      return {
        success: false,
        code: 404,
        message: "Blog not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Blog updated successfully",
      data: updated_blog,
    };
  } catch (error) {
    console.error("Error updating blog:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to update blog",
    };
  }
};

export const delete_blog = async (id: number) => {
  try {
    const [deleted_blog] = await db
      .delete(blogs)
      .where(eq(blogs.id, id))
      .returning();

    if (!deleted_blog) {
      return {
        success: false,
        code: 404,
        message: "Blog not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Blog deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting blog:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to delete blog",
    };
  }
};
