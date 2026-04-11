'use client';

import { IExpense } from '@/app/dashboard/finances/expenses/expenses.types';
import { X, Building2, Calendar, FileText, Tag, Receipt, CheckCircle2 } from 'lucide-react';

interface ExpenseDetailModalProps {
  expense: IExpense;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpenseDetailModal({ expense, isOpen, onClose }: ExpenseDetailModalProps) {
  if (!isOpen) return null;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Pagado</span>;
      case 'PENDING':
        return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-bold">Por Pagar</span>;
      case 'PARTIALLY_PAID':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">Pago Parcial</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-bold">Anulado</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">{status}</span>;
    }
  };

  // Cálculos financieros
  const balanceDue = expense.totalAmount - expense.paidAmount;
  const paymentProgress = Math.min(100, Math.max(0, (expense.paidAmount / expense.totalAmount) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center shadow-sm">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Detalle del Egreso</h2>
              <p className="text-sm text-slate-500">Información completa de la cuenta por pagar</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {getStatusBadge(expense.status)}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-8">
          
          {/* SECCIÓN 1: Resumen Financiero (Tarjetas) */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Factura</p>
              <p className="text-xl font-black text-slate-800">{formatMoney(expense.totalAmount)}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Abonado</p>
              <p className="text-xl font-black text-emerald-700">{formatMoney(expense.paidAmount)}</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Saldo Pendiente</p>
              <p className="text-xl font-black text-rose-700">{formatMoney(balanceDue)}</p>
            </div>
          </div>

          {/* Barra de Progreso del Pago */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Progreso de pago</span>
              <span>{paymentProgress.toFixed(0)}% Completado</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-1000 ${paymentProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                style={{ width: `${paymentProgress}%` }}
              ></div>
            </div>
          </div>

          {/* SECCIÓN 2: Detalles Operativos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1"><Building2 className="w-3.5 h-3.5" /> Proveedor</p>
                <p className="text-base font-semibold text-slate-800">{expense.supplierName}</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1"><Tag className="w-3.5 h-3.5" /> Categoría</p>
                <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-sm font-medium border border-slate-200">
                  {expense.categoryName}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5" /> Fechas</p>
                <div className="text-sm text-slate-700">
                  <p><span className="text-slate-500">Emitida:</span> {formatDate(expense.issueDate)}</p>
                  <p className="font-medium mt-0.5"><span className="text-slate-500">Vence:</span> <span className={new Date(expense.dueDate) < new Date() && expense.status !== 'PAID' ? 'text-rose-600' : ''}>{formatDate(expense.dueDate)}</span></p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1"><FileText className="w-3.5 h-3.5" /> N° Factura / Soporte</p>
                <p className="text-sm font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded inline-block border border-slate-200">
                  {expense.invoiceNumber || 'Sin número de factura'}
                </p>
              </div>
            </div>

          </div>

          {/* SECCIÓN 3: Descripción */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Concepto / Descripción</p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
              {expense.description}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            Cerrar Detalle
          </button>
        </div>

      </div>
    </div>
  );
}
