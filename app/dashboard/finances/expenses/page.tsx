'use client';

import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { fetchExpenses, fetchAllExpensesForExport } from '@/services/expenses.service';
import { IExpense, ExpenseStatus } from './expenses.types';
import ExpensesTable from '@/components/expenses/ExpensesTable';
import ExpenseFilters from '@/components/expenses/ExpenseFilters';
import RegisterExpensePaymentModal from '@/components/expenses/RegisterExpensePaymentModal';
import ExpensesTableSkeleton from '@/components/expenses/ExpensesTableSkeleton';
import { AlertCircle, Plus, Users, Receipt } from 'lucide-react';
import CreateExpenseModal from '@/components/expenses/createExpenseModal';
import ExpenseDetailModal from '@/components/expenses/ExpenseDetailModal';

type FilterStatus = ExpenseStatus | 'ALL';

const MONTH_NAMES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthDateRange = (monthValue: string) => {
  const [year, month] = monthValue.split('-').map(Number);
  if (!year || !month) return { startDate: '', endDate: '' };
  return {
    startDate: formatDateInput(new Date(year, month - 1, 1)),
    endDate: formatDateInput(new Date(year, month, 0)),
  };
};

const getExportFileName = (startDate: string, endDate: string) => {
  if (startDate && endDate) {
    const sameMonth = startDate.slice(0, 7) === endDate.slice(0, 7);
    if (sameMonth) {
      const [year, month] = startDate.slice(0, 7).split('-').map(Number);
      return `egresos_${MONTH_NAMES_ES[month - 1]}_${year}.xlsx`;
    }
    return `egresos_${startDate}_a_${endDate}.xlsx`;
  }
  return 'egresos_todo_el_periodo.xlsx';
};

