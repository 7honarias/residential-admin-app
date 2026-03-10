/**
 * PQRS Module Types and Interfaces
 * Peticiones, Quejas, Reclamos y Sugerencias (Requests, Complaints, Claims and Suggestions)
 */

export type PqrsType = 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA';
export type PqrsStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface IPqrsTicket {
  id: string;
  complex_id: string;
  apartment_id: string;
  type: PqrsType;
  subject: string;
  description: string;
  status: PqrsStatus;
  admin_response: string | null;
  apartment_info: string; // Torre/Apartamento
  created_at: string;
  updated_at: string;
}

export interface IGetPqrsResponse {
  pqrs: IPqrsTicket[];
  nextCursor: string | null;
  error?: string;
}

export interface IAdminPqrsRequestBody {
  action: 'RESPOND_PQRS';
  payload: {
    pqrs_id: string;
    status: PqrsStatus;
    admin_response: string; // obligatorio (no vacío)
  };
}

export interface IAdminPqrsResponse {
  success: boolean;
  pqrs?: IPqrsTicket;
  error?: string;
}

// Cursor payload para decodificar
export interface ICursorPayload {
  created_at: string;
  id: string;
}

// Filter options para el servicio
export interface IPqrsFilterOptions {
  status?: PqrsStatus | 'ALL';
  limit?: number;
  cursor?: string | null;
  order?: 'asc' | 'desc';
}
