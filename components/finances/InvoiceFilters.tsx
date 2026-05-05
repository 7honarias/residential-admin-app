'use client';

import { InvoiceStatus } from '@/app/dashboard/finances/invoices.types';
import { Search, X } from 'lucide-react';

type FilterStatus = InvoiceStatus | 'ALL';

interface Props {
  // Status tabs
  selectedStatus: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
  statusOptions: { label: string; value: FilterStatus }[];

  // Search fields
  blockSearch: string;
  apartmentSearch: string;
  onBlockSearchChange: (value: string) => void;
  onApartmentSearchChange: (value: string) => void;
  onClearBlockSearch: () => void;
  onClearApartmentSearch: () => void;

  // Date filters (independent of each other)
  periodMonth: string;         // "YYYY-MM" — filtra por period_month / period_year
  startDate: string;           // "YYYY-MM-DD" — filtra por due_date >=
  endDate: string;             // "YYYY-MM-DD" — filtra por due_date <=
  onPeriodMonthChange: (month: string) => void;
  onDateRangeChange: (start: string, end: string) => void;

  // Actions
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onDownloadExcel: () => void;
  isExporting?: boolean;
}

export default function InvoiceFilters({
  selectedStatus,
  onStatusChange,
  statusOptions,
  blockSearch,
  apartmentSearch,
  onBlockSearchChange,
  onApartmentSearchChange,
  onClearBlockSearch,
  onClearApartmentSearch,
  periodMonth,
  startDate,
  endDate,
  onPeriodMonthChange,
  onDateRangeChange,
  onApplyFilters,
  onClearFilters,
  onDownloadExcel,
  isExporting = false,
}: Props) {
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

      {/* Filters Grid — 5 columns on large screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Torre / Bloque */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Torre / Bloque
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Ej: A, B, Torre 1..."
              value={blockSearch}
              onChange={(e) => onBlockSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white bg-slate-50 transition"
            />
            {blockSearch && (
              <button
                onClick={onClearBlockSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Apartamento */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Apartamento
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Ej: 101, 202..."
              value={apartmentSearch}
              onChange={(e) => onApartmentSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white bg-slate-50 transition"
            />
            {apartmentSearch && (
              <button
                onClick={onClearApartmentSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Se combina con Torre
          </p>
        </div>

        {/* Mes de factura — filtra por period_month/year */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Mes de factura
          </label>
          <input
            type="month"
            value={periodMonth}
            onChange={(e) => onPeriodMonthChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-400">
            Mes en que se generó
          </p>
        </div>

        {/* Vence desde — filtra por due_date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Vence desde
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateRangeChange(e.target.value, endDate)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Vence hasta — filtra por due_date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Vence hasta
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
