export interface Owner {
  id?: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string | null;
  phone: string;
}

export interface OwnerForm {
  id?: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  confirmEmail: string;
  phone: string;
}

export interface ResidentForm {
  id?: string;
  fullName: string;
  documentTypeCode: string;
  documentNumber: string;
  email: string;
  confirmEmail: string;
  phone: string;
}

export interface Resident {
  id: string;
  fullName: string;
  documentTypeCode: string;
  documentNumber: string;
  email: string;
  phone: string;
}

export interface CoefficientPricing {
  id: string;
  complex_id: string;
  coefficient: number;
  meters: number;
  price: number;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id: string;
  type: "ADMINISTRATION" | "COMMON_AREA" | "MAINTENANCE" | "OTHER";
  description: string;
  due_date: string;
  amount: number;
  balance_due: number;
  status: "PAID" | "OVERDUE" | "PENDING";
  period_month: number;
  period_year: number;
  created_at: string;
}

export interface AccountStatus {
  apartment_id: string;
  apartment_number: string;
  block_id: string;
  total_debt: number;
  overdue_debt: number;
  total_credits: number;
  is_al_dia: boolean;
}

export interface Parking {
  id: string;
  number: string;
  type: "PRIVATE" | "ASSIGNED";
}

export interface Parkings {
  private: Parking[];
  assigned: Parking[];
}

export interface ApartmentDetail {
  id: string;
  number: string;
  block_name: string;
  owner: Owner | null;
  residents: Resident[];
  coefficient_pricing?: CoefficientPricing | null;
  last_invoices?: Invoice[];
  account_status?: AccountStatus;
  parkings?: Parkings;
}
