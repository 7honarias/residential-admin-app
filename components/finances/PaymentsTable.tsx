import { IPaymentDetail } from '@/app/dashboard/finances/invoices.types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentsTableProps {
  payments: IPaymentDetail[];
}

export default function PaymentsTable({ payments }: PaymentsTableProps) {
  const getMethodLabel = (method?: string) => {
    switch (method) {
      case 'CASH':
        return 'Efectivo';
      case 'TRANSFER':
        return 'Transferencia';
      case 'DEPOSIT':
        return 'Consignación';
      case 'OTHER':
        return 'Otro';
      default:
        return '—';
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-xs md:text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left font-semibold text-slate-700">
              Apartamento
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-right font-semibold text-slate-700">
              Monto Pagado
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left font-semibold text-slate-700">
              Método
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 text-left font-semibold text-slate-700">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr
              key={payment.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td className="px-3 md:px-6 py-3 md:py-4">
                <div className="font-medium text-slate-900">
                  Apto {payment.apartment_number}
                </div>
                <div className="text-xs text-slate-600">
                  {payment.block_name.substring(0, 8)}...
                </div>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 text-right font-semibold text-green-700">
                {formatCurrency(payment.total_amount)}
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 text-slate-900">
                {getMethodLabel(payment.payment_method)}
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 text-slate-600">
                {formatDate(payment.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