const parseExportLimitInput = (input: string | null): number | undefined | null => {
  if (input === null) return null;
  const normalized = input.trim().toLowerCase();
  if (!normalized || normalized === 'todo') return undefined;
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Ingresa un lÃ­mite vÃ¡lido mayor a 0 o escribe "todo"');
  }
  return parsed;
};

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
  const [selectedExpense, setSelectedExpense] = useState<IExpense | null>(null);

  // Active filters (used for fetching)
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('PENDING');
  const [activeSupplierSearch, setActiveSupplierSearch] = useState('');
  const [activePeriodMonth, setActivePeriodMonth] = useState('');
  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');

  // Temporary filters (controlled by filter UI before applying)
  const [tempStatus, setTempStatus] = useState<FilterStatus>('PENDING');
  const [tempSupplierSearch, setTempSupplierSearch] = useState('');
  const [tempPeriodMonth, setTempPeriodMonth] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  // Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Loading & pagination
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const complexId = activeComplex?.id;

  const loadExpenses = useCallback(
    async (cursor: string | null = null) => {
      if (!complexId || !token) return;
      const loaderSetter = cursor ? setIsLoadingMore : setIsLoading;
      loaderSetter(true);
      setError(null);

      try {
        const response = await fetchExpenses({
          token,
          complexId,
          options: {
            status: activeStatus === 'ALL' ? 'ALL' : activeStatus,
            search: activeSupplierSearch || undefined,
            startDate: activeStartDate || undefined,
            endDate: activeEndDate || undefined,
            cursor: cursor || '1',
          },
        });

        const expensesList = response?.expenses || [];

        if (cursor && cursor !== '1') {
          setExpenses((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            return [...prev, ...expensesList.filter((e: IExpense) => !existingIds.has(e.id))];
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
    [complexId, token, activeStatus, activeSupplierSearch, activeStartDate, activeEndDate]
  );

  useEffect(() => {
    if (complexId && token) {
      loadExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complexId, token, activeStatus, activeSupplierSearch, activeStartDate, activeEndDate]);

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) loadExpenses(nextCursor);
  };

  // Status tabs apply immediately
  const handleStatusChange = (status: FilterStatus) => {
    setTempStatus(status);
    setActiveStatus(status);
    setExpenses([]);
    setNextCursor(null);
  };

  const handleSupplierSearchChange = (search: string) => {
    setTempSupplierSearch(search);
  };

  const handleClearSearch = () => {
    setTempSupplierSearch('');
    setActiveSupplierSearch('');
    setExpenses([]);
    setNextCursor(null);
  };

  const handlePeriodMonthChange = (month: string) => {
    setTempPeriodMonth(month);
    if (!month) return;
    const { startDate, endDate } = getMonthDateRange(month);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    if (tempPeriodMonth) setTempPeriodMonth('');
    setTempStartDate(start);
    setTempEndDate(end);
  };

  const handleApplyFilters = () => {
    setActiveSupplierSearch(tempSupplierSearch);
    setActivePeriodMonth(tempPeriodMonth);
    setActiveStartDate(tempStartDate);
    setActiveEndDate(tempEndDate);
    setExpenses([]);
    setNextCursor(null);
  };

  const handleClearFilters = () => {
    setTempStatus('PENDING');
    setTempSupplierSearch('');
    setTempPeriodMonth('');
    setTempStartDate('');
    setTempEndDate('');
    setActiveStatus('PENDING');
    setActiveSupplierSearch('');
    setActivePeriodMonth('');
    setActiveStartDate('');
    setActiveEndDate('');
    setExpenses([]);
    setNextCursor(null);
  };

  const handleDownloadExcel = async () => {
    if (!complexId || !token) {
      setError('No hay complejo activo o token de autenticaciÃ³n');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const selectedMonth = tempPeriodMonth || activePeriodMonth;
      const selectedStartDate = tempStartDate || activeStartDate;
      const selectedEndDate = tempEndDate || activeEndDate;

      const normalizedRange = selectedMonth
        ? getMonthDateRange(selectedMonth)
        : { startDate: selectedStartDate, endDate: selectedEndDate };

      const baseFilters = {
        status: (tempStatus || activeStatus) === 'ALL' ? undefined : (tempStatus || activeStatus),
        search: tempSupplierSearch || activeSupplierSearch || undefined,
        startDate: normalizedRange.startDate || undefined,
        endDate: normalizedRange.endDate || undefined,
      };

      // Preview count
      const preview = await fetchExpenses({
        token,
        complexId,
        options: { ...baseFilters, limit: 1, cursor: '1' },
      });

      const total = preview.total ?? 0;

      if (total === 0) {
        setError('No hay egresos para exportar con los filtros actuales');
        return;
      }

      const periodLabel =
        normalizedRange.startDate && normalizedRange.endDate
          ? `${normalizedRange.startDate} a ${normalizedRange.endDate}`
          : 'todo el periodo disponible';

      const shouldContinue = window.confirm(
        `Se encontraron ${total} egresos con los filtros actuales.\n\n` +
        `Periodo: ${periodLabel}\n` +
        `Estado: ${baseFilters.status || 'Todos'}\n` +
        `BÃºsqueda: ${baseFilters.search || 'Ninguna'}\n\n` +
        'Â¿Deseas continuar con la descarga del Excel?'
      );
      if (!shouldContinue) return;

      const limitInput = window.prompt(
        `Â¿CuÃ¡ntos registros deseas exportar?\n` +
        `- Escribe un nÃºmero (ejemplo: 500)\n` +
        `- Escribe "todo" para exportar todos\n` +
        `Total encontrado: ${total}`,
        total > 1000 ? '1000' : String(total)
      );

      const requestedLimit = parseExportLimitInput(limitInput);
      if (requestedLimit === null) return;

      const safeLimit = requestedLimit ? Math.min(requestedLimit, total) : undefined;

      const allExpenses = await fetchAllExpensesForExport({
        token,
        complexId,
        options: { ...baseFilters, maxRecords: safeLimit },
      });

      if (allExpenses.length === 0) {
        setError('No hay egresos para exportar en el periodo seleccionado');
        return;
      }

      const rows = allExpenses.map((expense: IExpense) => ({
        Proveedor: expense.supplierName,
        'Categoria': expense.categoryName,
        '# Factura': expense.invoiceNumber || '-',
        'Fecha emision': expense.issueDate ? new Date(expense.issueDate).toLocaleDateString('es-CO') : '-',
        'Fecha vencimiento': expense.dueDate ? new Date(expense.dueDate).toLocaleDateString('es-CO') : '-',
        'Descripcion': expense.description,
        'Monto total (COP)': expense.totalAmount,
        'Monto pagado (COP)': expense.paidAmount,
        'Saldo pendiente (COP)': expense.totalAmount - expense.paidAmount,
        Estado: expense.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Egresos');
      XLSX.writeFile(workbook, getExportFileName(normalizedRange.startDate, normalizedRange.endDate));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando archivo Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExpenseClick = (expense: IExpense) => {
    setSelectedExpense(expense);
    setIsDetailModalOpen(true);
  };

  const handleSuccessAction = () => {
    loadExpenses();
    setIsCreateModalOpen(false);
    setIsPaymentModalOpen(false);
  };

  if (!complexId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-lg font-semibold text-slate-700">No active complex selected</p>
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
            <button
              onClick={() => router.push('/dashboard/finances/suppliers')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium whitespace-nowrap flex-shrink-0 shadow-sm"
            >
              <Users className="w-5 h-5 text-slate-500" />
              <span className="hidden sm:inline">Proveedores</span>
            </button>
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

        {/* Filters */}
        <ExpenseFilters
          selectedStatus={tempStatus}
          onStatusChange={handleStatusChange}
          searchQuery={tempSupplierSearch}
          onSearchChange={handleSupplierSearchChange}
          onClearSearch={handleClearSearch}
          statusOptions={STATUS_OPTIONS}
          searchPlaceholder="Buscar proveedor o # factura..."
          periodMonth={tempPeriodMonth}
          startDate={tempStartDate}
          endDate={tempEndDate}
          onPeriodMonthChange={handlePeriodMonthChange}
          onDateRangeChange={handleDateRangeChange}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          onDownloadExcel={handleDownloadExcel}
          isExporting={isExporting}
        />

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-red-800 font-medium flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> {error}
            </p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-900 font-semibold">âœ•</button>
          </div>
        )}

        {/* List */}
        {isLoading && <ExpensesTableSkeleton rows={5} />}

        {!isLoading && expenses.length === 0 && !error && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Receipt className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No hay egresos para mostrar</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {tempSupplierSearch
                ? 'No encontramos ningÃºn proveedor o factura con ese tÃ©rmino.'
                : activeStatus === 'ALL'
                  ? 'AquÃ­ aparecerÃ¡n los gastos operativos, servicios y pagos a contratistas.'
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
            {hasMore && (
              <div className="p-6 border-t border-slate-100 text-center bg-slate-50">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isLoadingMore ? 'Cargando mÃ¡s...' : 'Ver mÃ¡s egresos'}
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
          onClose={() => { setIsDetailModalOpen(false); setSelectedExpense(null); }}
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
          onClose={() => { setIsPaymentModalOpen(false); setSelectedExpense(null); }}
          onSuccess={handleSuccessAction}
        />
      )}
    </div>
  );
}
