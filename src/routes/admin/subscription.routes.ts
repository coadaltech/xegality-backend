import { Elysia, t } from "elysia";
import { app_middleware } from "@/middlewares";
import db from "../../config/db";
import { subscription_model } from "../../models/shared/subscription.model";
import { user_model } from "../../models/shared/user.model";
import { eq } from "drizzle-orm";

export const adminSubscriptionRoutes = new Elysia({
  prefix: "/admin/subscriptions",
})
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
  .get("/", async () => {
    try {
      const subscriptions = await db
        .select({
          id: subscription_model.id,
          user_id: subscription_model.user_id,
          plan_id: subscription_model.plan_id,
          plan_name: subscription_model.plan_name,
          price: subscription_model.price,
          status: subscription_model.status,
          start_date: subscription_model.start_date,
          end_date: subscription_model.end_date,
          created_at: subscription_model.created_at,
          user_name: user_model.name,
          user_email: user_model.email,
        })
        .from(subscription_model)
        .leftJoin(user_model, eq(subscription_model.user_id, user_model.id))
        .orderBy(subscription_model.created_at);

      return { success: true, data: subscriptions };
    } catch (error) {
      return { success: false, message: "Failed to fetch subscriptions" };
    }
  })

  .put(
    "/:id",
    async ({ params: { id }, body }) => {
      try {
        await db
          .update(subscription_model)
          .set({
            status: body.status as any,
            end_date: body.end_date ? new Date(body.end_date) : undefined,
            updated_at: new Date(),
          })
          .where(eq(subscription_model.id, parseInt(id)));

        return { success: true, message: "Subscription updated successfully" };
      } catch (error) {
        return { success: false, message: "Failed to update subscription" };
      }
    },
    {
      body: t.Object({
        status: t.Optional(t.String()),
        end_date: t.Optional(t.String()),
      }),
    }
  )

  .delete("/:id", async ({ params: { id } }) => {
    try {
      await db
        .delete(subscription_model)
        .where(eq(subscription_model.id, parseInt(id)));

      return { success: true, message: "Subscription deleted successfully" };
    } catch (error) {
      return { success: false, message: "Failed to delete subscription" };
    }
  });
