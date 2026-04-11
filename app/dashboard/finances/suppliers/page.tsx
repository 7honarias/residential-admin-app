'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowDownUp, Plus, Search, Store, Users } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import {
  createSupplier,
  deleteSupplier,
  fetchSuppliers,
  updateSupplier,
} from '@/services/suppliers.service';
import SupplierFormModal from '@/components/finances/suppliers/SupplierFormModal';
import SuppliersTable, {
  SupplierSortDirection,
  SupplierSortField,
} from '@/components/finances/suppliers/SuppliersTable';
import { Supplier, UpsertSupplierPayload } from './suppliers.types';

export default function SuppliersPage() {
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const token = useAppSelector((state) => state.auth.token);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SupplierSortField>('name');
  const [sortDirection, setSortDirection] = useState<SupplierSortDirection>('asc');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const complexId = activeComplex?.id;

  const loadSuppliers = useCallback(async () => {
    if (!complexId || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchSuppliers({ token, complexId });
      setSuppliers(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error cargando proveedores');
    } finally {
      setIsLoading(false);
    }
  }, [complexId, token]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => setSuccessMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const filteredAndSortedSuppliers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = suppliers.filter((supplier) => {
      if (!query) return true;

      const searchableValues = [
        supplier.name,
        supplier.category,
        supplier.contactName,
        supplier.email,
        supplier.phone,
        supplier.taxId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableValues.includes(query);
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortField === 'isActive') {
        const aValue = a.isActive ? 1 : 0;
        const bValue = b.isActive ? 1 : 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (sortField === 'createdAt') {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }

      const aValue = String(a[sortField] || '').toLowerCase();
      const bValue = String(b[sortField] || '').toLowerCase();

      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue, 'es', { sensitivity: 'base' })
        : bValue.localeCompare(aValue, 'es', { sensitivity: 'base' });
    });

    return sorted;
  }, [suppliers, searchQuery, sortField, sortDirection]);

  const activeSuppliers = suppliers.filter((supplier) => supplier.isActive).length;
  const inactiveSuppliers = suppliers.length - activeSuppliers;

  const handleSortChange = (field: SupplierSortField) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('asc');
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setModalMode('edit');
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
  };

  const handleSubmitSupplier = async (payload: UpsertSupplierPayload) => {
    if (!complexId || !token) return;

    setIsSubmitting(true);

    try {
      if (modalMode === 'create') {
        await createSupplier({ token, complexId, payload });
        setSuccessMessage('Proveedor creado correctamente.');
      } else if (selectedSupplier) {
        await updateSupplier({
          token,
          complexId,
          supplierId: selectedSupplier.id,
          payload,
        });
        setSuccessMessage('Proveedor actualizado correctamente.');
      }

      closeModal();
      await loadSuppliers();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!complexId || !token) return;

    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar a ${supplier.name}? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setDeletingId(supplier.id);
    setError(null);

    try {
      await deleteSupplier({ token, complexId, supplierId: supplier.id });
      setSuccessMessage('Proveedor eliminado correctamente.');
      await loadSuppliers();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Error eliminando proveedor');
    } finally {
      setDeletingId(null);
    }
  };

  if (!complexId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-lg font-semibold text-slate-700">No hay un conjunto activo seleccionado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Directorio de Proveedores</h1>
            <p className="text-sm text-slate-600">
              Administra los aliados de servicios del conjunto con información centralizada para finanzas.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nuevo proveedor
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Total</p>
            <p className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <Store className="w-5 h-5 text-indigo-600" />
              {suppliers.length}
            </p>
          </div>

          <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-sm">
            <p className="text-xs font-semibold uppercase text-emerald-700 tracking-wide">Activos</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{activeSuppliers}</p>
          </div>

          <div className="p-4 bg-white border border-slate-300 rounded-xl shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Inactivos</p>
            <p className="text-2xl font-black text-slate-700 mt-1">{inactiveSuppliers}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xl">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por proveedor, categoría, contacto, email, teléfono o NIT..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="flex gap-2 items-center">
            <select
              value={sortField}
              onChange={(event) => setSortField(event.target.value as SupplierSortField)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name">Ordenar por nombre</option>
              <option value="category">Ordenar por categoría</option>
              <option value="contactName">Ordenar por contacto</option>
              <option value="createdAt">Ordenar por fecha</option>
              <option value="isActive">Ordenar por estado</option>
            </select>

            <button
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              title="Cambiar dirección de orden"
            >
              <ArrowDownUp className="w-4 h-4" />
              {sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center text-slate-500 font-medium">
            Cargando directorio de proveedores...
          </div>
        ) : filteredAndSortedSuppliers.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl shadow-sm p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">
              {searchQuery ? 'No hay resultados para tu búsqueda' : 'Aún no hay proveedores registrados'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {searchQuery
                ? 'Prueba con otro término o limpia los filtros para volver a ver todo el directorio.'
                : 'Crea el primer proveedor para empezar a gestionar pagos y egresos con trazabilidad.'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <SuppliersTable
              suppliers={filteredAndSortedSuppliers}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              onEdit={openEditModal}
              onDelete={handleDeleteSupplier}
              deletingId={deletingId}
            />
          </div>
        )}
      </div>

      <SupplierFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        supplier={selectedSupplier}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onSubmit={handleSubmitSupplier}
      />
    </div>
  );
}
