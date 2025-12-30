import { Elysia, t } from "elysia";
import { SubscriptionService } from "../../services/shared/subscription.service";
import { RazorpaySubscriptionService } from "../../services/shared/razorpay-subscription.service";
import { app_middleware } from "@/middlewares";
import { generate_jwt } from "@/utils/general.utils";
import { eq } from "drizzle-orm";
import db from "../../config/db";
import { user_model } from "../../models/shared/user.model";
import { set_auth_cookies } from "@/utils/cookie.utils";

export const subscriptionRoutes = new Elysia({ prefix: "/subscriptions" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({ cookie, headers });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    },
  })
  .get("/plans/:userType", async ({ params: { userType } }) => {
    if (userType !== "student" && userType !== "lawyer") {
      return { success: false, message: "Invalid user type" };
    }

    const plans = SubscriptionService.getAvailablePlans(userType);
    return { success: true, data: plans };
  })

  .get("/current", async ({ store }) => {
    try {
      const subscription = await SubscriptionService.getUserSubscription(
        store.id
      );
      return { success: true, data: subscription };
    } catch (error) {
      return { success: false, message: "Failed to fetch subscription" };
    }
  })

  .get("/history", async ({ store }) => {
    try {
      const history = await SubscriptionService.getSubscriptionHistory(
        store.id
      );
      return { success: true, data: history };
    } catch (error) {
      return {
        success: false,
        message: "Failed to fetch subscription history",
      };
    }
  })

  .post(
    "/create-order",
    async ({ body, store }) => {
      try {
        const { order, plan } =
          await RazorpaySubscriptionService.createSubscriptionOrder(
            store.id,
            body.plan_id
          );

        console.log("order", order, plan);
        return {
          success: true,
          data: { order, plan },
          message: "Order created successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: (error as Error).message || "Failed to create order",
        };
      }
    },
    {
      body: t.Object({
        plan_id: t.String(),
      }),
    }
  )

  .post(
    "/verify-payment",
    async ({ body, store, cookie }) => {
      try {
        const subscription =
          await RazorpaySubscriptionService.activateSubscription(
            store.id,
            body,
            null
          );

        // Get user to refresh token with new subscription status
        const user = await db
          .select()
          .from(user_model)
          .where(eq(user_model.id, store.id))
          .then((rows) => rows[0]);

        if (user) {
          const subscriptionAccess =
            await SubscriptionService.calculateSubscriptionAccess(
              store.id,
              user.created_at
            );

          const new_access_token = generate_jwt(
            store.id,
            store.role,
            user.is_profile_complete || false,
            subscriptionAccess.hasAccess,
            subscriptionAccess.expiresAt
          );

          // Update the access token cookie
          set_auth_cookies(cookie, new_access_token, user.refresh_token);

          console.log("verify payment", subscription);
          return {
            success: true,
            data: {
              subscription,
              new_access_token,
            },
            message: "Subscription activated successfully",
          };
        }

        console.log("verify payment", subscription);
        return {
          success: true,
          data: subscription,
          message: "Subscription activated successfully",
        };
      } catch (error) {
        console.log("Verify payment issues", error);
        return {
          success: false,
          message: (error as Error).message || "Failed to verify payment",
        };
      }
    },
    {
      body: t.Object({
        razorpay_order_id: t.String(),
        razorpay_payment_id: t.String(),
        razorpay_signature: t.String(),
      }),
    }
  )

  .post("/cancel", async ({ store }) => {
    try {
      await SubscriptionService.cancelActiveSubscription(store.id);
      return { success: true, message: "Subscription cancelled successfully" };
    } catch (error) {
      return { success: false, message: "Failed to cancel subscription" };
    }
  });
