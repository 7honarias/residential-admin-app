'use client';

import { IInvoice, InvoiceStatus } from '@/app/dashboard/finances/invoices.types';
import { formatDate } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface Props {
  invoices: IInvoice[];
  onRowClick: (invoice: IInvoice) => void;
}

const TYPE_LABELS: Record<string, string> = {
  ADMIN: 'Cuota Administrativa',
  INTEREST: 'Interés',
  PENALTY: 'Sanción',
  EXTRAORDINARY: 'Extraordinaria',
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING: 'Pendiente',
  OVERDUE: 'Vencida',
  PARTIALLY_PAID: 'Pago Parcial',
  PAID: 'Pagada',
  CANCELLED: 'Cancelada',
};

const STATUS_COLORS: Record<
  InvoiceStatus,
  { bg: string; text: string; dot: string }
> = {
  PENDING: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    dot: 'bg-yellow-400',
  },
  OVERDUE: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-400',
  },
  PARTIALLY_PAID: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
  },
  PAID: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-400',
  },
  CANCELLED: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function InvoicesTable({ invoices, onRowClick }: Props) {
  if (invoices.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-slate-900">
                Bloque-Apartamento
              </th>
              <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-slate-900">
                Concepto
              </th>
              <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-slate-900">
                Vencimiento
              </th>
              <th className="px-3 md:px-6 py-2 md:py-3 text-right text-xs md:text-sm font-semibold text-slate-900">
                Monto Original
              </th>
              <th className="px-3 md:px-6 py-2 md:py-3 text-right text-xs md:text-sm font-semibold text-slate-900">
                Saldo Pendiente
              </th>
              <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-slate-900">
                Estado
              </th>
              <th className="px-3 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm font-semibold text-slate-900">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoices.map((invoice) => {
              const statusColor = STATUS_COLORS[invoice.status];

              return (
                <tr
                  key={invoice.id}
                  onClick={() => onRowClick(invoice)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {/* Apartamento */}
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-slate-900">
                    {invoice.block_number ? `${invoice.block_number}-` : ''}{invoice.apartment_number}
                  </td>

                  {/* Concepto */}
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-slate-600">
                    {TYPE_LABELS[invoice.type] || invoice.type}
                  </td>

                  {/* Vencimiento */}
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-slate-600">
                    {formatDate(invoice.due_date)}
                  </td>

                  {/* Monto Original */}
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-right text-slate-600">
                    {formatCurrency(invoice.amount)}
                  </td>

                  {/* Saldo Pendiente */}
                  <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-right font-semibold">
                    <span
                      className={`${statusColor.text}`}
                    >
                      {formatCurrency(invoice.balance_due)}
                    </span>
                  </td>

                  {/* Estado Badge */}
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs md:text-sm font-medium ${statusColor.bg} ${statusColor.text}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${statusColor.dot}`}
                      />
                      {STATUS_LABELS[invoice.status]}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                    <button className="inline-flex items-center gap-1 text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                      Ver Detalle
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
