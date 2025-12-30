export interface CreateSubscriptionRequest {
  plan_id: string;
  payment_method?: string;
  transaction_id?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  features: string[];
  user_type: "student" | "lawyer";
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // Student Plans
  {
    id: "basic",
    name: "Go Plan",
    price: 99900, // Free plan
    duration_months: 1,
    features: ["Access to legal research tools", "Basic case study library", "Community forums", "Email support", "Mobile app access"],
    user_type: "student"
  },
  {
    id: "student",
    name: "Student Pro",
    price: 549900, // ₹1499 in paise
    duration_months: 6,
    features: ["Everything in Basic", "Advanced research database", "Internship opportunities", "Mentorship program access", "Priority support", "Study group tools"],
    user_type: "student"
  },
  {
    id: "premium",
    name: "Premium",
    price: 1099900, // ₹2999 in paise
    duration_months: 12,
    features: ["Everything in Student Pro", "1-on-1 lawyer consultations", "Exclusive networking events", "Job placement assistance", "Professional portfolio builder", "Mock interview sessions"],
    user_type: "student"
  },
  // Lawyer Plans
  {
    id: "starter",
    name: "Go Plan",
    price: 249900, // Free plan
    duration_months: 1,
    features: ["Up to 25 active cases", "5GB secure cloud storage", "Basic client portal", "Email support", "Mobile app access"],
    user_type: "lawyer"
  },
  {
    id: "professional",
    name: "Professional",
    price: 1199900, // ₹11999 in paise
    duration_months: 6,
    features: ["Unlimited cases", "50GB secure cloud storage", "Advanced client portal", "Priority email support", "Advanced analytics", "Custom branding"],
    user_type: "lawyer"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 2499900, // ₹24999 in paise
    duration_months: 12,
    features: ["Everything in Professional", "Unlimited storage", "White-label solution", "24/7 phone support", "Advanced security", "API access"],
    user_type: "lawyer"
  }
];