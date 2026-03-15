/**
 * Invoices Module Types and Interfaces
 * Panel de Gestión de Facturas y Pagos
 */

// ==================== ENUMS / TIPOS ====================

export type InvoiceType = 'ADMIN' | 'INTEREST' | 'PENALTY' | 'EXTRAORDINARY';
export type InvoiceStatus = 'PENDING' | 'OVERDUE' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'DEPOSIT' | 'OTHER';
export type PaymentOrigin = 'GATEWAY' | 'MANUAL';

// ==================== MAIN INTERFACES ====================

/**
 * IInvoice - Factura individual
 */
export interface IInvoice {
  id: string;
  complex_id: string;
  apartment_id: string;
  apartment_number: string; // Denormalizado del JOIN
  block_number?: string; // Bloque del apartamento
  type: InvoiceType;
  description: string; // Ej: "Cuota Administrativa Marzo"
  amount: number; // Monto original
  balance_due: number; // Saldo pendiente actual
  status: InvoiceStatus;
  due_date: string; // ISO 8601 date
  created_at: string; // ISO 8601 timestamp
  updated_at: string;
}

/**
 * IPaymentRecord - Registro de abono a una factura
 */
export interface IPaymentRecord {
  id: string;
  invoice_id: string;
  amount_applied: number; // Monto pagado
  origin: PaymentOrigin; // GATEWAY o MANUAL
  payment_method?: PaymentMethod; // Solo si origin = MANUAL
  reference?: string; // Ej: número de transacción
  notes?: string; // Observación
  created_at: string;
}

/**
 * IInvoiceDetail - Factura con historial de pagos
 */
export interface IInvoiceDetail extends IInvoice {
  payments: IPaymentRecord[]; // Ordenado por created_at DESC
}

/**
 * IManualPaymentPayload - Payload para registrar pago manual
 */
export interface IManualPaymentPayload {
  apartment_id: string;
  amount: number;
  payment_date: string; // ISO 8601 date
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
  idempotency_key?: string; // Auto-generated if not provided (prevents duplicate payments)
}

/**
 * IManualPaymentResponse - Respuesta del backend al registrar pago
 */
export interface IManualPaymentResponse {
  success: boolean;
  payment_id?: string;
  message?: string;
  error?: string;
  applied_to_invoices?: {
    // Opcional: detalle de aplicación
    invoice_id: string;
    amount_applied: number;
  }[];
}

/**
 * IInvoicesListResponse - Respuesta del GET invoices list
 */
export interface IInvoicesListResponse {
  invoices: IInvoice[];
  nextCursor: string | null;
  totalCount?: number; // Opcional: para mostrar "X de 50"
  error?: string;
}

/**
 * IInvoicesFilterOptions - Opciones de filtrado (para servicio)
 */
export interface IInvoicesFilterOptions {
  status?: InvoiceStatus | 'ALL'; // Filtro de estado
  apartmentSearch?: string; // Búsqueda por número de apartamento
  limit?: number; // Paginación
  cursor?: string | null; // Cursor para siguiente página
  order?: 'asc' | 'desc'; // Orden por due_date
}

/**
 * IApartmentForAutocomplete - Opciones para autocomplete de apartamentos
 */
export interface IApartmentForAutocomplete {
  id: string;
  number: string;
  block_name?: string; // Ej: "Torre A"
  full_label?: string; // Ej: "Torre A - Apto 101"
}

/**
 * IPaymentDetail - Detalle de pago en listado (respuesta del backend)
 */
export interface IPaymentDetail {
  id: string;
  apartment_id: string;
  apartment_number: string;
  block_name: string;
  total_amount: number; // Monto pagado
  gateway_fee: number;
  net_amount: number;
  status: string; // APPROVED, etc
  payment_method: PaymentMethod;
  gateway_request_id: string | null;
  allocation_applied_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * IPaymentsListResponse - Respuesta del GET payment list (historial de pagos del complejo)
 */
export interface IPaymentsListResponse {
  payments: IPaymentDetail[];
  nextCursor: string | null;
  totalCount?: number; // Opcional
}

/**
 * IPaymentsFilterOptions - Opciones de filtrado para historial de pagos
 */
export interface IPaymentsFilterOptions {
  origin?: PaymentOrigin; // Filtro por GATEWAY o MANUAL
  paymentMethod?: PaymentMethod; // Filtro por método
  startDate?: string; // ISO date para rango
  endDate?: string;
  apartmentSearch?: string; // Búsqueda por número de apartamento
  limit?: number;
  cursor?: string | null;
  order?: 'asc' | 'desc'; // Por created_at
}
