/**
 * Notices Module Types and Interfaces
 * Avisos y Notificaciones Informativas del Administrador
 */

export type NoticeScope = 'GLOBAL' | 'BLOCK' | 'UNIT';
export type NoticeType = 'INFO' | 'WARNING' | 'ALERT';

/**
 * INotice - Interfaz principal para un aviso
 */
export interface INotice {
  id: string;
  complex_id: string;
  scope: NoticeScope;
  target_id: string | null; // null si GLOBAL; blocks.id si BLOCK; apartment_id si UNIT
  type: NoticeType;
  title: string;
  message: string;
  created_at: string;
  updated_at?: string;

  // Calculado por backend (JOIN) - nombre legible del destinatario
  target_name?: string; // "Todos" | "Torre A" | "Apto 101"
}

/**
 * ICreateNoticePayload - Payload para crear un aviso
 */
export interface ICreateNoticePayload {
  scope: NoticeScope;
  target_id: string | null;
  type: NoticeType;
  title: string;
  message: string;
}

/**
 * IAdminNoticesRequestBody - Body esperado por el backend para crear aviso
 */
export interface IAdminNoticesRequestBody {
  action: 'CREATE_NOTICE';
  payload: ICreateNoticePayload;
}

/**
 * IGetNoticesResponse - Respuesta del GET para listar avisos
 */
export interface IGetNoticesResponse {
  notices: INotice[];
  nextCursor: string | null;
  error?: string;
}

/**
 * ICreateNoticeResponse - Respuesta del POST para crear aviso
 */
export interface ICreateNoticeResponse {
  message: string;
  notice_id?: string;
  error?: string;
}

/**
 * ICursorPayload - Estructura del cursor para decodificar
 */
export interface ICursorPayload {
  created_at: string;
  id: string;
}

/**
 * INoticesFilterOptions - Opciones de filtrado para el servicio
 */
export interface INoticesFilterOptions {
  limit?: number;
  cursor?: string | null;
  order?: 'asc' | 'desc';
}

/**
 * IBlock - Interfaz para bloques/torres (target para BLOCK scope)
 */
export interface IBlock {
  id: string;
  complex_id: string;
  name: string;
  created_at?: string;
}

/**
 * IApartmentOption - Interfaz para opciones de apartamento (target para UNIT scope)
 */
export interface IApartmentOption {
  id: string;
  number: string;
  block_name?: string;
  floor?: number;
  full_label?: string; // "Torre A - Apto 101"
}

/**
 * INoticeFormData - Estructura interna del formulario
 */
export interface INoticeFormData {
  title: string;
  message: string;
  type: NoticeType;
  scope: NoticeScope;
  target_id: string | null;
}

/**
 * Badge color mapping para tipos de aviso
 */
export const NOTICE_TYPE_COLORS: Record<NoticeType, string> = {
  INFO: 'bg-blue-100 text-blue-800 border-blue-300',
  WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ALERT: 'bg-red-100 text-red-800 border-red-300',
};

/**
 * Badge label mapping para tipos de aviso
 */
export const NOTICE_TYPE_LABELS: Record<NoticeType, string> = {
  INFO: 'Informativo',
  WARNING: 'Importante',
  ALERT: 'Alerta/Cobro',
};

/**
 * Scope label mapping
 */
export const NOTICE_SCOPE_LABELS: Record<NoticeScope, string> = {
  GLOBAL: 'A Todos',
  BLOCK: 'Por Bloque/Torre',
  UNIT: 'Apartamento Específico',
};
