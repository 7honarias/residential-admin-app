import { Supplier, UpsertSupplierPayload } from '@/app/dashboard/finances/suppliers/suppliers.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface BaseSupplierParams {
  token: string;
  complexId: string;
}

interface UpsertSupplierParams extends BaseSupplierParams {
  supplierId?: string;
  payload: UpsertSupplierPayload;
}

interface DeleteSupplierParams extends BaseSupplierParams {
  supplierId: string;
}

const normalizeSupplier = (raw: Record<string, unknown>): Supplier => {
  const createdAt = String(raw.created_at ?? raw.createdAt ?? new Date().toISOString());
  const updatedAt = String(raw.updated_at ?? raw.updatedAt ?? createdAt);

  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? 'Proveedor sin nombre'),
    category: (raw.category as string | null) ?? null,
    contactName: (raw.contact_name as string | null) ?? (raw.contactName as string | null) ?? null,
    email: (raw.email as string | null) ?? null,
    phone: (raw.phone as string | null) ?? null,
    taxId: (raw.tax_id as string | null) ?? (raw.taxId as string | null) ?? null,
    notes: (raw.notes as string | null) ?? null,
    isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
    createdAt,
    updatedAt,
  };
};

const parseSuppliersResponse = (data: unknown): Supplier[] => {
  if (!data || typeof data !== 'object') return [];

  const asRecord = data as Record<string, unknown>;
  const items =
    (asRecord.suppliers as Record<string, unknown>[] | undefined) ??
    ((asRecord.data as Record<string, unknown>)?.suppliers as Record<string, unknown>[] | undefined) ??
    ((asRecord.data as Record<string, unknown>[]) ?? []);

  if (!Array.isArray(items)) return [];

  return items.map(normalizeSupplier).filter((supplier) => supplier.id);
};

export const fetchSuppliers = async ({ token, complexId }: BaseSupplierParams): Promise<Supplier[]> => {
  const params = new URLSearchParams({ complexId });
  const response = await fetch(`${API_URL}/getSuppliersList?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Error cargando proveedores');
  }

  return parseSuppliersResponse(data);
};

export const createSupplier = async ({ token, complexId, payload }: UpsertSupplierParams): Promise<void> => {
  const params = new URLSearchParams({ complexId });

  const response = await fetch(`${API_URL}/manageSuppliers?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'CREATE_SUPPLIER',
      payload,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Error creando proveedor');
  }
};

export const updateSupplier = async ({ token, complexId, supplierId, payload }: UpsertSupplierParams): Promise<void> => {
  if (!supplierId) {
    throw new Error('supplierId is required for update');
  }

  const params = new URLSearchParams({ complexId });

  const response = await fetch(`${API_URL}/manageSuppliers?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'UPDATE_SUPPLIER',
      payload: {
        supplier_id: supplierId,
        ...payload,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Error actualizando proveedor');
  }
};

export const deleteSupplier = async ({ token, complexId, supplierId }: DeleteSupplierParams): Promise<void> => {
  const params = new URLSearchParams({ complexId });

  const response = await fetch(`${API_URL}/manageSuppliers?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'DELETE_SUPPLIER',
      payload: {
        supplier_id: supplierId,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Error eliminando proveedor');
  }
};
