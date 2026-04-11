'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import { X, Save, Building2, User, Mail, Phone, FileText } from 'lucide-react';
import { Supplier, UpsertSupplierPayload } from '@/app/dashboard/finances/suppliers/suppliers.types';

interface SupplierFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  supplier: Supplier | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: UpsertSupplierPayload) => Promise<void>;
}

interface SupplierFormState {
  name: string;
  category: string;
  contact_name: string;
  email: string;
  phone: string;
  tax_id: string;
  notes: string;
  is_active: boolean;
}

const INITIAL_FORM_STATE: SupplierFormState = {
  name: '',
  category: '',
  contact_name: '',
  email: '',
  phone: '',
  tax_id: '',
  notes: '',
  is_active: true,
};

export default function SupplierFormModal({
  isOpen,
  mode,
  supplier,
  isSubmitting,
  onClose,
  onSubmit,
}: SupplierFormModalProps) {
  const [form, setForm] = useState<SupplierFormState>(INITIAL_FORM_STATE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && supplier) {
      setForm({
        name: supplier.name,
        category: supplier.category ?? '',
        contact_name: supplier.contactName ?? '',
        email: supplier.email ?? '',
        phone: supplier.phone ?? '',
        tax_id: supplier.taxId ?? '',
        notes: supplier.notes ?? '',
        is_active: supplier.isActive,
      });
      return;
    }

    setForm(INITIAL_FORM_STATE);
  }, [isOpen, mode, supplier]);

  if (!isOpen) return null;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const cleanName = form.name.trim();
    if (cleanName.length < 2) {
      setError('El nombre del proveedor debe tener al menos 2 caracteres.');
      return;
    }

    try {
      await onSubmit({
        name: cleanName,
        category: form.category.trim() || null,
        contact_name: form.contact_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        tax_id: form.tax_id.trim() || null,
        notes: form.notes.trim() || null,
        is_active: form.is_active,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No fue posible guardar el proveedor.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {mode === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
            </h2>
            <p className="text-sm text-slate-500">Gestiona datos de contacto y clasificación contable.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" /> Nombre del proveedor
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Ej: Servicios Integrales S.A.S"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Categoría</label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Ej: Mantenimiento"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" /> NIT / Documento
              </label>
              <input
                name="tax_id"
                value={form.tax_id}
                onChange={handleChange}
                placeholder="Ej: 900123456-7"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" /> Contacto principal
              </label>
              <input
                name="contact_name"
                value={form.contact_name}
                onChange={handleChange}
                placeholder="Nombre del contacto"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" /> Correo
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="contacto@proveedor.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-400" /> Teléfono
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Ej: 3001234567"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Notas</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Datos de facturación, condiciones de pago, observaciones..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition resize-none"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-700">Proveedor activo</p>
                <p className="text-xs text-slate-500">Puedes desactivarlo sin eliminar historial.</p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear proveedor' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
