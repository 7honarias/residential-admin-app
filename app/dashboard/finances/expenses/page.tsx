'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { fetchExpenses } from '@/services/expenses.service'; // Asumiendo que crearás este servicio
import { IExpense, ExpenseStatus } from './expenses.types'; // Asumiendo que crearás estos tipos
import ExpensesTable from '@/components/expenses/ExpensesTable';
import ExpenseFilters from '@/components/expenses/ExpenseFilters';
import RegisterExpensePaymentModal from '@/components/expenses/RegisterExpensePaymentModal';
import ExpensesTableSkeleton from '@/components/expenses/ExpensesTableSkeleton';
import { AlertCircle, Plus, Users, Receipt } from 'lucide-react';
import CreateExpenseModal from '@/components/expenses/createExpenseModal';
import ExpenseDetailModal from '@/components/expenses/ExpenseDetailModal';

type FilterStatus = ExpenseStatus | 'ALL';

// Estados basados en la tabla SQL que creamos
const STATUS_OPTIONS: { label: string; value: FilterStatus }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Por Pagar', value: 'PENDING' },
  { label: 'Pago Parcial', value: 'PARTIALLY_PAID' },
  { label: 'Pagados', value: 'PAID' },
  { label: 'Cancelados', value: 'CANCELLED' },
];

export default function ExpensesPage() {
  const router = useRouter();
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const token = useAppSelector((state) => state.auth.token);

  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('PENDING');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<IExpense | null>(null);
  
  // Control de Modales
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Control de Carga y Paginación
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const complexId = activeComplex?.id;

  // Cargar egresos con paginación
  const loadExpenses = useCallback(
    async (cursor: string | null = null) => {
      const loaderSetter = cursor ? setIsLoadingMore : setIsLoading;
      loaderSetter(true);
      setError(null);

      try {
        const response = await fetchExpenses({
          token: token ?? '',
          complexId: complexId ?? '',
          options: {
            status: selectedStatus === 'ALL' ? 'ALL' : selectedStatus,
            search: supplierSearch || undefined, // Búsqueda por nombre de proveedor o # de factura
            cursor: cursor || '1',
          },
        });

        const expensesList = response?.expenses || [];

        if (cursor && cursor !== '1') {
          // Filtro anti-duplicados para el "Load More"
          setExpenses((prev) => {
            const existingIds = new Set(prev.map(exp => exp.id));
            const uniqueNewExpenses = expensesList.filter((exp: IExpense) => !existingIds.has(exp.id));
            return [...prev, ...uniqueNewExpenses];
          });
        } else {
          setExpenses(expensesList);
        }

        setNextCursor(response?.nextCursor || null);
        setHasMore(!!response?.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando los egresos');
      } finally {
        loaderSetter(false);
      }
    },
    [complexId, token, selectedStatus, supplierSearch]
  );

  // Carga inicial
  useEffect(() => {
    if (complexId && token) {
      loadExpenses();
    }
  }, [complexId, token, selectedStatus, supplierSearch, loadExpenses]);

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      loadExpenses(nextCursor);
    }
  };

  const handleFilterStatusChange = (status: FilterStatus) => {
    setSelectedStatus(status);
    setExpenses([]);
    setNextCursor(null);
  };

  const handleSupplierSearchChange = (search: string) => {
    setSupplierSearch(search);
    setExpenses([]);
    setNextCursor(null);
  };

  const handleClearSearch = () => {
    setSupplierSearch('');
    setExpenses([]);
    setNextCursor(null);
  };

  // Acciones de fila
  const handleExpenseClick = (expense: IExpense) => {
    setSelectedExpense(expense);
    setIsDetailModalOpen(true);
  };

  // Acciones de éxito tras crear/pagar
  const handleSuccessAction = () => {
    loadExpenses(); // Recargar la lista desde cero
    setIsCreateModalOpen(false);
    setIsPaymentModalOpen(false);
  };

  if (!complexId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-lg font-semibold text-slate-700">
            No active complex selected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Egresos</h1>
            <p className="text-slate-600 text-sm">Gestiona las cuentas por pagar y los gastos del conjunto</p>
          </div>
          <div className="flex gap-3">
            {/* Botón secundario para ir al directorio de proveedores (Opcional) */}
            <button
              onClick={() => router.push('/dashboard/finances/suppliers')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium whitespace-nowrap flex-shrink-0 shadow-sm"
            >
              <Users className="w-5 h-5 text-slate-500" />
              <span className="hidden sm:inline">Proveedores</span>
            </button>
            
            {/* Botón principal de acción */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium whitespace-nowrap flex-shrink-0 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Registrar Gasto</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Filters (Reutilizamos la lógica visual, pero buscamos por proveedor/factura) */}
        <ExpenseFilters
          selectedStatus={selectedStatus}
          onStatusChange={handleFilterStatusChange}
          searchQuery={supplierSearch}
          onSearchChange={handleSupplierSearchChange}
          onClearSearch={handleClearSearch}
          statusOptions={STATUS_OPTIONS}
          searchPlaceholder="Buscar proveedor o # factura..."
        />

        {/* Error Toast */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-red-800 font-medium flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> {error}
            </p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-900 font-semibold">
              ✕
            </button>
          </div>
        )}

        {/* Listado / Estados de Carga / Vacío */}
        {isLoading && <ExpensesTableSkeleton rows={5} />}

        {!isLoading && expenses.length === 0 && !error && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Receipt className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No hay egresos para mostrar
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {supplierSearch
                ? 'No encontramos ningún proveedor o factura con ese término.'
                : selectedStatus === 'ALL'
                  ? 'Aquí aparecerán los gastos operativos, servicios y pagos a contratistas.'
                  : 'No hay gastos registrados bajo este estado.'}
            </p>
          </div>
        )}

        {!isLoading && expenses.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <ExpensesTable
              expenses={expenses}
              onRowClick={handleExpenseClick}
              onPayClick={(expense) => {
                setSelectedExpense(expense);
                setIsPaymentModalOpen(true);
              }}
            />

            {/* Load More Button */}
            {hasMore && (
              <div className="p-6 border-t border-slate-100 text-center bg-slate-50">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isLoadingMore ? 'Cargando más...' : 'Ver más egresos'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedExpense(null);
          }}
        />
      )}

      <CreateExpenseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSuccessAction}
      />

      {selectedExpense && (
        <RegisterExpensePaymentModal
          expense={selectedExpense}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedExpense(null);
          }}
          onSuccess={handleSuccessAction}
        />
      )}
    </div>
  );
}
