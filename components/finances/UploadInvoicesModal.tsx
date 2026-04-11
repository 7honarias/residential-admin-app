'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { uploadBulkInvoices } from '@/services/invoices.service';
import { InvoiceType } from '@/app/dashboard/finances/invoices.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedInvoiceRow {
  apartment_number: string;
  block_name: string;
  type: InvoiceType;
  concept_label: string;
  amount: number;
  due_date: string;
  _rowIndex: number;
  _errors: string[];
}

const REQUIRED_COLUMNS = ['Apartamento', 'Bloque', 'Concepto', 'Monto', 'Fecha de Vencimiento'];

const CONCEPT_MAP: Record<string, InvoiceType> = {
  'administracion': 'ADMIN',
  'administración': 'ADMIN',
  admin: 'ADMIN',
  'cuota administrativa': 'ADMIN',
  extraordinaria: 'EXTRAORDINARY',
  extraordinario: 'EXTRAORDINARY',
  'cuota extraordinaria': 'EXTRAORDINARY',
  interes: 'INTEREST',
  'interés': 'INTEREST',
  intereses: 'INTEREST',
  sancion: 'PENALTY',
  'sanción': 'PENALTY',
  multa: 'PENALTY',
};

const TYPE_LABELS: Record<InvoiceType, string> = {
  ADMIN: 'Cuota Administrativa',
  EXTRAORDINARY: 'Extraordinaria',
  INTEREST: 'Interés',
  PENALTY: 'Sanción',
};

function mapConcept(raw: string): InvoiceType | null {
  const normalized = raw.trim().toLowerCase();
  return CONCEPT_MAP[normalized] ?? null;
}

