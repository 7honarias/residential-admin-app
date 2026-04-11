'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { X, Receipt, Building2, Calendar, DollarSign, UploadCloud } from 'lucide-react';
import { fetchSuppliers } from '@/services/suppliers.service';
import { createExpense, fetchExpenseCategories } from '@/services/expenses.service';
import type { Supplier } from '@/app/dashboard/finances/suppliers/suppliers.types';
import type { ExpenseCategory } from '@/services/expenses.service';

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateExpenseModal({ isOpen, onClose, onSuccess }: CreateExpenseModalProps) {
  const token = useAppSelector((state) => state.auth.token);
  const complexId = useAppSelector((state) => state.complex.activeComplex?.id);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Estados del formulario
  const [supplierId, setSupplierId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]); // Hoy por defecto
  const [dueDate, setDueDate] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar proveedores y categorias reales al abrir el modal
  useEffect(() => {
    if (isOpen && complexId && token) {
      const loadSuppliers = async () => {
        setIsLoadingSuppliers(true);
        try {
          const suppliersData = await fetchSuppliers({ token, complexId });
          setSuppliers(suppliersData);
        } catch (err) {
          setSuppliers([]);
          setError(err instanceof Error ? err.message : 'Error cargando proveedores');
        } finally {
          setIsLoadingSuppliers(false);
        }
      };

      const loadCategories = async () => {
        setIsLoadingCategories(true);
        try {
          const categoriesData = await fetchExpenseCategories({ token, complexId });
          setCategories(categoriesData);
        } catch (err) {
          setCategories([]);
          setError(err instanceof Error ? err.message : 'Error cargando categorias de gasto');
        } finally {
          setIsLoadingCategories(false);
        }
      };

      void loadSuppliers();
      void loadCategories();
      
      // Resetear fechas por defecto
      const today = new Date().toISOString().split('T')[0];
      setIssueDate(today);
      setDueDate(today);
    }
  }, [isOpen, complexId, token]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complexId || !token) return;

    if (!supplierId || !categoryId) {
      setError('Debes seleccionar proveedor y categoría para registrar el gasto.');
      return;
    }

    const normalizedInvoiceNumber = invoiceNumber.trim();
    if (!normalizedInvoiceNumber) {
      setError('El numero de factura es obligatorio.');
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('El valor total debe ser mayor a 0.');
      return;
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      setError('La fecha de vencimiento no puede ser anterior a la fecha de emisión.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createExpense({
        token,
        complexId,
        payload: {
          supplier_id: supplierId,
          category_id: categoryId,
          invoice_number: normalizedInvoiceNumber,
          issue_date: issueDate,
          due_date: dueDate,
          description: description.trim(),
          total_amount: parsedAmount,
        },
      });
      
      // Limpiamos y cerramos
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el gasto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Resetear formulario
    setSupplierId('');
    setCategoryId('');
    setInvoiceNumber('');
    setDescription('');
    setAmount('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Registrar Nuevo Gasto</h2>
              <p className="text-sm text-slate-500">Ingresa la factura o cuenta de cobro</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="overflow-y-auto p-6">
          <form id="create-expense-form" onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">
                {error}
              </div>
            )}

            {/* SECCIÓN 1: Proveedor y Categoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" /> Proveedor
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  disabled={isLoadingSuppliers}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition"
                >
                  <option value="" disabled>
                    {isLoadingSuppliers ? 'Cargando proveedores...' : 'Seleccione un proveedor...'}
                  </option>
                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                      disabled={!supplier.isActive}
                    >
                      {supplier.name}
                      {supplier.category ? ` - ${supplier.category}` : ''}
                      {!supplier.isActive ? ' (Inactivo)' : ''}
                    </option>
                  ))}
                </select>
                {!isLoadingSuppliers && suppliers.length === 0 && (
                  <p className="text-xs text-amber-700">No hay proveedores disponibles para este conjunto.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Categoría del Gasto</label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isLoadingCategories}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition"
                >
                  <option value="" disabled>
                    {isLoadingCategories ? 'Cargando categorias...' : 'Seleccione una categoria...'}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id} disabled={!category.isActive}>
                      {category.name}
                      {!category.isActive ? ' (Inactiva)' : ''}
                    </option>
                  ))}
                </select>
                {!isLoadingCategories && categories.length === 0 && (
                  <p className="text-xs text-amber-700">No hay categorias de gasto disponibles para este conjunto.</p>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: Descripción */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Descripción o Concepto</label>
              <textarea
                required
                rows={2}
                placeholder="Ej: Pago servicio de acueducto mes de Marzo"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition resize-none"
              />
            </div>

            {/* SECCIÓN 3: Monto y Número de Factura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Valor Total a Pagar</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition font-bold text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">N° de Factura</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: FE-9902"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition"
                />
              </div>
            </div>

            {/* SECCIÓN 4: Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Fecha de Emisión
                </label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Vence el
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition"
                />
              </div>
            </div>

            {/* SECCIÓN 5: Soporte (Opcional) */}
            <div className="pt-2">
               <label className="text-sm font-semibold text-slate-700 block mb-2">Soporte Adjunto (Opcional)</label>
               <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer group">
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Haz clic para subir el PDF o foto de la factura</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG o PDF hasta 5MB</p>
               </div>
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
            form="create-expense-form"
            disabled={isSubmitting}
            className="px-8 py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? 'Registrando...' : 'Guardar Gasto'}
          </button>
        </div>

      </div>
    </div>
  );
}
