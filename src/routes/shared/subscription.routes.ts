import { Elysia, t } from "elysia";
import { SubscriptionService } from "../../services/shared/subscription.service";
import { RazorpaySubscriptionService } from "../../services/shared/razorpay-subscription.service";
import { app_middleware } from "@/middlewares";

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
    async ({ body, store }) => {
      try {
        const subscription =
          await RazorpaySubscriptionService.activateSubscription(
            store.id,
            body,
            null
          );

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
