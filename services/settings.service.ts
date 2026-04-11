const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AdministrationConfig {
  id?: string;
  complex_id: string;
  administration_value: number;
  effective_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GetAdminConfigParams {
  token: string;
  complexId: string;
}

export interface UpdateAdminConfigParams {
  token: string;
  complexId: string;
  administrationValue: number;
}

/**
 * Fetch the current administration configuration for a complex
 */
export const fetchAdministrationConfig = async (
  params: GetAdminConfigParams
): Promise<AdministrationConfig | null> => {
  try {
    const response = await fetch(
      `${API_URL}/getAdministrationConfig?complexId=${params.complexId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Error fetching administration config:", response.status);
      return null;
    }

    const data = await response.json();
    return data.config || null;
  } catch (error) {
    console.error("Error fetching administration config:", error);
    return null;
  }
};

/**
 * Update the administration value for a complex
 */
export const updateAdministrationConfig = async (
  params: UpdateAdminConfigParams
): Promise<AdministrationConfig | null> => {
  try {
    const response = await fetch(
      `${API_URL}/updateAdministrationConfig?complexId=${params.complexId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
        body: JSON.stringify({
          administration_value: params.administrationValue,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Error updating administration config"
      );
    }

    const data = await response.json();
    return data.config;
  } catch (error) {
    console.error("Error updating administration config:", error);
    throw error;
  }
};

/**
 * Get apartment details with calculated administration cost
 */
export interface ApartmentWithAdminCost {
  id: string;
  number: string;
  block_name: string;
  coefficient: number;
  administration_cost: number;
  owner_name?: string;
  owner_email?: string;
}

export const fetchApartmentsWithAdminCost = async (
  params: GetAdminConfigParams
): Promise<ApartmentWithAdminCost[]> => {
  try {
    const response = await fetch(
      `${API_URL}/getApartmentsWithAdminCost?complexId=${params.complexId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Error fetching apartments with admin cost:",
        response.status
      );
      return [];
    }

    const data = await response.json();
    return data.apartments || [];
  } catch (error) {
    console.error("Error fetching apartments with admin cost:", error);
    return [];
  }
};

/**
 * Interface for apartment with pricing information
 */
export interface ApartmentAdminCost {
  apartment_id: string;
  apartment_number: string;
  block_name: string;
  coefficient: number; // Now comes from coefficient_pricing table
  coefficient_pricing_id?: string;
  custom_admin_cost: number; // Price from coefficient_pricing table
  meters?: number;
  owner_name?: string;
  owner_email?: string;
}

export interface UpdateApartmentAdminCostParams {
  token: string;
  complexId: string;
  apartments: Array<{
    apartment_id: string;
    custom_admin_cost: number;
  }>;
}

/**
 * Fetch apartments with custom administration costs (editable mode)
 */
export const fetchApartmentsWithCustomCosts = async (
  params: GetAdminConfigParams
): Promise<ApartmentAdminCost[]> => {
  try {
    const response = await fetch(
      `${API_URL}/getApartmentsWithCustomCosts?complexId=${params.complexId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Error fetching apartments with custom costs:",
        response.status
      );
      return [];
    }

    const data = await response.json();
    return data.apartments || [];
  } catch (error) {
    console.error("Error fetching apartments with custom costs:", error);
    return [];
  }
};

/**
 * Update custom administration costs for multiple apartments
 */
export const updateApartmentAdminCosts = async (
  params: UpdateApartmentAdminCostParams
): Promise<ApartmentAdminCost[] | null> => {
  try {
    const response = await fetch(
      `${API_URL}/updateApartmentAdminCosts?complexId=${params.complexId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
        body: JSON.stringify({
          apartments: params.apartments,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Error updating apartment admin costs"
      );
    }

    const data = await response.json();
    return data.apartments || null;
  } catch (error) {
    console.error("Error updating apartment admin costs:", error);
    throw error;
  }
};

/**
 * Interface for Coefficient Pricing configuration
 */
export interface CoefficientPricing {
  id: string;
  complex_id: string;
  coefficient: number;
  meters: number;
  price: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCoefficientPricingParams {
  token: string;
  complexId: string;
  coefficient: number;
  meters?: number;
  price: number;
}

export interface UpdateCoefficientPricingParams {
  token: string;
  complexId: string;
  pricings: Array<{
    id: string;
    price: number;
    meters?: number;
  }>;
}

/**
 * Fetch all coefficient pricing configurations for a complex
 */
export const fetchCoefficientPricing = async (
  params: GetAdminConfigParams
): Promise<CoefficientPricing[]> => {
  try {
    const response = await fetch(
      `${API_URL}/getCoefficientPricing?complexId=${params.complexId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Error fetching coefficient pricing:", response.status);
      return [];
    }

    const data = await response.json();
    return data.pricings || [];
  } catch (error) {
    console.error("Error fetching coefficient pricing:", error);
    return [];
  }
};

/**
 * Update coefficient pricing for a complex
 */
export const updateCoefficientPricing = async (
  params: UpdateCoefficientPricingParams
): Promise<CoefficientPricing[] | null> => {
  try {
    const response = await fetch(
      `${API_URL}/updateCoefficientPricing?complexId=${params.complexId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
        body: JSON.stringify({
          pricings: params.pricings,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Error updating coefficient pricing"
      );
    }

    const data = await response.json();
    return data.pricings || null;
  } catch (error) {
    console.error("Error updating coefficient pricing:", error);
    throw error;
  }
};

/**
 * Create a new coefficient pricing configuration for a complex
 */
export const createCoefficientPricing = async (
  params: CreateCoefficientPricingParams
): Promise<CoefficientPricing> => {
  try {
    const response = await fetch(
      `${API_URL}/createCoefficientPricing?complexId=${params.complexId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
        body: JSON.stringify({
          coefficient: params.coefficient,
          meters: params.meters || 0,
          price: params.price,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Error creating coefficient pricing"
      );
    }

    const data = await response.json();
    return data.pricing;
  } catch (error) {
    console.error("Error creating coefficient pricing:", error);
    throw error;
  }
};

/**
 * Fetch all coefficient pricing configurations for a complex
 */
export const getCoefficientPricingList = async (
  params: GetAdminConfigParams
): Promise<CoefficientPricing[]> => {
  try {
    const response = await fetch(
      `${API_URL}/getCoefficientPricingList?complexId=${params.complexId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Error fetching coefficient pricing list:", response.status);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching coefficient pricing list:", error);
    return [];
  }
};

/**
 * Update a single coefficient pricing configuration
 */
export interface UpdateSingleCoefficientPricingParams {
  token: string;
  complexId: string;
  pricingId: string;
  coefficient: number;
  meters?: number;
  price: number;
}

export const updateSingleCoefficientPricing = async (
  params: UpdateSingleCoefficientPricingParams
): Promise<CoefficientPricing> => {
  try {
    const response = await fetch(
      `${API_URL}/updateCoefficientPricing?complexId=${params.complexId}&pricingId=${params.pricingId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
        body: JSON.stringify({
          coefficient: params.coefficient,
          meters: params.meters || 0,
          price: params.price,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Error updating coefficient pricing"
      );
    }

    const data = await response.json();
    return data.pricing;
  } catch (error) {
    console.error("Error updating coefficient pricing:", error);
    throw error;
  }
};

/**
 * Interface for PlaceToPay credentials configuration
 */
export interface PlaceToPayConfig {
  id?: string;
  complex_id: string;
  merchant_id: string;
  public_key: string;
  private_key: string;
  created_at?: string;
  updated_at?: string;
}

export interface GetPlaceToPayConfigParams {
  token: string;
  complexId: string;
}

export interface UpdatePlaceToPayConfigParams {
  token: string;
  complexId: string;
  merchantId: string;
  publicKey: string;
  privateKey: string;
}

/**
 * Fetch PlaceToPay configuration for a complex
 */
export const fetchPlaceToPayConfig = async (
  params: GetPlaceToPayConfigParams
): Promise<PlaceToPayConfig | null> => {
  try {
    const response = await fetch(
      `${API_URL}/getPlaceToPayConfig?complexId=${params.complexId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error("Error fetching PlaceToPay config:", response.status);
      return null;
    }

    const data = await response.json();
    return data.config || null;
  } catch (error) {
    console.error("Error fetching PlaceToPay config:", error);
    return null;
  }
};


/**
 * ==========================================
 * FINANCIAL SETTINGS (INTERESTS & MORA)
 * ==========================================
 */

export interface FinancialSettings {
  interestType: "PERCENTAGE" | "FIXED_AMOUNT";
  interestRate: number;
  gracePeriodDays: number;
}

export interface GetFinancialSettingsParams {
  token: string;
  complexId: string;
}

export interface UpdateFinancialSettingsParams {
  token: string;
  complexId: string;
  interestType: "PERCENTAGE" | "FIXED_AMOUNT";
  interestRate: number;
  gracePeriodDays: number;
}

/**
 * Fetch financial settings (interests and grace periods) for a complex
 */
export const fetchFinancialSettings = async (
  params: GetFinancialSettingsParams
): Promise<FinancialSettings | null> => {
  try {
    const response = await fetch(
      `${API_URL}/getFinancialSettings?complexId=${params.complexId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Si no hay configuración aún, retornamos null para que el form use los valores por defecto
        return null;
      }
      console.error("Error fetching financial settings:", response.status);
      return null;
    }

    const data = await response.json();
    
    // Si la data existe, mapeamos de snake_case (BD) a camelCase (Frontend)
    if (data.config) {
      return {
        interestType: data.config.interest_type,
        interestRate: Number(data.config.interest_rate),
        gracePeriodDays: Number(data.config.grace_period_days),
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching financial settings:", error);
    return null;
  }
};

/**
 * Update financial settings for a complex
 */
export const updateFinancialSettings = async (
  params: UpdateFinancialSettingsParams
): Promise<FinancialSettings | null> => {
  try {
    const response = await fetch(
      `${API_URL}/updateFinancialSettings?complexId=${params.complexId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
        body: JSON.stringify({
          // Mapeamos de camelCase (Frontend) a snake_case (BD)
          interest_type: params.interestType,
          interest_rate: params.interestRate,
          grace_period_days: params.gracePeriodDays,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Error updating financial settings"
      );
    }

    const data = await response.json();
    
    // Retornamos la data mapeada al frontend
    return {
      interestType: data.config.interest_type,
      interestRate: Number(data.config.interest_rate),
      gracePeriodDays: Number(data.config.grace_period_days),
    };
  } catch (error) {
    console.error("Error updating financial settings:", error);
    throw error;
  }
};

/**
 * ==========================================
 * BILLING CONFIGURATION
 * ==========================================
 */

export type InvoiceGenerationMode = "AUTOMATIC" | "EXCEL_UPLOAD";
export type PaymentMode = "PAYMENT_GATEWAY" | "REDIRECT_LINK";

export interface BillingConfig {
  invoiceGenerationMode: InvoiceGenerationMode;
  paymentMode: PaymentMode;
  /** Day of month (1-28) on which invoices are auto-generated */
  invoiceGenerationDay?: number;
  /** Days after generation day before invoice is considered overdue */
  paymentDueDays?: number;
  merchantId?: string;
  publicKey?: string;
  privateKey?: string;
  redirectPaymentUrl?: string;
}

export interface GetBillingConfigParams {
  token: string;
  complexId: string;
}

export interface UpdateBillingConfigParams extends GetBillingConfigParams {
  config: BillingConfig;
}

/**
 * Fetch billing configuration for a complex
 */
export const fetchBillingConfig = async (
  params: GetBillingConfigParams
): Promise<BillingConfig | null> => {
  try {
    const response = await fetch(
      `${API_URL}/getBillingConfig?complexId=${params.complexId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      console.error("Error fetching billing config:", response.status);
      return null;
    }

    const data = await response.json();
    if (!data.config) return null;

    return {
      invoiceGenerationMode: data.config.invoice_generation_mode ?? "AUTOMATIC",
      paymentMode: data.config.payment_mode ?? "PAYMENT_GATEWAY",
      invoiceGenerationDay: data.config.invoice_generation_day != null
        ? Number(data.config.invoice_generation_day)
        : undefined,
      paymentDueDays: data.config.payment_due_days != null
        ? Number(data.config.payment_due_days)
        : undefined,
      merchantId: data.config.merchant_id,
      publicKey: data.config.public_key,
      privateKey: data.config.private_key,
      redirectPaymentUrl: data.config.redirect_payment_url,
    };
  } catch (error) {
    console.error("Error fetching billing config:", error);
    return null;
  }
};

/**
 * Update billing configuration for a complex
 */
export const updateBillingConfig = async (
  params: UpdateBillingConfigParams
): Promise<BillingConfig | null> => {
  try {
    const response = await fetch(
      `${API_URL}/updateBillingConfig?complexId=${params.complexId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
        body: JSON.stringify({
          invoice_generation_mode: params.config.invoiceGenerationMode,
          payment_mode: params.config.paymentMode,
          invoice_generation_day: params.config.invoiceGenerationDay,
          payment_due_days: params.config.paymentDueDays,
          merchant_id: params.config.merchantId,
          public_key: params.config.publicKey,
          private_key: params.config.privateKey,
          redirect_payment_url: params.config.redirectPaymentUrl,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error updating billing config");
    }

    const data = await response.json();
    if (!data.config) return null;

    return {
      invoiceGenerationMode: data.config.invoice_generation_mode ?? "AUTOMATIC",
      paymentMode: data.config.payment_mode ?? "PAYMENT_GATEWAY",
      invoiceGenerationDay: data.config.invoice_generation_day != null
        ? Number(data.config.invoice_generation_day)
        : undefined,
      paymentDueDays: data.config.payment_due_days != null
        ? Number(data.config.payment_due_days)
        : undefined,
      merchantId: data.config.merchant_id,
      publicKey: data.config.public_key,
      privateKey: data.config.private_key,
      redirectPaymentUrl: data.config.redirect_payment_url,
    };
  } catch (error) {
    console.error("Error updating billing config:", error);
    throw error;
  }
};