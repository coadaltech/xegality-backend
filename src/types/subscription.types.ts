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
    name: "Free",
    price: 0, // Free plan
    duration_months: 1,
    features: ["Access to legal research tools", "Basic case study library", "Community forums", "Email support", "Mobile app access"],
    user_type: "student"
  },
  {
    id: "student",
    name: "Student Pro",
    price: 149900, // ₹1499 in paise
    duration_months: 1,
    features: ["Everything in Basic", "Advanced research database", "Internship opportunities", "Mentorship program access", "Priority support", "Study group tools"],
    user_type: "student"
  },
  {
    id: "premium",
    name: "Premium",
    price: 299900, // ₹2999 in paise
    duration_months: 1,
    features: ["Everything in Student Pro", "1-on-1 lawyer consultations", "Exclusive networking events", "Job placement assistance", "Professional portfolio builder", "Mock interview sessions"],
    user_type: "student"
  },
  // Lawyer Plans
  {
    id: "starter",
    name: "Free",
    price: 0, // Free plan
    duration_months: 1,
    features: ["Up to 25 active cases", "5GB secure cloud storage", "Basic client portal", "Email support", "Mobile app access"],
    user_type: "lawyer"
  },
  {
    id: "professional",
    name: "Professional",
    price: 649900, // ₹6499 in paise
    duration_months: 1,
    features: ["Unlimited cases", "50GB secure cloud storage", "Advanced client portal", "Priority email support", "Advanced analytics", "Custom branding"],
    user_type: "lawyer"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 1299900, // ₹12999 in paise
    duration_months: 1,
    features: ["Everything in Professional", "Unlimited storage", "White-label solution", "24/7 phone support", "Advanced security", "API access"],
    user_type: "lawyer"
  }
];