'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { fetchInvoiceDetail } from '@/services/invoices.service';
import { IInvoice, IInvoiceDetail, InvoiceStatus } from '@/app/dashboard/finances/invoices.types';
import { formatDate } from '@/lib/utils';
import { X, Loader2 } from 'lucide-react';

interface Props {
  invoice: IInvoice;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING: 'Pendiente',
  OVERDUE: 'Vencida',
  PARTIALLY_PAID: 'Pago Parcial',
  PAID: 'Pagada',
  CANCELLED: 'Cancelada',
};

const PAYMENT_ORIGIN_LABELS: Record<string, string> = {
  GATEWAY: 'Pasarela',
  MANUAL: 'Manual',
};

const TYPE_LABELS: Record<string, string> = {
  ADMIN: 'Cuota Administrativa',
  INTEREST: 'Interés',
  PENALTY: 'Sanción',
  EXTRAORDINARY: 'Extraordinaria',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
}: Props) {
  const token = useAppSelector((state) => state.auth.token);
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  
  const [detail, setDetail] = useState<IInvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !token || !activeComplex?.id) return;

    let mounted = true;

    const load = async () => {
      try {
        if (mounted) setIsLoading(true);
        const data = await fetchInvoiceDetail({
          token,
          complexId: activeComplex.id,
          invoiceId: invoice.id,
        });
        if (mounted) {
          setDetail(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Error loading detail');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isOpen, invoice.id, token, activeComplex?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Detalle de Factura</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {!isLoading && detail && (
            <>
              {/* Summary Section */}
              <div className="mb-8 bg-slate-50 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Resumen</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Apartamento</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {detail.apartment_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Concepto</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {TYPE_LABELS[detail.type]}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Descripción</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {detail.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Vencimiento</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatDate(detail.due_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Monto Original</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCurrency(detail.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Saldo Pendiente</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(detail.balance_due)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600 mb-1">Estado</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-700">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {STATUS_LABELS[detail.status]}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History Section */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">
                  Historial de Pagos / Abonos
                </h3>

                {detail.payments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600">Sin pagos registrados aún</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detail.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatDate(payment.created_at)}
                            </p>
                            <p className="text-xs text-slate-600">
                              {new Date(payment.created_at).toLocaleTimeString(
                                'es-CO',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                }
                              )}
                            </p>
                          </div>
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                              payment.origin === 'MANUAL'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-green-50 text-green-700'
                            }`}
                          >
                            {PAYMENT_ORIGIN_LABELS[payment.origin]}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600 mb-1">Monto Aplicado</p>
                            <p className="font-semibold text-green-600">
                              +{formatCurrency(payment.amount_applied)}
                            </p>
                          </div>
                          {payment.reference && (
                            <div>
                              <p className="text-slate-600 mb-1">Referencia</p>
                              <p className="font-mono text-slate-900">
                                {payment.reference}
                              </p>
                            </div>
                          )}
                        </div>

                        {payment.notes && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-slate-600 mb-1">Nota</p>
                            <p className="text-sm text-slate-900">
                              {payment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
