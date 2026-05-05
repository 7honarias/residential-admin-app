const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== TYPES ====================

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'TRIAL' | 'CANCELLED' | 'PENDING';
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface VestapPlanFeature {
  name: string;
  included: boolean;
}

export interface VestapPlan {
  id: string;
  name: string;
  billing_cycle: BillingCycle;
  price: number;
  is_active: boolean;
  is_per_unit: boolean;
  description: string | null;
  max_apartments: number | null;
  max_blocks: number | null;
  is_recommended: boolean;
  features: VestapPlanFeature[];
}

export interface ComplexSubscription {
  id: string;
  complex_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  plan: VestapPlan;
}

export interface VestapInvoice {
  id: string;
  complex_id: string;
  subscription_id: string;
  amount: number;
  status: InvoiceStatus;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  paid_at: string | null;
}

export interface PaymentIntentResult {
  invoice: VestapInvoice;
  payment_url?: string;
  reference?: string;
}

// ==================== PARAMS ====================

interface BillingParams {
  token: string;
  complexId: string;
}

interface PaymentIntentParams extends BillingParams {
  planId: string;
}

// ==================== SERVICE FUNCTIONS ====================

/**
 * Retrieves the active subscription for a complex, including a JOIN with vestap_plans.
 * Returns null if no subscription exists yet.
 */
export const getComplexSubscription = async ({
  token,
  complexId,
}: BillingParams): Promise<ComplexSubscription | null> => {
  try {
    const response = await fetch(
      `${API_URL}/getComplexSubscription?complexId=${encodeURIComponent(complexId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 404) return null;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { error?: string }).error ??
          `Error ${response.status} al obtener la suscripción`
      );
    }

    const data = await response.json();
    return (data as { subscription: ComplexSubscription }).subscription ?? null;
  } catch (error) {
    console.error('[vestapBilling] getComplexSubscription:', error);
    throw error;
  }
};

/**
 * Retrieves all active Vestap plans.
 * Plans are global (not per-complex).
 */
export const getVestapPlans = async ({
  token,
}: Pick<BillingParams, 'token'>): Promise<VestapPlan[]> => {
  try {
    const response = await fetch(`${API_URL}/getVestapPlans`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { error?: string }).error ??
          `Error ${response.status} al obtener los planes`
      );
    }

    const data = await response.json();
    return (data as { plans: VestapPlan[] }).plans ?? [];
  } catch (error) {
    console.error('[vestapBilling] getVestapPlans:', error);
    throw error;
  }
};

/**
 * Retrieves the billing history (vestap_invoices) for a complex,
 * ordered by creation date descending.
 */
export const getVestapInvoices = async ({
  token,
  complexId,
}: BillingParams): Promise<VestapInvoice[]> => {
  try {
    const response = await fetch(
      `${API_URL}/getVestapInvoices?complexId=${encodeURIComponent(complexId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { error?: string }).error ??
          `Error ${response.status} al obtener el historial de facturas`
      );
    }

    const data = await response.json();
    return (data as { invoices: VestapInvoice[] }).invoices ?? [];
  } catch (error) {
    console.error('[vestapBilling] getVestapInvoices:', error);
    throw error;
  }
};

/**
 * Simulates a payment intent creation. Generates a PENDING invoice in vestap_invoices
 * and returns the invoice along with an optional payment URL for a future payment gateway.
 */
export const generatePaymentIntent = async ({
  token,
  complexId,
  planId,
}: PaymentIntentParams): Promise<PaymentIntentResult> => {
  try {
    const response = await fetch(`${API_URL}/generatePaymentIntent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ complexId, planId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { error?: string }).error ??
          `Error ${response.status} al generar el intento de pago`
      );
    }

    const data = await response.json();
    return data as PaymentIntentResult;
  } catch (error) {
    console.error('[vestapBilling] generatePaymentIntent:', error);
    throw error;
  }
};
