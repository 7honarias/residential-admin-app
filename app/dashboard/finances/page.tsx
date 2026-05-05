'use client';

import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useAppSelector } from '@/store/hooks';
import { fetchInvoices, fetchAllInvoicesForExport } from '@/services/invoices.service';
import { IInvoice, InvoiceStatus } from './invoices.types';
import InvoicesTable from '@/components/finances/InvoicesTable';
import InvoiceFilters from '@/components/finances/InvoiceFilters';
import InvoiceDetailModal from '@/components/finances/InvoiceDetailModal';
import ManualPaymentModal from '@/components/finances/ManualPaymentModal';
import UploadInvoicesModal from '@/components/finances/UploadInvoicesModal';
import InvoicesTableSkeleton from '@/components/finances/InvoicesTableSkeleton';
import { AlertCircle, Plus, Upload } from 'lucide-react';

type FilterStatus = InvoiceStatus | 'ALL';

const STATUS_OPTIONS: { label: string; value: FilterStatus }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Vencidas', value: 'OVERDUE' },
  { label: 'Pago Parcial', value: 'PARTIALLY_PAID' },
  { label: 'Pagadas', value: 'PAID' },
  { label: 'Canceladas', value: 'CANCELLED' },
];

const MONTH_NAMES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const getExportFileName = (status: FilterStatus, startDate: string, endDate: string) => {
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label.toLowerCase() ?? 'facturas';
  if (startDate && endDate) {
    const sameMonth = startDate.slice(0, 7) === endDate.slice(0, 7);
    if (sameMonth) {
      const [year, month] = startDate.slice(0, 7).split('-').map(Number);
      return `cartera_${statusLabel}_${MONTH_NAMES_ES[month - 1]}_${year}.xlsx`;
    }
    return `cartera_${statusLabel}_${startDate}_a_${endDate}.xlsx`;
  }
  return `cartera_${statusLabel}_todo_el_periodo.xlsx`;
};

