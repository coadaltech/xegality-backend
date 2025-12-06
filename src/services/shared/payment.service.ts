import Razorpay from "razorpay";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import db from "../../config/db";
import { payment_model } from "../../models/shared/payment.model";
import {
  CreateOrderSchema,
  PaymentVerificationSchema,
  RazorpayOrderResponse,
  PaymentVerificationResult,
  PaymentRecord,
} from "../../types/shared/payment.types";
import { create_unique_id } from "../../utils/general.utils";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay credentials not found in environment variables");
}
// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export class PaymentService {
  static async createOrder(
    userId: number,
    orderData: typeof CreateOrderSchema.static
  ): Promise<{
    success: boolean;
    code: number;
    message: string;
    data?: RazorpayOrderResponse;
    error?: string;
  }> {
    try {
      // Create order in Razorpay
      const razorpayOrder = await razorpay.orders.create({
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        notes: orderData.notes,
        partial_payment: orderData.partial_payment,
      });

      console.log("razorpay order", razorpayOrder);

      // Store payment record in database
      const paymentId = create_unique_id();
      const paymentRecord = {
        id: paymentId,
        user_id: userId,
        order_id: razorpayOrder.id,
        amount: orderData.amount,
        currency: orderData.currency,
        status: "pending" as const,
        receipt: orderData.receipt,
        notes: orderData.notes,
        razorpay_response: razorpayOrder,
      };

      await db.insert(payment_model).values(paymentRecord);

      return {
        success: true,
        code: 200,
        message: "Order created successfully",
        data: razorpayOrder,
      };
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      return {
        success: false,
        code: 500,
        message: "Failed to create order",
        error: String(error),
      };
    }
  }

  /**
   * Verify payment signature
   */
  static async verifyPayment(
    verificationData: typeof PaymentVerificationSchema.static
  ): Promise<PaymentVerificationResult> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        verificationData;

      // Create signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex");

      // Verify signature
      const isAuthentic = expectedSignature === razorpay_signature;

      if (!isAuthentic) {
        return {
          success: false,
          error: "Invalid signature",
        };
      }

      // Update payment record in database
      await db
        .update(payment_model)
        .set({
          payment_id: razorpay_payment_id,
          status: "completed",
          updated_at: new Date(),
        })
        .where(eq(payment_model.order_id, razorpay_order_id));

      return {
        success: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      };
    } catch (error) {
      console.error("Error verifying payment:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Get payment details by order ID
   */
  static async getPaymentByOrderId(orderId: string): Promise<{
    success: boolean;
    code: number;
    message: string;
    data?: PaymentRecord;
  }> {
    try {
      const payment = await db
        .select()
        .from(payment_model)
        .where(eq(payment_model.order_id, orderId))
        .limit(1);

      if (payment.length === 0) {
        return {
          success: false,
          code: 404,
          message: "Payment not found",
        };
      }

      return {
        success: true,
        code: 200,
        message: "Payment found",
        data: payment[0],
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        message: "Error fetching payment",
      };
    }
  }

  /**
   * Get all payments for a user
   */
  static async getUserPayments(userId: number): Promise<{
    success: boolean;
    code: number;
    message: string;
    data?: PaymentRecord[];
  }> {
    try {
      const payments = await db
        .select()
        .from(payment_model)
        .where(eq(payment_model.user_id, userId))
        .orderBy(payment_model.created_at);

      return {
        success: true,
        code: 200,
        message: `Found ${payments.length} payments`,
        data: payments,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        message: "Error fetching payments",
      };
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    orderId: string,
    status: "pending" | "completed" | "failed" | "refunded",
    paymentId?: string
  ): Promise<{
    success: boolean;
    code: number;
    message: string;
  }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date(),
      };

      if (paymentId) {
        updateData.payment_id = paymentId;
      }

      await db
        .update(payment_model)
        .set(updateData)
        .where(eq(payment_model.order_id, orderId));

      return {
        success: true,
        code: 200,
        message: "Payment status updated",
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        message: "Error updating payment status",
      };
    }
  }

  /**
   * Handle Razorpay webhook
   */
  static async handleWebhook(webhookData: any): Promise<{
    success: boolean;
    code: number;
    message: string;
  }> {
    try {
      const { event, payload } = webhookData;

      switch (event) {
        case "payment.captured":
          await this.updatePaymentStatus(
            payload.payment.entity.order_id,
            "completed",
            payload.payment.entity.id
          );
          break;

        case "payment.failed":
          await this.updatePaymentStatus(
            payload.payment.entity.order_id,
            "failed"
          );
          break;

        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      return {
        success: true,
        code: 200,
        message: "Webhook processed",
      };
    } catch (error) {
      console.error("Error processing webhook:", error);
      return {
        success: false,
        code: 500,
        message: "Error processing webhook",
      };
    }
  }
}
