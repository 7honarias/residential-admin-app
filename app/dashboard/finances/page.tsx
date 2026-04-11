'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { fetchInvoices } from '@/services/invoices.service';
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

export default function FinancesPage() {
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const token = useAppSelector((state) => state.auth.token);

  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('PENDING');
  const [apartmentSearch, setApartmentSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<IInvoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const complexId = activeComplex?.id;

  // Load invoices with pagination
  const loadInvoices = useCallback(
    async (cursor: string | null = null) => {
      // ... tu código de validación ...

      const loaderSetter = cursor ? setIsLoadingMore : setIsLoading;
      loaderSetter(true);
      setError(null);

      try {
        const response = await fetchInvoices({
          token: token ?? '',
          complexId: complexId ?? '',
          options: {
            status: selectedStatus === 'ALL' ? 'ALL' : selectedStatus,
            apartmentSearch: apartmentSearch || undefined,
            cursor: cursor || '1', // <--- CAMBIO CLAVE: Usar '1' como página inicial
          },
        });

        const invoicesList = response?.invoices || [];

        if (cursor && cursor !== '1') {
          // Append for "load more" CON FILTRO ANTI-DUPLICADOS
          setInvoices((prev) => {
            // 1. Creamos un Set con los IDs que ya tenemos en pantalla
            const existingIds = new Set(prev.map(inv => inv.id));
            // 2. Filtramos de la nueva lista solo los que NO existan ya
            const uniqueNewInvoices = invoicesList.filter((inv: IInvoice) => !existingIds.has(inv.id));
            // 3. Unimos la lista vieja con la nueva limpia
            return [...prev, ...uniqueNewInvoices];
          });
        } else {
          // Replace for new filter
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
    [complexId, token, selectedStatus, apartmentSearch]
  );

  // Initial load
  useEffect(() => {
    console.log('🔄 useEffect triggered - complexId:', complexId, 'token:', !!token);
    if (complexId && token) {
      console.log('✅ Calling loadInvoices from useEffect');
      loadInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complexId, token, selectedStatus, apartmentSearch]);

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      loadInvoices(nextCursor);
    }
  };

  const handleFilterStatusChange = (status: FilterStatus) => {
    setSelectedStatus(status);
    setInvoices([]); // Reset list
    setNextCursor(null);
  };

  const handleApartmentSearchChange = (search: string) => {
    setApartmentSearch(search);
    setInvoices([]); // Reset list
    setNextCursor(null);
  };

  const handleClearSearch = () => {
    setApartmentSearch('');
    setInvoices([]);
    setNextCursor(null);
  };

  const handleInvoiceClick = (invoice: IInvoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedInvoice(null);
  };

  const handlePaymentModalOpen = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePaymentModalClose = () => {
    setIsPaymentModalOpen(false);
  };

  const handlePaymentSuccess = () => {
    // Reload from start
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Finanzas</h1>
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
              onClick={handlePaymentModalOpen}
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
          selectedStatus={selectedStatus}
          onStatusChange={handleFilterStatusChange}
          apartmentSearch={apartmentSearch}
          onSearchChange={handleApartmentSearchChange}
          onClearSearch={handleClearSearch}
          statusOptions={STATUS_OPTIONS}
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
              {apartmentSearch
                ? 'Intenta con otro número de apartamento'
                : selectedStatus === 'ALL'
                  ? 'No hay facturas registradas'
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
        onClose={handlePaymentModalClose}
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
