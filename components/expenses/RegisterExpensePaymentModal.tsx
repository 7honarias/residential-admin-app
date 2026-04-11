/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { X, CreditCard, Building2, AlertCircle, DollarSign, Calendar, FileText } from 'lucide-react';
import { IExpense } from '@/app/dashboard/finances/expenses/expenses.types';
import { registerExpensePayment, type RegisterExpensePaymentPayload } from '@/services/expenses.service';

interface RegisterExpensePaymentModalProps {
  expense: IExpense;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterExpensePaymentModal({
  expense,
  isOpen,
  onClose,
  onSuccess,
}: RegisterExpensePaymentModalProps) {
  const token = useAppSelector((state) => state.auth.token);
  const complexId = useAppSelector((state) => state.complex.activeComplex?.id);

  // Cálculos de saldo
  const balanceDue = expense.totalAmount - expense.paidAmount;

  const [amount, setAmount] = useState<string>(balanceDue.toString());
  const [paymentMethod, setPaymentMethod] = useState<RegisterExpensePaymentPayload['payment_method']>('TRANSFER');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default date when opened
  useEffect(() => {
    if (isOpen) {
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setAmount(balanceDue.toString()); // Por defecto sugerimos pagar todo el saldo
    }
  }, [isOpen, balanceDue]);

  if (!isOpen) return null;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complexId || !token) return;

    const paymentAmount = Number(amount);

    // Validaciones fuertes (UX Preventiva)
    if (paymentAmount <= 0) {
      setError('El monto a pagar debe ser mayor a cero.');
      return;
    }
    if (paymentAmount > balanceDue) {
      setError(`El monto no puede ser mayor al saldo pendiente (${formatMoney(balanceDue)}).`);
      return;
    }
    if (!paymentDate) {
      setError('La fecha del pago es obligatoria.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await registerExpensePayment({
        token,
        complexId,
        payload: {
          expense_id: expense.id,
          amount_paid: paymentAmount,
          payment_method: paymentMethod,
          payment_date: paymentDate,
          reference_code: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        }
      });

      handleClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setReference('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Registrar Pago a Proveedor</h2>
              <p className="text-sm text-slate-500">Salida de dinero de caja/bancos</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de la Deuda */}
        <div className="px-6 py-4 bg-indigo-50/50 border-b border-indigo-100 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                <Building2 className="w-4 h-4 text-indigo-500" /> {expense.supplierName}
              </p>
              <p className="text-xs text-slate-500">{expense.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 uppercase">Saldo Pendiente</p>
              <p className="text-2xl font-black text-rose-600 leading-tight">{formatMoney(balanceDue)}</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="overflow-y-auto p-6">
          <form id="payment-expense-form" onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Monto a Pagar */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Monto del Abono o Pago</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={balanceDue}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition font-bold text-lg"
                />
              </div>
              <p className="text-xs text-slate-500 text-right">
                Total factura: {formatMoney(expense.totalAmount)}
              </p>
            </div>

            {/* Fecha y Método */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" /> Fecha del Pago
                </label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]} // No permitir pagos en el futuro
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Forma de Pago</label>
                <select
                  required
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as RegisterExpensePaymentPayload['payment_method'])}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition"
                >
                  <option value="TRANSFER">Transferencia</option>
                  <option value="DEBIT">Débito Automático</option>
                  <option value="CHECK">Cheque</option>
                  <option value="CASH">Efectivo (Caja Chica)</option>
                </select>
              </div>
            </div>

            {/* Referencia (Crucial para conciliación bancaria) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" /> N° de Comprobante / Referencia Bancaria
              </label>
              <input
                type="text"
                placeholder="Ej: TRX-99023412"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition"
              />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Notas Adicionales (Opcional)</label>
              <textarea
                rows={2}
                placeholder="Ej: Pago realizado desde la cuenta de ahorros terminada en 4455"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition resize-none"
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-3 font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="payment-expense-form"
            disabled={isSubmitting}
            className="px-8 py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Registrando...' : 'Confirmar Pago'}
          </button>
        </div>

      </div>
    </div>
  );
}
