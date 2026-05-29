import { supabase } from '@/lib/supabaseClient';

// ==========================================
// TYPES
// ==========================================

export type ReportType = 'FINANCIAL' | 'ASSEMBLY' | 'GENERAL' | 'MANAGEMENT';

export interface IAiReport {
  id: string;
  complex_id: string;
  title: string;
  type: ReportType;
  summary: string;
  content: string;
  period_label: string | null;
  period_start: string | null;
  period_end: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
}

export interface FetchReportsParams {
  complexId: string;
  type?: ReportType;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface FetchReportsResponse {
  reports: IAiReport[];
  total: number;
}

// ==========================================
// FUNCIONES
// ==========================================

export async function fetchReports({
  complexId,
  type,
  search,
  limit = 20,
  offset = 0,
}: FetchReportsParams): Promise<FetchReportsResponse> {
  let query = supabase
    .from('ai_reports')
    .select('*', { count: 'exact' })
    .eq('complex_id', complexId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq('type', type);
  }

  if (search && search.trim() !== '') {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    reports: (data ?? []) as IAiReport[],
    total: count ?? 0,
  };
}

export async function fetchReportById(reportId: string): Promise<IAiReport> {
  const { data, error } = await supabase
    .from('ai_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as IAiReport;
}
