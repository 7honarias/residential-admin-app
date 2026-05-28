const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================================
// TIPOS
// ============================================================

export interface ComplexBudget {
  id: string;
  complex_id: string;
  period_year: number;
  period_month: number; // 0 = presupuesto anual
  total_amount: number;
  approved_at: string | null;
  approved_by: string | null;
  assembly_id: string | null;
  created_at: string;
}

export interface FetchComplexBudgetsParams {
  token: string;
  complexId: string;
}

export interface FetchComplexBudgetByYearParams {
  token: string;
  complexId: string;
  year: number;
}

export interface SaveComplexBudgetParams {
  token: string;
  complexId: string;
  period_year: number;
  total_amount: number;
  assembly_id?: string | null;
}

// ============================================================
// FUNCIONES DE SERVICIO
// ============================================================

/**
 * Obtiene todos los presupuestos anuales del conjunto (ordenados por año DESC).
 */
export const fetchComplexBudgets = async (
  params: FetchComplexBudgetsParams
): Promise<ComplexBudget[]> => {
  const response = await fetch(
    `${API_URL}/getComplexBudget?complexId=${params.complexId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error obteniendo el presupuesto");
  }

  const data = await response.json();
  return data.budgets ?? [];
};

/**
 * Obtiene el presupuesto de un año específico (o null si no existe).
 */
export const fetchComplexBudgetByYear = async (
  params: FetchComplexBudgetByYearParams
): Promise<ComplexBudget | null> => {
  const response = await fetch(
    `${API_URL}/getComplexBudget?complexId=${params.complexId}&year=${params.year}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error obteniendo el presupuesto");
  }

  const data = await response.json();
  return data.budget ?? null;
};

/**
 * Crea o actualiza el presupuesto anual del conjunto.
 * Si ya existe un presupuesto para el año indicado, lo sobreescribe.
 */
export const saveComplexBudget = async (
  params: SaveComplexBudgetParams
): Promise<ComplexBudget> => {
  const response = await fetch(
    `${API_URL}/manageComplexBudget?complexId=${params.complexId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify({
        period_year: params.period_year,
        total_amount: params.total_amount,
        assembly_id: params.assembly_id ?? null,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error guardando el presupuesto");
  }

  const data = await response.json();
  return data.budget;
};
