'use client';

import { IExpense } from '@/app/dashboard/finances/expenses/expenses.types';
import { CreditCard, FileText } from 'lucide-react';

interface ExpensesTableProps {
  expenses: IExpense[];
  onRowClick: (expense: IExpense) => void;
  onPayClick: (expense: IExpense) => void;
}

export default function ExpensesTable({ expenses, onRowClick, onPayClick }: ExpensesTableProps) {
  
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Pagado</span>;
      case 'PENDING':
        return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">Por Pagar</span>;
      case 'PARTIALLY_PAID':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Abono</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">Anulado</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 rounded-tl-xl">Fecha / Vence</th>
            <th className="px-6 py-4">Proveedor</th>
            <th className="px-6 py-4">Categoría</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4 text-right">Total a Pagar</th>
            <th className="px-6 py-4 text-center rounded-tr-xl">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {expenses.map((expense) => (
            <tr 
              key={expense.id} 
              className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
              onClick={() => onRowClick(expense)}
            >
              <td className="px-6 py-4">
                <div className="font-medium text-slate-900">{new Date(expense.issueDate).toLocaleDateString('es-CO')}</div>
                <div className="text-xs text-slate-400">Vence: {new Date(expense.dueDate).toLocaleDateString('es-CO')}</div>
              </td>
              <td className="px-6 py-4">
                <div className="font-bold text-slate-800">{expense.supplierName}</div>
                {expense.invoiceNumber && (
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <FileText className="w-3 h-3" /> Fact: {expense.invoiceNumber}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">
                  {expense.categoryName}
                </span>
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(expense.status)}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="font-bold text-slate-900 text-base">{formatMoney(expense.totalAmount)}</div>
                {expense.paidAmount > 0 && expense.status !== 'PAID' && (
                  <div className="text-xs text-emerald-600 font-medium">Pagado: {formatMoney(expense.paidAmount)}</div>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                {(expense.status === 'PENDING' || expense.status === 'PARTIALLY_PAID') ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que se abra el modal de detalle al hacer clic en pagar
                      onPayClick(expense);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-600 hover:text-white rounded-lg text-sm font-bold transition-all"
                  >
                    <CreditCard className="w-4 h-4" /> Pagar
                  </button>
                ) : (
                  <span className="text-slate-400 text-xs font-medium">Completado</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}