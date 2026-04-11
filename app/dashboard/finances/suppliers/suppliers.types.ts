export interface Supplier {
  id: string;
  name: string;
  category: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSupplierPayload {
  name: string;
  category?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  tax_id?: string | null;
  notes?: string | null;
  is_active?: boolean;
}
