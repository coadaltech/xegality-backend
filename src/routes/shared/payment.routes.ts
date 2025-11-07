import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import { PaymentService } from "../../services/shared/payment.service";
import { CreateOrderSchema, PaymentVerificationSchema, PaymentWebhookSchema } from "../../types/shared/payment.types";

const payment_routes = new Elysia({ prefix: "/payment" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({ cookie, headers });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    }
  })

  // Create payment order
  .post("/create-order", async ({ body, set, store }) => {
    const result = await PaymentService.createOrder(store.id, body);

    set.status = result.code;
    return result;
  }, {
    body: CreateOrderSchema
  })

  // Verify payment
  .post("/verify", async ({ body, set }) => {
    const result = await PaymentService.verifyPayment(body);

    set.status = result.success ? 200 : 400;
    return result;
  }, {
    body: PaymentVerificationSchema
  })

  // Get payment by order ID
  .get("/order/:orderId", async ({ params, set }) => {
    const result = await PaymentService.getPaymentByOrderId(params.orderId);

    set.status = result.code;
    return result;
  }, {
    params: t.Object({
      orderId: t.String({ description: "Razorpay order ID" })
    })
  })

  // Get user payments
  .get("/user-payments", async ({ set, store }) => {
    const result = await PaymentService.getUserPayments(store.id);

    set.status = result.code;
    return result;
  })

  // Webhook endpoint (no auth required)
  .post("/webhook", async ({ body, set }) => {
    const result = await PaymentService.handleWebhook(body);

    set.status = result.code;
    return result;
  }, {
    body: PaymentWebhookSchema
  })

  // Update payment status (admin only)
  .post("/update-status", async ({ body, set, store }) => {
    if (store.role !== "admin") {
      set.status = 403;
      return {
        success: false,
        code: 403,
        message: "Access denied. Admin role required."
      };
    }

    const result = await PaymentService.updatePaymentStatus(
      body.orderId,
      body.status,
      body.paymentId
    );

    set.status = result.code;
    return result;
  }, {
    body: t.Object({
      orderId: t.String(),
      status: t.Enum({
        pending: "pending",
        completed: "completed", 
        failed: "failed",
        refunded: "refunded"
      }),
      paymentId: t.Optional(t.String())
    })
  });

export default payment_routes;