export default function FinancesPage() {
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const token = useAppSelector((state) => state.auth.token);

  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<IInvoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Active filters (trigger fetch)
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('PENDING');
  const [activeBlockSearch, setActiveBlockSearch] = useState('');
  const [activeApartmentSearch, setActiveApartmentSearch] = useState('');
  const [activePeriodMonthNum, setActivePeriodMonthNum] = useState<number | undefined>();
  const [activePeriodYear, setActivePeriodYear] = useState<number | undefined>();
  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');

  // Temp filters (filter UI, not yet applied)
  const [tempStatus, setTempStatus] = useState<FilterStatus>('PENDING');
  const [tempBlockSearch, setTempBlockSearch] = useState('');
  const [tempApartmentSearch, setTempApartmentSearch] = useState('');
  const [tempPeriodMonth, setTempPeriodMonth] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  const complexId = activeComplex?.id;

  const loadInvoices = useCallback(
    async (cursor: string | null = null) => {
      if (!complexId || !token) return;

      const loaderSetter = cursor ? setIsLoadingMore : setIsLoading;
      loaderSetter(true);
      setError(null);

      try {
        const response = await fetchInvoices({
          token,
          complexId,
          options: {
            status: activeStatus === 'ALL' ? 'ALL' : activeStatus,
            blockSearch: activeBlockSearch || undefined,
            apartmentSearch: activeApartmentSearch || undefined,
            periodMonth: activePeriodMonthNum,
            periodYear: activePeriodYear,
            startDate: activeStartDate || undefined,
            endDate: activeEndDate || undefined,
            cursor: cursor || '1',
          },
        });

        const invoicesList = response?.invoices || [];

        if (cursor && cursor !== '1') {
          setInvoices((prev) => {
            const existingIds = new Set(prev.map((inv) => inv.id));
            return [...prev, ...invoicesList.filter((inv: IInvoice) => !existingIds.has(inv.id))];
          });
        } else {
          setInvoices(invoicesList);
        }

        setNextCursor(response?.nextCursor || null);
        setHasMore(!!response?.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando facturas');
      } finally {
        loaderSetter(false);
      }
    },
    [complexId, token, activeStatus, activeBlockSearch, activeApartmentSearch, activePeriodMonthNum, activePeriodYear, activeStartDate, activeEndDate]
  );

  useEffect(() => {
    if (complexId && token) {
      loadInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complexId, token, activeStatus, activeBlockSearch, activeApartmentSearch, activePeriodMonthNum, activePeriodYear, activeStartDate, activeEndDate]);

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      loadInvoices(nextCursor);
    }
  };

  // Status tabs apply immediately
  const handleStatusChange = (status: FilterStatus) => {
    setTempStatus(status);
    setActiveStatus(status);
    setInvoices([]);
    setNextCursor(null);
  };

  const handleBlockSearchChange = (value: string) => setTempBlockSearch(value);
  const handleApartmentSearchChange = (value: string) => setTempApartmentSearch(value);

  const handleClearBlockSearch = () => {
    setTempBlockSearch('');
    setActiveBlockSearch('');
    setInvoices([]);
    setNextCursor(null);
  };

  const handleClearApartmentSearch = () => {
    setTempApartmentSearch('');
    setActiveApartmentSearch('');
    setInvoices([]);
    setNextCursor(null);
  };

  // Month picker only sets period_month/year — independent from due_date range
  const handlePeriodMonthChange = (month: string) => {
    setTempPeriodMonth(month);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setTempStartDate(start);
    setTempEndDate(end);
  };

  const handleApplyFilters = () => {
    const parsed = tempPeriodMonth ? tempPeriodMonth.split('-').map(Number) : [];
    setActiveBlockSearch(tempBlockSearch);
    setActiveApartmentSearch(tempApartmentSearch);
    setActivePeriodMonthNum(parsed[1] ?? undefined);
    setActivePeriodYear(parsed[0] ?? undefined);
    setActiveStartDate(tempStartDate);
    setActiveEndDate(tempEndDate);
    setInvoices([]);
    setNextCursor(null);
  };

  const handleClearFilters = () => {
    setTempBlockSearch('');
    setTempApartmentSearch('');
    setTempPeriodMonth('');
    setTempStartDate('');
    setTempEndDate('');
    setActiveBlockSearch('');
    setActiveApartmentSearch('');
    setActivePeriodMonthNum(undefined);
    setActivePeriodYear(undefined);
    setActiveStartDate('');
    setActiveEndDate('');
    setInvoices([]);
    setNextCursor(null);
  };

  const handleDownloadExcel = async () => {
    if (!complexId || !token) return;
    setIsExporting(true);
    try {
      const allInvoices = await fetchAllInvoicesForExport({
        token,
        complexId,
        options: {
          status: activeStatus === 'ALL' ? 'ALL' : activeStatus,
          blockSearch: activeBlockSearch || undefined,
          apartmentSearch: activeApartmentSearch || undefined,
          periodMonth: activePeriodMonthNum,
          periodYear: activePeriodYear,
          startDate: activeStartDate || undefined,
          endDate: activeEndDate || undefined,
        },
      });

      const rows = allInvoices.map((inv) => ({
        'Apartamento': `${inv.block_number ? inv.block_number + ' - ' : ''}${inv.apartment_number}`,
        'Tipo': inv.type,
        'Descripción': inv.description,
        'Monto Original': inv.amount,
        'Saldo Pendiente': inv.balance_due,
        'Estado': inv.status,
        'Fecha Vencimiento': inv.due_date ? inv.due_date.slice(0, 10) : '',
        'Creado': inv.created_at ? inv.created_at.slice(0, 10) : '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Cartera');
      XLSX.writeFile(wb, getExportFileName(activeStatus, activeStartDate, activeEndDate));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando el Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleInvoiceClick = (invoice: IInvoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedInvoice(null);
  };

  const handlePaymentSuccess = () => {
    loadInvoices();
    setIsPaymentModalOpen(false);
  };

  const handleUploadSuccess = () => {
    loadInvoices();
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Facturación y Cartera</h1>
            <p className="text-slate-600 text-sm">Visualiza y gestiona las facturas del conjunto</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium whitespace-nowrap flex-shrink-0"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">Cargar Facturas</span>
              <span className="sm:hidden">Excel</span>
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Registrar Pago Manual</span>
              <span className="sm:hidden">Pago Manual</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <InvoiceFilters
          selectedStatus={tempStatus}
          onStatusChange={handleStatusChange}
          statusOptions={STATUS_OPTIONS}
          blockSearch={tempBlockSearch}
          apartmentSearch={tempApartmentSearch}
          onBlockSearchChange={handleBlockSearchChange}
          onApartmentSearchChange={handleApartmentSearchChange}
          onClearBlockSearch={handleClearBlockSearch}
          onClearApartmentSearch={handleClearApartmentSearch}
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

        {/* Error Toast */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-red-800 font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-900 font-semibold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Table or Loading or Empty */}
        {isLoading && <InvoicesTableSkeleton rows={5} />}

        {!isLoading && invoices.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No se encontraron facturas
            </h3>
            <p className="text-slate-600">
              {(activeBlockSearch || activeApartmentSearch)
                ? 'Intenta con otra torre o número de apartamento'
                : activeStatus === 'ALL'
                  ? 'No hay facturas registradas para estos filtros'
                  : 'No hay facturas con este estado'}
            </p>
          </div>
        )}

        {!isLoading && invoices.length > 0 && (
          <>
            <InvoicesTable
              invoices={invoices}
              onRowClick={handleInvoiceClick}
            />

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingMore ? 'Cargando...' : 'Cargar Más'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          isOpen={isDetailModalOpen}
          onClose={handleDetailModalClose}
        />
      )}

      <ManualPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      <UploadInvoicesModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

