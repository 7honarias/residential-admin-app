'use client';

import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useAppSelector } from '@/store/hooks';
import { fetchAllPaymentsForExport, fetchPaymentList } from '@/services/invoices.service';
import { IPaymentDetail, PaymentMethod } from '../invoices.types';
import PaymentsTable from '@/components/finances/PaymentsTable';
import PaymentsFilters from '@/components/finances/PaymentsFilters';
import PaymentsTableSkeleton from '@/components/finances/PaymentsTableSkeleton';
import { AlertCircle } from 'lucide-react';

const MONTH_NAMES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthDateRange = (monthValue: string) => {
  const [year, month] = monthValue.split('-').map(Number);
  if (!year || !month) {
    return { startDate: '', endDate: '' };
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end),
  };
};

const getExportFileName = (startDate: string, endDate: string) => {
  if (startDate && endDate) {
    const sameMonth = startDate.slice(0, 7) === endDate.slice(0, 7);
    if (sameMonth) {
      const [year, month] = startDate.slice(0, 7).split('-').map(Number);
      return `facturas_pagadas_${MONTH_NAMES_ES[month - 1]}_${year}.xlsx`;
    }
    return `facturas_pagadas_${startDate}_a_${endDate}.xlsx`;
  }

  return 'facturas_pagadas_todo_el_periodo.xlsx';
};

const parseExportLimitInput = (input: string | null) => {
  if (input === null) {
    return null;
  }

  const normalized = input.trim().toLowerCase();

  if (!normalized || normalized === 'todo') {
    return undefined;
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Ingresa un límite válido mayor a 0 o escribe "todo"');
  }

  return parsed;
};

export default function PaymentsPage() {
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const token = useAppSelector((state) => state.auth.token);

  const [payments, setPayments] = useState<IPaymentDetail[]>([]);
  
  // Active filters (used for fetching)
  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentMethod | null>(null);
  const [activeApartmentSearch, setActiveApartmentSearch] = useState('');
  const [activePeriodMonth, setActivePeriodMonth] = useState('');
  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');
  
  // Temporary filters (for filter UI before applying)
  const [tempPaymentMethod, setTempPaymentMethod] = useState<PaymentMethod | null>(null);
  const [tempApartmentSearch, setTempApartmentSearch] = useState('');
  const [tempPeriodMonth, setTempPeriodMonth] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const handlePeriodMonthChange = (month: string) => {
    setTempPeriodMonth(month);
    if (!month) {
      return;
    }

    const { startDate, endDate } = getMonthDateRange(month);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    if (tempPeriodMonth) {
      setTempPeriodMonth('');
    }
    setTempStartDate(start);
    setTempEndDate(end);
  };

  // Apply filters: copy temp values to active filters
  const handleApplyFilters = () => {
    setActivePaymentMethod(tempPaymentMethod);
    setActiveApartmentSearch(tempApartmentSearch);
    setActivePeriodMonth(tempPeriodMonth);
    setActiveStartDate(tempStartDate);
    setActiveEndDate(tempEndDate);
    setPayments([]);
    setNextCursor(null);
  };

  const handleClearFilters = () => {
    setTempPaymentMethod(null);
    setTempApartmentSearch('');
    setTempPeriodMonth('');
    setTempStartDate('');
    setTempEndDate('');
    setActivePaymentMethod(null);
    setActiveApartmentSearch('');
    setActivePeriodMonth('');
    setActiveStartDate('');
    setActiveEndDate('');
    setPayments([]);
    setNextCursor(null);
  };

  const handleDownloadExcel = async () => {
    if (!complexId || !token) {
      setError('No active complex or authentication token');
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
        : {
            startDate: selectedStartDate,
            endDate: selectedEndDate,
          };

      const baseExportFilters = {
        paymentMethod: tempPaymentMethod || activePaymentMethod || undefined,
        apartmentSearch: tempApartmentSearch || activeApartmentSearch || undefined,
        startDate: normalizedRange.startDate || undefined,
        endDate: normalizedRange.endDate || undefined,
        order: 'desc' as const,
      };

      const preview = await fetchPaymentList({
        token,
        complexId,
        options: {
          ...baseExportFilters,
          limit: 1,
        },
      });

      const totalMatchingPayments = preview.totalCount ?? 0;

      if (totalMatchingPayments === 0) {
        setError('No hay pagos para exportar en el periodo seleccionado');
        return;
      }

      const periodLabel = normalizedRange.startDate && normalizedRange.endDate
        ? `${normalizedRange.startDate} a ${normalizedRange.endDate}`
        : 'todo el periodo disponible';

      const shouldContinue = window.confirm(
        `Se encontraron ${totalMatchingPayments} pagos con los filtros actuales.\n\n` +
        `Periodo: ${periodLabel}\n` +
        `Apartamento: ${baseExportFilters.apartmentSearch || 'Todos'}\n` +
        `Método: ${baseExportFilters.paymentMethod || 'Todos'}\n\n` +
        '¿Deseas continuar con la descarga del Excel?'
      );

      if (!shouldContinue) {
        return;
      }

      const limitInput = window.prompt(
        `¿Cuántos registros deseas exportar?\n` +
        `- Escribe un número (ejemplo: 500)\n` +
        `- Escribe "todo" para exportar todos\n` +
        `Total encontrado: ${totalMatchingPayments}`,
        totalMatchingPayments > 1000 ? '1000' : String(totalMatchingPayments)
      );

      const requestedLimit = parseExportLimitInput(limitInput);

      if (requestedLimit === null) {
        return;
      }

      const safeLimit = requestedLimit
        ? Math.min(requestedLimit, totalMatchingPayments)
        : undefined;

      const paymentsForExport = await fetchAllPaymentsForExport({
        token,
        complexId,
        options: {
          ...baseExportFilters,
          maxRecords: safeLimit,
        },
      });

      const approvedPayments = paymentsForExport.filter(
        (payment) => payment.status?.toUpperCase() === 'APPROVED'
      );

      if (approvedPayments.length === 0) {
        setError('No hay facturas pagadas para exportar en el periodo seleccionado');
        return;
      }

      const rows = approvedPayments.map((payment: IPaymentDetail) => ({
        Bloque: payment.block_name,
        Apartamento: payment.apartment_number,
        'Monto pagado (COP)': payment.total_amount,
        'Método de pago': payment.payment_method,
        Estado: payment.status,
        'Fecha de pago': new Date(payment.created_at).toLocaleString('es-CO'),
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagos');

      XLSX.writeFile(
        workbook,
        getExportFileName(normalizedRange.startDate, normalizedRange.endDate)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error generando archivo Excel'
      );
    } finally {
      setIsExporting(false);
    }
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
        periodMonth={tempPeriodMonth}
        startDate={tempStartDate}
        endDate={tempEndDate}
        onPaymentMethodChange={handlePaymentMethodChange}
        onApartmentSearchChange={handleApartmentSearchChange}
        onPeriodMonthChange={handlePeriodMonthChange}
        onDateRangeChange={handleDateRangeChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onDownloadExcel={handleDownloadExcel}
        isExporting={isExporting}
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
