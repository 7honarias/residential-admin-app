import {
  IInvoiceDetail,
  IManualPaymentPayload,
  IManualPaymentResponse,
  IInvoicesFilterOptions,
  IPaymentsFilterOptions,
  IPaymentsListResponse,
  IApartmentForAutocomplete,
} from '@/app/dashboard/finances/invoices.types';
import { generateIdempotencyKey } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== INTERFACES ====================

export interface FetchInvoicesParams {
  token: string;
  complexId: string;
  options?: IInvoicesFilterOptions;
}

export interface FetchInvoiceDetailParams {
  token: string;
  complexId: string;
  invoiceId: string;
}

export interface FetchApartmentsForAutocompleteParams {
  token: string;
  complexId: string;
  search: string;
}

export interface RegisterManualPaymentParams {
  token: string;
  complexId: string;
  payload: IManualPaymentPayload;
}

export interface FetchPaymentListParams {
  token: string;
  complexId: string;
  options?: IPaymentsFilterOptions;
}

export interface FetchAllPaymentsForExportParams {
  token: string;
  complexId: string;
  options?: Omit<IPaymentsFilterOptions, 'cursor' | 'limit'> & {
    limitPerPage?: number;
    maxPages?: number;
    maxRecords?: number;
  };
}

export interface FetchBlocksParams {
  token: string;
  complexId: string;
}

export interface FetchApartmentsByBlockParams {
  token: string;
  complexId: string;
  blockId: string;
}

// ==================== GET: List Invoices ====================

/**
 * Fetch invoices with cursor-based pagination and filters
 * Pattern: GET /getInvoicesList?complexId=UUID&status=PENDING&limit=20&cursor=...
 */
export const fetchInvoices = async ({ token, complexId, options }: FetchInvoicesParams) => {
  // Construimos los query parameters EXACTAMENTE como los espera el backend
  const opts = options ?? {};
  const queryParams = new URLSearchParams({
    complexId, // Supongo que pasas el complexId así o en la URL
    page: (opts.cursor || 1).toString(), // Trataremos el cursor como número de página
    pageSize: '25', // El límite que acepta tu backend
    ...(opts.status !== 'ALL' && { status: opts.status }),
    ...(opts.apartmentSearch && { apartmentSearch: opts.apartmentSearch })
  });

  const response = await fetch(`${API_URL}/getListInvoice?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Error fetching invoices');
  
  const result = await response.json();

  // Mapeamos la respuesta del backend a lo que espera tu componente de React
  return {
    invoices: result.data || [],
    // Si la página actual es menor que el total de páginas, el "nextCursor" será la página siguiente
    nextCursor: result.pagination.page < result.pagination.totalPages 
      ? (result.pagination.page + 1).toString() 
      : null,
    total: result.pagination.total
  };
};

// ==================== GET: Invoice Detail ====================

/**
 * Fetch single invoice with payment history
 * Pattern: GET /getInvoiceDetail?complexId=UUID&invoiceId=UUID
 */
export const fetchInvoiceDetail = async ({
  token,
  complexId,
  invoiceId,
}: FetchInvoiceDetailParams): Promise<IInvoiceDetail> => {
  try {
    const params = new URLSearchParams({
      complexId,
      invoiceId,
    });

    const response = await fetch(
      `${API_URL}/getInvoiceDetail?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || 'Error fetching invoice detail');
    }

    // Safely return invoice detail with fallback for missing payment history
    return {
      ...data,
      payments: data?.payments || [],
    } as IInvoiceDetail;
  } catch (error) {
    console.error('Error en fetchInvoiceDetail:', error);
    throw error;
  }
};

// ==================== GET: Autocomplete Apartments ====================

/**
 * Fetch apartments for manual payment selector autocomplete
 * Pattern: GET /getApartmentsAutocomplete?complexId=UUID&search=101
 */
export const fetchApartmentsAutocomplete = async ({
  token,
  complexId,
  search,
}: FetchApartmentsForAutocompleteParams): Promise<IApartmentForAutocomplete[]> => {
  try {
    const params = new URLSearchParams({
      complexId,
      search,
    });

    const response = await fetch(
      `${API_URL}/getApartmentsAutocomplete?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error fetching apartments:', data);
      return []; // Retornar array vacío en error de autocomplete
    }

    // Safely return apartments array with fallback
    return (data?.apartments || []) as IApartmentForAutocomplete[];
  } catch (error) {
    console.error('Error en fetchApartmentsAutocomplete:', error);
    return [];
  }
};

// ==================== POST: Manual Payment ====================

/**
 * Register manual payment for an apartment
 * Pattern: POST /registerManualPayment
 * Body: { action: "REGISTER_PAYMENT", payload: { ... } }
 * The payload automatically includes an idempotency_key to prevent duplicate payments
 */
export const registerManualPayment = async ({
  token,
  complexId,
  payload,
}: RegisterManualPaymentParams): Promise<IManualPaymentResponse> => {
  try {
    const params = new URLSearchParams({ complexId });

    // Auto-generate idempotency_key if not provided
    const enrichedPayload: IManualPaymentPayload = {
      ...payload,
      idempotency_key: payload.idempotency_key || generateIdempotencyKey(),
    };

    console.log('💳 Registering manual payment with idempotency_key:', enrichedPayload.idempotency_key);

    const response = await fetch(
      `${API_URL}/managePayment?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'REGISTER_PAYMENT',
          payload: enrichedPayload,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error registering payment:', data);
      throw new Error(data.error || 'Error registering payment');
    }

    return data as IManualPaymentResponse;
  } catch (error) {
    console.error('Error en registerManualPayment:', error);
    throw error;
  }
};

