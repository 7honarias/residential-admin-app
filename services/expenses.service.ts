import { generateIdempotencyKey } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== INTERFACES ====================

export interface FetchExpensesOptions {
  status?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface FetchExpensesParams {
  token: string;
  complexId: string;
  options?: FetchExpensesOptions;
}

export interface FetchExpenseDetailParams {
  token: string;
  complexId: string;
  expenseId: string;
}

export interface RegisterExpensePaymentPayload {
  expense_id: string;
  amount_paid: number;
  payment_method: 'TRANSFER' | 'CASH' | 'CHECK' | 'DEBIT';
  payment_date: string;
  reference_code?: string;
  notes?: string;
  idempotency_key?: string;
}

export interface RegisterExpensePaymentParams {
  token: string;
  complexId: string;
  payload: RegisterExpensePaymentPayload;
}

export interface CreateExpensePayload {
  supplier_id: string;
  category_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  description: string;
  total_amount: number;
}

export interface CreateExpenseParams {
  token: string;
  complexId: string;
  payload: CreateExpensePayload;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  accountingCode: string | null;
  isActive: boolean;
}

const normalizeExpenseCategory = (raw: Record<string, unknown>): ExpenseCategory => ({
  id: String(raw.id ?? ''),
  name: String(raw.name ?? 'Categoria sin nombre'),
  description: (raw.description as string | null) ?? null,
  accountingCode: (raw.accounting_code as string | null) ?? (raw.accountingCode as string | null) ?? null,
  isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
});

const parseExpenseCategoriesResponse = (data: unknown): ExpenseCategory[] => {
  if (!data || typeof data !== 'object') return [];

  const asRecord = data as Record<string, unknown>;
  const nestedData = (asRecord.data as Record<string, unknown> | undefined) ?? {};

  const items =
    (asRecord.categories as Record<string, unknown>[] | undefined) ??
    (asRecord.expense_categories as Record<string, unknown>[] | undefined) ??
    (nestedData.categories as Record<string, unknown>[] | undefined) ??
    (nestedData.expense_categories as Record<string, unknown>[] | undefined) ??
    ((asRecord.data as Record<string, unknown>[]) ?? []);

  if (!Array.isArray(items)) return [];

  return items.map(normalizeExpenseCategory).filter((category) => category.id);
};

// ==================== GET: List Expenses ====================

export const fetchExpenses = async ({ token, complexId, options }: FetchExpensesParams) => {
  const opts = options ?? {};
  const queryParams = new URLSearchParams({
    complexId,
    page: (opts.cursor || 1).toString(),
    pageSize: (opts.limit || 25).toString(),
    ...(opts.status !== 'ALL' && { status: opts.status }),
    ...(opts.search && { search: opts.search })
  });

  const response = await fetch(`${API_URL}/getExpensesList?${queryParams}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Error fetching expenses');
  
  const result = await response.json();

  return {
    expenses: result.data || [],
    nextCursor: result.pagination.page < result.pagination.totalPages 
      ? (result.pagination.page + 1).toString() 
      : null,
    total: result.pagination.total
  };
};

// ==================== GET: Expense Categories ====================

export const fetchExpenseCategories = async ({ token, complexId }: { token: string; complexId: string }) => {
  const params = new URLSearchParams({ complexId });
  const endpoints = ['getExpenseCategoriesList', 'getExpenseCategories', 'getExpensesCategories'];

  for (const endpoint of endpoints) {
    const response = await fetch(`${API_URL}/${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return parseExpenseCategoriesResponse(data);
    }

    if (response.status !== 404) {
      throw new Error(data.error || data.message || 'Error cargando categorias de gastos');
    }
  }

  throw new Error('No se encontro endpoint de categorias de gasto (getExpenseCategoriesList/getExpenseCategories/getExpensesCategories)');
};

// ==================== POST: Register Payment ====================

export const registerExpensePayment = async ({
  token,
  complexId,
  payload,
}: RegisterExpensePaymentParams) => {
  try {
    const params = new URLSearchParams({ complexId });

    // Auto-generate idempotency_key to prevent duplicate payments on double-click
    const enrichedPayload: RegisterExpensePaymentPayload = {
      ...payload,
      idempotency_key: payload.idempotency_key || generateIdempotencyKey(),
    };

    const response = await fetch(`${API_URL}/manageExpense?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'REGISTER_PAYMENT',
        payload: enrichedPayload,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error registrando el pago al proveedor');
    }

    return data;
  } catch (error) {
    console.error('Error en registerExpensePayment:', error);
    throw error;
  }
};

// ==================== POST: Create Expense ====================

export const createExpense = async ({ token, complexId, payload }: CreateExpenseParams) => {
  try {
    const params = new URLSearchParams({ complexId });

    const response = await fetch(`${API_URL}/manageExpense?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'CREATE_EXPENSE',
        payload,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error registrando el gasto');
    }

    return data;
  } catch (error) {
    console.error('Error en createExpense:', error);
    throw error;
  }
};