function parseExcelDate(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const y = date.y;
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

function validateRow(raw: Record<string, unknown>, rowIndex: number): ParsedInvoiceRow {
  const errors: string[] = [];

  const apartment_number = String(raw['Apartamento'] ?? '').trim();
  const block_name = String(raw['Bloque'] ?? '').trim();
  const conceptRaw = String(raw['Concepto'] ?? '').trim();
  const amountRaw = raw['Monto'];
  const dueDateRaw = raw['Fecha de Vencimiento'];

  if (!apartment_number) errors.push('Apartamento vacío');
  if (!block_name) errors.push('Bloque vacío');

  const type = mapConcept(conceptRaw);
  if (!type) errors.push(`Concepto desconocido: "${conceptRaw}"`);

  const amount =
    typeof amountRaw === 'number'
      ? amountRaw
      : parseFloat(String(amountRaw ?? '').replace(/[^0-9.]/g, ''));
  if (Number.isNaN(amount) || amount <= 0) errors.push('Monto inválido');

  const due_date = parseExcelDate(dueDateRaw);
  if (!due_date) errors.push('Fecha de Vencimiento inválida');

  return {
    apartment_number,
    block_name,
    type: type ?? 'ADMIN',
    concept_label: type ? TYPE_LABELS[type] : conceptRaw,
    amount: Number.isNaN(amount) ? 0 : amount,
    due_date: due_date ?? '',
    _rowIndex: rowIndex,
    _errors: errors,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function UploadInvoicesModal({ isOpen, onClose, onSuccess }: Props) {
  const token = useAppSelector((state) => state.auth.token);
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedRows, setParsedRows] = useState<ParsedInvoiceRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen) return null;

  const validRows = parsedRows.filter((row) => row._errors.length === 0);
  const invalidRows = parsedRows.filter((row) => row._errors.length > 0);

  const handleFile = async (file: File | null) => {
    if (!file) return;

    setParseError(null);
    setSubmitError(null);
    setSubmitSuccess(false);
    setParsedRows([]);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { cellDates: false });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      if (rawRows.length === 0) {
        setParseError('El archivo está vacío.');
        return;
      }

      const headers = Object.keys(rawRows[0]);
      const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
      if (missing.length > 0) {
        setParseError(`Columnas faltantes: ${missing.join(', ')}`);
        return;
      }

      setParsedRows(rawRows.map((row, idx) => validateRow(row, idx + 2)));
    } catch {
      setParseError('No se pudo leer el archivo. Verifica que sea .xlsx, .xls o .csv válido.');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleReset = () => {
    setParsedRows([]);
    setFileName('');
    setParseError(null);
    setSubmitError(null);
    setSubmitSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    if (validRows.length === 0 || !token || !activeComplex?.id) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await uploadBulkInvoices({
        token,
        complexId: activeComplex.id,
        action: 'BULK_CREATE',
        invoices: validRows.map(({ apartment_number, block_name, type, amount, due_date }) => ({
          apartment_number,
          block_name,
          type,
          amount,
          due_date,
        })),
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 1200);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error al cargar las facturas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Apartamento: '101',
        Bloque: 'Torre A',
        Concepto: 'Administración',
        Monto: 150000,
        'Fecha de Vencimiento': '2026-04-10',
      },
      {
        Apartamento: '102',
        Bloque: 'Torre A',
        Concepto: 'Administración',
        Monto: 150000,
        'Fecha de Vencimiento': '2026-04-10',
      },
      {
        Apartamento: '201',
        Bloque: 'Torre B',
        Concepto: 'Extraordinaria',
        Monto: 50000,
        'Fecha de Vencimiento': '2026-04-30',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 22 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');
    XLSX.writeFile(workbook, 'plantilla_facturas.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            Carga Masiva de Facturas
          </h3>
          <button onClick={handleClose} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {parsedRows.length === 0 && !submitSuccess && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(event) => event.preventDefault()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition-all hover:border-blue-400 hover:bg-slate-50"
              >
                <UploadCloud className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                <p className="mb-1 text-sm font-semibold text-slate-700">
                  Arrastra tu archivo aquí o{' '}
                  <label className="cursor-pointer text-blue-600 underline underline-offset-2">
                    selecciónalo
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </p>
                <p className="text-xs text-slate-400">Soporta .xlsx, .xls y .csv</p>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-700">Formato requerido</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-blue-100">
                        {REQUIRED_COLUMNS.map((column) => (
                          <th key={column} className="pr-4 pb-1 text-left font-bold text-blue-800">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-slate-500">
                        <td className="pr-4 pt-1">101</td>
                        <td className="pr-4 pt-1">Torre A</td>
                        <td className="pr-4 pt-1">Administración</td>
                        <td className="pr-4 pt-1">150000</td>
                        <td className="pt-1">2026-04-10</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 underline underline-offset-2 transition-colors hover:text-blue-900"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar plantilla de ejemplo
                </button>
              </div>
            </>
          )}

          {parseError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-700">Error al leer el archivo</p>
                <p className="text-sm text-red-600">{parseError}</p>
              </div>
            </div>
          )}

          {parsedRows.length > 0 && !submitSuccess && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">{fileName}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{parsedRows.length} filas</span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{validRows.length} válidas</span>
                  {invalidRows.length > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{invalidRows.length} con errores</span>
                  )}
                </div>
                <button onClick={handleReset} className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                  Limpiar
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-xs font-bold uppercase text-slate-500">#</th>
                        <th className="px-3 py-2 text-xs font-bold uppercase text-slate-500">Apartamento</th>
                        <th className="px-3 py-2 text-xs font-bold uppercase text-slate-500">Bloque</th>
                        <th className="px-3 py-2 text-xs font-bold uppercase text-slate-500">Concepto</th>
                        <th className="px-3 py-2 text-right text-xs font-bold uppercase text-slate-500">Monto</th>
                        <th className="px-3 py-2 text-xs font-bold uppercase text-slate-500">Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row) => (
                        <tr key={row._rowIndex} className={row._errors.length ? 'bg-red-50' : 'hover:bg-slate-50'}>
                          <td className="px-3 py-2 text-xs text-slate-400">{row._rowIndex}</td>
                          <td className="px-3 py-2 font-medium text-slate-700">{row.apartment_number || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-2 text-slate-600">{row.block_name || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-2 text-slate-600">{row.concept_label}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-700">{row.amount > 0 ? formatCurrency(row.amount) : '—'}</td>
                          <td className="px-3 py-2 text-slate-600">{row.due_date || <span className="text-red-400">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidRows.length > 0 && (
                <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">Filas con errores (se omitirán)</p>
                  {invalidRows.map((row) => (
                    <p key={row._rowIndex} className="text-xs text-amber-700">
                      <span className="font-semibold">Fila {row._rowIndex}:</span> {row._errors.join(' · ')}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}

          {submitError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {submitSuccess && (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <CheckCircle2 className="h-14 w-14 text-green-500" />
              <p className="text-lg font-bold text-slate-800">¡Facturas cargadas exitosamente!</p>
              <p className="text-sm text-slate-500">{validRows.length} facturas creadas.</p>
            </div>
          )}
        </div>

        {parsedRows.length > 0 && !submitSuccess && (
          <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
            <p className="text-sm text-slate-500">
              Se cargarán <span className="font-semibold text-slate-700">{validRows.length}</span> facturas válidas
              {invalidRows.length > 0 && <span className="text-amber-600"> ({invalidRows.length} omitidas)</span>}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || validRows.length === 0}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    Cargar facturas
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
