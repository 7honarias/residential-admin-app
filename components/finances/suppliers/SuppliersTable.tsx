'use client';

import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Supplier } from '@/app/dashboard/finances/suppliers/suppliers.types';

export type SupplierSortField = 'name' | 'category' | 'contactName' | 'createdAt' | 'isActive';
export type SupplierSortDirection = 'asc' | 'desc';

interface SuppliersTableProps {
  suppliers: Supplier[];
  sortField: SupplierSortField;
  sortDirection: SupplierSortDirection;
  onSortChange: (field: SupplierSortField) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  deletingId: string | null;
}

const HEADER_CONFIG: { key: SupplierSortField; label: string }[] = [
  { key: 'name', label: 'Proveedor' },
  { key: 'category', label: 'Categoría' },
  { key: 'contactName', label: 'Contacto' },
  { key: 'createdAt', label: 'Registro' },
  { key: 'isActive', label: 'Estado' },
];

export default function SuppliersTable({
  suppliers,
  sortField,
  sortDirection,
  onSortChange,
  onEdit,
  onDelete,
  deletingId,
}: SuppliersTableProps) {
  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
          <tr>
            {HEADER_CONFIG.map((header) => {
              const isActiveSort = sortField === header.key;

              return (
                <th key={header.key} className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onSortChange(header.key)}
                    className="inline-flex items-center gap-1.5 hover:text-slate-700 transition-colors"
                  >
                    <span>{header.label}</span>
                    <ArrowUpDown
                      className={`w-4 h-4 ${isActiveSort ? 'text-indigo-600' : 'text-slate-400'}`}
                    />
                    {isActiveSort && (
                      <span className="text-[10px] font-bold uppercase text-indigo-600">
                        {sortDirection}
                      </span>
                    )}
                  </button>
                </th>
              );
            })}
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {suppliers.map((supplier) => (
            <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <p className="font-semibold text-slate-800">{supplier.name}</p>
                <p className="text-xs text-slate-500 mt-1">NIT/Doc: {supplier.taxId || 'Sin registro'}</p>
              </td>

              <td className="px-6 py-4">
                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
                  {supplier.category || 'Sin categoría'}
                </span>
              </td>

              <td className="px-6 py-4">
                <p className="font-medium text-slate-700">{supplier.contactName || 'Sin contacto'}</p>
                <p className="text-xs text-slate-500">{supplier.email || 'Sin email'}</p>
                <p className="text-xs text-slate-500">{supplier.phone || 'Sin teléfono'}</p>
              </td>

              <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{formatDate(supplier.createdAt)}</td>

              <td className="px-6 py-4">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                    supplier.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {supplier.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </td>

              <td className="px-6 py-4">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(supplier)}
                    className="inline-flex items-center gap-1 px-3 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>

                  <button
                    onClick={() => onDelete(supplier)}
                    disabled={deletingId === supplier.id}
                    className="inline-flex items-center gap-1 px-3 py-2 border border-rose-200 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingId === supplier.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
