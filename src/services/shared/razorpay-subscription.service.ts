import Razorpay from "razorpay";
import { SubscriptionService } from "./subscription.service";
import { SUBSCRIPTION_PLANS } from "../../types/subscription.types";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const RazorpaySubscriptionService = {
  async createSubscriptionOrder(userId: number, planId: string) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      throw new Error("Invalid plan ID");
    }

    const options = {
      amount: plan.price, // amount in paise
      currency: "INR",
      receipt: `sub_${userId}_${Date.now()}`,
      notes: {
        user_id: userId.toString(),
        plan_id: planId,
        plan_name: plan.name,
      },
    };

    const order = await razorpay.orders.create(options);
    return { order, plan };
  },

  async verifySubscriptionPayment(paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const body =
      paymentData.razorpay_order_id + "|" + paymentData.razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    return expectedSignature === paymentData.razorpay_signature;
  },

  async activateSubscription(userId: number, paymentData: any, orderData: any) {
    const isValid = await this.verifySubscriptionPayment(paymentData);
    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    // Get order details to extract plan info
    const order = await razorpay.orders.fetch(paymentData.razorpay_order_id);
    const planId = order.notes?.plan_id as string;
    if (!planId) {
      throw new Error("Plan ID not found in order");
    }

    const subscription = await SubscriptionService.createSubscription(userId, {
      plan_id: planId,
      payment_method: "razorpay",
      transaction_id: paymentData.razorpay_payment_id,
    });

    return subscription;
  },
};