// ==================== GET: Payment List ====================

/**
 * Fetch payment list / history for complex with cursor-based pagination
 * Pattern: GET /getPaymentList?complexId=UUID&origin=MANUAL&startDate=...&cursor=...
 */
export const fetchPaymentList = async ({
  token,
  complexId,
  options = {},
}: FetchPaymentListParams): Promise<IPaymentsListResponse> => {
  try {
    const {
      origin,
      paymentMethod,
      startDate,
      endDate,
      apartmentSearch,
      limit = 20,
      cursor,
      order = 'desc',
    } = options;

    const params = new URLSearchParams({ complexId });
    if (origin) params.append('origin', origin);
    if (paymentMethod) params.append('paymentMethod', paymentMethod);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (apartmentSearch) params.append('apartmentSearch', apartmentSearch);
    if (limit) params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);
    if (order) params.append('order', order);

    const response = await fetch(
      `${API_URL}/getListPayments?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error fetching payment list:', data);
      throw new Error(data.error || 'Error fetching payment list');
    }

    // Transform backend response to expected format
    // Backend returns: { data: [...], pagination: { page, pageSize, total, totalPages } }
    const payments = Array.isArray(data?.data) ? data.data : [];
    const pagination = data?.pagination;
    
    // Calculate nextCursor based on pagination info
    let nextCursor: string | null = null;
    if (pagination && pagination.page < pagination.totalPages) {
      nextCursor = (pagination.page + 1).toString();
    }

    return {
      payments,
      nextCursor,
      totalCount: pagination?.total,
    } as IPaymentsListResponse;
  } catch (error) {
    console.error('Error en fetchPaymentList:', error);
    throw error;
  }
};

/**
 * Fetch all payments that match filters, traversing all available pages.
 * Useful for full-period exports where paginated UI data is not enough.
 */
export const fetchAllPaymentsForExport = async ({
  token,
  complexId,
  options = {},
}: FetchAllPaymentsForExportParams) => {
  const {
    limitPerPage = 200,
    maxPages = 200,
    maxRecords,
    ...filters
  } = options;

  const aggregated: IPaymentsListResponse['payments'] = [];
  let cursor: string | null = null;
  let pageCount = 0;

  do {
    const remainingRecords = maxRecords
      ? Math.max(maxRecords - aggregated.length, 0)
      : null;

    if (remainingRecords === 0) {
      break;
    }

    const result = await fetchPaymentList({
      token,
      complexId,
      options: {
        ...filters,
        limit: remainingRecords ? Math.min(limitPerPage, remainingRecords) : limitPerPage,
        cursor,
      },
    });

    aggregated.push(...result.payments);
    cursor = result.nextCursor;
    pageCount += 1;
  } while (cursor && pageCount < maxPages && (!maxRecords || aggregated.length < maxRecords));

  return maxRecords ? aggregated.slice(0, maxRecords) : aggregated;
};

// ==================== GET: Blocks (Torres) ====================

/**
 * Fetch blocks/towers for apartment selector
 * Uses getApartmentList endpoint without blockId to retrieve all blocks
 * Pattern: GET /getApartmentList?complexId=UUID
 */
export const fetchBlocks = async ({
  token,
  complexId,
}: FetchBlocksParams): Promise<Array<{ id: string; name: string }>> => {
  try {
    const params = new URLSearchParams({ complexId });

    const response = await fetch(
      `${API_URL}/getApartmentList?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error fetching blocks:', data);
      return []; // Return empty array on error
    }

    return (data?.blocks || []) as Array<{ id: string; name: string }>;
  } catch (error) {
    console.error('Error en fetchBlocks:', error);
    return [];
  }
};

// ==================== GET: Apartments by Block ====================

/**
 * Fetch apartments for a specific block
 * Uses getApartmentList endpoint with blockId filter
 * Pattern: GET /getApartmentList?complexId=UUID&blockId=UUID
 */
export const fetchApartmentsByBlock = async ({
  token,
  complexId,
  blockId,
}: FetchApartmentsByBlockParams): Promise<
  Array<{ id: string; number: string; block_name: string; block_id?: string }>
> => {
  try {
    const params = new URLSearchParams({ complexId, blockId });

    const response = await fetch(
      `${API_URL}/getApartmentList?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error fetching apartments by block:', data);
      return [];
    }

    return (data?.apartments || []) as Array<{
      id: string;
      number: string;
      block_name: string;
      block_id?: string;
    }>;
  } catch (error) {
    console.error('Error en fetchApartmentsByBlock:', error);
    return [];
  }
};

// ==================== POST: Bulk Create Invoices ====================

export interface BulkInvoiceItem {
  apartment_number: string;
  block_name: string;
  type: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
}

export interface UploadBulkInvoicesParams {
  token: string;
  complexId: string;
  invoices: BulkInvoiceItem[];
  action?: string;
}

export interface UploadBulkInvoicesResponse {
  success: boolean;
  created: number;
  errors?: Array<{ row: number; message: string }>;
  message?: string;
}

/**
 * Bulk-create invoices parsed from Excel file
 * Pattern: POST /uploadInvoicesExcel?complexId=UUID
 * Body: { action: string, invoices: [...] }
 */
export const uploadBulkInvoices = async ({
  token,
  complexId,
  invoices,
  action = 'BULK_CREATE',
}: UploadBulkInvoicesParams): Promise<UploadBulkInvoicesResponse> => {
  const params = new URLSearchParams({ complexId });

  const response = await fetch(`${API_URL}/uploadInvoicesExcel?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action,
      invoices,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Error al crear las facturas');
  }

  return data as UploadBulkInvoicesResponse;
};
