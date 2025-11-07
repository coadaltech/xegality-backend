import { t } from "elysia";

// Razorpay Order Creation Types
const CreateOrderSchema = t.Object({
  amount: t.Number({ minimum: 1, description: "Amount in paise (e.g., 1000 = ₹10)" }),
  currency: t.String({ default: "INR", description: "Currency code" }),
  receipt: t.String({ description: "Unique receipt identifier" }),
  notes: t.Optional(t.Record(t.String(), t.String())),
  partial_payment: t.Optional(t.Boolean({ default: false })),
  customer_id: t.Optional(t.String()),
});

const PaymentVerificationSchema = t.Object({
  razorpay_order_id: t.String(),
  razorpay_payment_id: t.String(),
  razorpay_signature: t.String(),
});

const PaymentWebhookSchema = t.Object({
  event: t.String(),
  account_id: t.String(),
  contains: t.Array(t.String()),
  payload: t.Record(t.String(), t.Any()),
  created_at: t.Number(),
});

// Razorpay Response Types
interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

interface RazorpayPaymentResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  notes: Record<string, string>;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  acquirer_data: Record<string, any>;
  created_at: number;
}

interface PaymentVerificationResult {
  success: boolean;
  payment_id?: string;
  order_id?: string;
  error?: string;
}

// Frontend Payment Types
interface PaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
}

// Database Payment Record Types
interface PaymentRecord {
  id: string;
  user_id: number;
  order_id: string;
  payment_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  receipt: string;
  notes?: Record<string, string>;
  created_at: Date;
  updated_at: Date;
}

export { 
  CreateOrderSchema, 
  PaymentVerificationSchema, 
  PaymentWebhookSchema,
  orderSchema 
};

export type {
  RazorpayOrderResponse,
  RazorpayPaymentResponse,
  PaymentVerificationResult,
  PaymentOptions,
  PaymentRecord
};
