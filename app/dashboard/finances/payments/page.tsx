'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { fetchPaymentList } from '@/services/invoices.service';
import { IPaymentDetail, PaymentMethod } from '../invoices.types';
import PaymentsTable from '@/components/finances/PaymentsTable';
import PaymentsFilters from '@/components/finances/PaymentsFilters';
import PaymentsTableSkeleton from '@/components/finances/PaymentsTableSkeleton';
import { AlertCircle } from 'lucide-react';

export default function PaymentsPage() {
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const token = useAppSelector((state) => state.auth.token);

  const [payments, setPayments] = useState<IPaymentDetail[]>([]);
  
  // Active filters (used for fetching)
  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentMethod | null>(null);
  const [activeApartmentSearch, setActiveApartmentSearch] = useState('');
  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');
  
  // Temporary filters (for filter UI before applying)
  const [tempPaymentMethod, setTempPaymentMethod] = useState<PaymentMethod | null>(null);
  const [tempApartmentSearch, setTempApartmentSearch] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const complexId = activeComplex?.id;

  // Load payments with pagination
  const loadPayments = useCallback(
    async (cursor: string | null = null) => {
      if (!complexId || !token) {
        setError('No active complex or authentication token');
        return;
      }

      const loaderSetter = cursor ? setIsLoadingMore : setIsLoading;
      loaderSetter(true);
      setError(null);

      try {
        const result = await fetchPaymentList({
          token,
          complexId,
          options: {
            paymentMethod: activePaymentMethod || undefined,
            apartmentSearch: activeApartmentSearch || undefined,
            startDate: activeStartDate || undefined,
            endDate: activeEndDate || undefined,
            limit: 20,
            cursor,
            order: 'desc',
          },
        });

        if (cursor) {
          // Append to existing payments
          setPayments((prev) => [...prev, ...result.payments]);
        } else {
          // Replace payments on new search
          setPayments(result.payments);
        }

        setNextCursor(result.nextCursor);
        setHasMore(!!result.nextCursor);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error cargando pagos'
        );
      } finally {
        loaderSetter(false);
      }
    },
    [complexId, token, activePaymentMethod, activeApartmentSearch, activeStartDate, activeEndDate]
  );

  // Load whenever active filters change
  useEffect(() => {
    if (complexId && token) {
      loadPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complexId, token, activePaymentMethod, activeApartmentSearch, activeStartDate, activeEndDate]);

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      loadPayments(nextCursor);
    }
  };

  // Update temporary filter values
  const handlePaymentMethodChange = (method: PaymentMethod | null) => {
    setTempPaymentMethod(method);
  };

  const handleApartmentSearchChange = (search: string) => {
    setTempApartmentSearch(search);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setTempStartDate(start);
    setTempEndDate(end);
  };

  // Apply filters: copy temp values to active filters
  const handleApplyFilters = () => {
    setActivePaymentMethod(tempPaymentMethod);
    setActiveApartmentSearch(tempApartmentSearch);
    setActiveStartDate(tempStartDate);
    setActiveEndDate(tempEndDate);
    setPayments([]);
    setNextCursor(null);
  };

  const handleClearFilters = () => {
    setTempPaymentMethod(null);
    setTempApartmentSearch('');
    setTempStartDate('');
    setTempEndDate('');
    setActivePaymentMethod(null);
    setActiveApartmentSearch('');
    setActiveStartDate('');
    setActiveEndDate('');
    setPayments([]);
    setNextCursor(null);
  };

  if (!complexId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-3 text-slate-600">
          <AlertCircle className="w-5 h-5" />
          <span>No hay complejo seleccionado</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Historial de Pagos</h1>
        <p className="text-slate-600 mt-1">
          Visualiza todos los pagos registrados en el complejo
        </p>
      </div>

      {/* Filters */}
      <PaymentsFilters
        paymentMethod={tempPaymentMethod}
        apartmentSearch={tempApartmentSearch}
        startDate={tempStartDate}
        endDate={tempEndDate}
        onPaymentMethodChange={handlePaymentMethodChange}
        onApartmentSearchChange={handleApartmentSearchChange}
        onDateRangeChange={handleDateRangeChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error al cargar pagos</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <PaymentsTableSkeleton />
      ) : payments.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-600">No hay pagos para mostrar</p>
        </div>
      ) : (
        <>
          {/* Payments Table */}
          <PaymentsTable payments={payments} />

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoadingMore ? 'Cargando...' : 'Cargar más'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
