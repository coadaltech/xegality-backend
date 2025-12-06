import { Elysia, t } from "elysia";
import { app_middleware } from "@/middlewares";
import db from "../../config/db";
import { user_model } from "../../models/shared/user.model";
import { eq, like, or, desc, count, gte, sql } from "drizzle-orm";

export const adminUsersRoutes = new Elysia({ prefix: "/admin/users" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({ cookie, headers });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      if (state_result.data.role !== "admin") {
        set.status = 403;
        return { success: false, message: "Access denied" };
      }

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    },
  })

  // Get all users with pagination and filters
  .get(
    "/",
    async ({ query }) => {
      try {
        const {
          page = "1",
          limit = "10",
          search = "",
          role = "",
          status = "",
        } = query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = [];

        // Search filter
        if (search) {
          whereConditions.push(
            or(
              like(user_model.name, `%${search}%`),
              like(user_model.email, `%${search}%`)
            )
          );
        }

        // Role filter
        if (role && role !== "all") {
          whereConditions.push(eq(user_model.role, role as any));
        }

        // Get users
        const users = await db
          .select({
            id: user_model.id,
            name: user_model.name,
            email: user_model.email,
            phone: user_model.phone,
            role: user_model.role,
            is_profile_complete: user_model.is_profile_complete,
            credits: user_model.credits,
            created_at: user_model.created_at,
          })
          .from(user_model)
          .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
          .orderBy(desc(user_model.created_at))
          .limit(parseInt(limit))
          .offset(offset);

        // Get total count
        const totalResult = await db
          .select({ count: count() })
          .from(user_model)
          .where(whereConditions.length > 0 ? whereConditions[0] : undefined);

        const total = totalResult[0]?.count || 0;

        return {
          success: true,
          data: {
            users,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        };
      } catch (error) {
        console.error("Error fetching users:", error);
        return { success: false, message: "Failed to fetch users" };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        search: t.Optional(t.String()),
        role: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
    }
  )

  // Get user by ID
  .get("/:id", async ({ params: { id } }) => {
    try {
      const user = await db
        .select()
        .from(user_model)
        .where(eq(user_model.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return { success: false, message: "User not found" };
      }

      // Remove sensitive data
      const { hashed_password, refresh_token, ...userData } = user[0];

      return { success: true, data: userData };
    } catch (error) {
      return { success: false, message: "Failed to fetch user" };
    }
  })

  // Update user
  .put(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        const updateData: any = {};

        if (body.name) updateData.name = body.name;
        if (body.email) updateData.email = body.email;
        if (body.phone) updateData.phone = body.phone;
        if (body.role) updateData.role = body.role;
        if (body.credits !== undefined) updateData.credits = body.credits;
        if (body.is_profile_complete !== undefined)
          updateData.is_profile_complete = body.is_profile_complete;

        await db
          .update(user_model)
          .set(updateData)
          .where(eq(user_model.id, parseInt(id)));

        return { success: true, message: "User updated successfully" };
      } catch (error) {
        return { success: false, message: "Failed to update user" };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String()),
        phone: t.Optional(t.Union([t.Number(), t.Null()])),
        role: t.Optional(t.String()),
        credits: t.Optional(t.Number()),
        is_profile_complete: t.Optional(t.Boolean()),
      }),
    }
  )

  // Delete user
  .delete("/:id", async ({ params: { id } }) => {
    try {
      await db.delete(user_model).where(eq(user_model.id, parseInt(id)));

      return { success: true, message: "User deleted successfully" };
    } catch (error) {
      return { success: false, message: "Failed to delete user" };
    }
  })

  // Get user statistics
  .get("/stats/overview", async () => {
    try {
      // Total users
      const totalUsers = await db.select({ count: count() }).from(user_model);

      // Users by role
      const usersByRole = await db
        .select({
          role: user_model.role,
          count: count(),
        })
        .from(user_model)
        .groupBy(user_model.role);

      // Active users (profile complete)
      const activeUsers = await db
        .select({ count: count() })
        .from(user_model)
        .where(eq(user_model.is_profile_complete, true));

      // New users this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const newUsersThisMonth = await db
        .select({ count: count() })
        .from(user_model)
        .where(gte(user_model.created_at, thisMonth));

      return {
        success: true,
        data: {
          totalUsers: totalUsers[0]?.count || 0,
          activeUsers: activeUsers[0]?.count || 0,
          newUsersThisMonth: newUsersThisMonth[0]?.count || 0,
          usersByRole: usersByRole.reduce((acc, item) => {
            acc[item.role] = item.count;
            return acc;
          }, {} as Record<string, number>),
        },
      };
    } catch (error) {
      return { success: false, message: "Failed to fetch user statistics" };
    }
  });
