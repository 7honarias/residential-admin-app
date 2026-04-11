'use client';

import { PaymentMethod } from '@/app/dashboard/finances/invoices.types';

interface PaymentsFiltersProps {
  paymentMethod: PaymentMethod | null;
  apartmentSearch: string;
  periodMonth: string;
  startDate: string;
  endDate: string;
  onPaymentMethodChange: (method: PaymentMethod | null) => void;
  onApartmentSearchChange: (search: string) => void;
  onPeriodMonthChange: (month: string) => void;
  onDateRangeChange: (start: string, end: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onDownloadExcel: () => void;
  isExporting?: boolean;
}

export default function PaymentsFilters({
  paymentMethod,
  apartmentSearch,
  periodMonth,
  startDate,
  endDate,
  onPaymentMethodChange,
  onApartmentSearchChange,
  onPeriodMonthChange,
  onDateRangeChange,
  onApplyFilters,
  onClearFilters,
  onDownloadExcel,
  isExporting = false,
}: PaymentsFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Payment Method Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Método de Pago
          </label>
          <select
            value={paymentMethod || ''}
            onChange={(e) =>
              onPaymentMethodChange((e.target.value as PaymentMethod) || null)
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="CASH">Efectivo</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="DEPOSIT">Consignación</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>

        {/* Apartment Search */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Apartamento
          </label>
          <input
            type="text"
            placeholder="Busca por número"
            value={apartmentSearch}
            onChange={(e) => onApartmentSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Month Period */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Mes
          </label>
          <input
            type="month"
            value={periodMonth}
            onChange={(e) => onPeriodMonthChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Desde
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateRangeChange(e.target.value, endDate)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Hasta
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onDateRangeChange(startDate, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onDownloadExcel}
          disabled={isExporting}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'Generando Excel...' : 'Descargar Excel'}
        </button>
        <button
          onClick={onClearFilters}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
        >
          Limpiar
        </button>
        <button
          onClick={onApplyFilters}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
}
