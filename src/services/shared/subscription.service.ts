import db from "../../config/db";
import { subscription_model } from "../../models/shared/subscription.model";
import { user_model } from "../../models/shared/user.model";
import { CreateSubscriptionRequest, SUBSCRIPTION_PLANS } from "../../types/subscription.types";
import { eq, and, desc } from "drizzle-orm";

export class SubscriptionService {
  static async createSubscription(userId: number, data: CreateSubscriptionRequest) {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === data.plan_id);
    if (!plan) {
      throw new Error("Invalid plan ID");
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.duration_months);

    // Cancel existing active subscription
    await this.cancelActiveSubscription(userId);

    const subscription = await db.insert(subscription_model).values({
      user_id: userId,
      plan_id: plan.id,
      plan_name: plan.name,
      price: plan.price,
      start_date: startDate,
      end_date: endDate,
      payment_method: data.payment_method,
      transaction_id: data.transaction_id,
      status: "active"
    }).returning();

    return subscription[0];
  }

  static async getUserSubscription(userId: number) {
    const subscription = await db
      .select()
      .from(subscription_model)
      .where(and(
        eq(subscription_model.user_id, userId),
        eq(subscription_model.status, "active")
      ))
      .orderBy(desc(subscription_model.created_at))
      .limit(1);

    return subscription[0] || null;
  }

  static async cancelActiveSubscription(userId: number) {
    await db
      .update(subscription_model)
      .set({ 
        status: "cancelled",
        updated_at: new Date()
      })
      .where(and(
        eq(subscription_model.user_id, userId),
        eq(subscription_model.status, "active")
      ));
  }

  static async getSubscriptionHistory(userId: number) {
    return await db
      .select()
      .from(subscription_model)
      .where(eq(subscription_model.user_id, userId))
      .orderBy(desc(subscription_model.created_at));
  }

  static async checkExpiredSubscriptions() {
    const now = new Date();
    await db
      .update(subscription_model)
      .set({ 
        status: "expired",
        updated_at: now
      })
      .where(and(
        eq(subscription_model.status, "active"),
        // end_date < now
      ));
  }

  static getAvailablePlans(userType: "student" | "lawyer") {
    return SUBSCRIPTION_PLANS.filter(plan => plan.user_type === userType);
  }

  static hasAccessToPlan(currentPlanId: string, requiredPlanId: string, userType: "student" | "lawyer"): boolean {
    const planHierarchy = userType === "student" 
      ? ["basic", "student", "premium"]
      : ["starter", "professional", "enterprise"];
    
    const currentIndex = planHierarchy.indexOf(currentPlanId);
    const requiredIndex = planHierarchy.indexOf(requiredPlanId);
    
    return currentIndex >= requiredIndex;
  }
}