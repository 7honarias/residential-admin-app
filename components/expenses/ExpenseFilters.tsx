'use client';

import { Search, X } from 'lucide-react';
import { ExpenseStatus } from '@/app/dashboard/finances/expenses/expenses.types';

type FilterStatus = ExpenseStatus | 'ALL';

interface ExpenseFiltersProps {
  selectedStatus: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
  onClearSearch: () => void;
  statusOptions: { label: string; value: FilterStatus }[];
  searchPlaceholder?: string;
  // Date range filters
  periodMonth: string;
  startDate: string;
  endDate: string;
  onPeriodMonthChange: (month: string) => void;
  onDateRangeChange: (start: string, end: string) => void;
  // Actions
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onDownloadExcel: () => void;
  isExporting?: boolean;
}

export default function ExpenseFilters({
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  onClearSearch,
  statusOptions,
  searchPlaceholder = 'Buscar proveedor...',
  periodMonth,
  startDate,
  endDate,
  onPeriodMonthChange,
  onDateRangeChange,
  onApplyFilters,
  onClearFilters,
  onDownloadExcel,
  isExporting = false,
}: ExpenseFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5 mb-6">
      {/* Title */}
      <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>

      {/* Status Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
              selectedStatus === option.value
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Supplier / Invoice Search */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Proveedor / Factura
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white bg-slate-50 transition"
            />
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
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
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
}