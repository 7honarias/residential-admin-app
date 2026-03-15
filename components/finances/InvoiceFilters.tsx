'use client';

import { InvoiceStatus } from '@/app/dashboard/finances/invoices.types';
import { Search, X } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

type FilterStatus = InvoiceStatus | 'ALL';

interface Props {
  selectedStatus: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
  apartmentSearch: string;
  onSearchChange: (search: string) => void;
  onClearSearch: () => void;
  statusOptions: { label: string; value: FilterStatus }[];
}

export default function InvoiceFilters({
  selectedStatus,
  onStatusChange,
  apartmentSearch,
  onSearchChange,
  onClearSearch,
  statusOptions,
}: Props) {
  const [debouncedSearch, setDebouncedSearch] = useState(apartmentSearch);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchInputChange = useCallback(
    (value: string) => {
      setDebouncedSearch(value);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer (300ms debounce)
      debounceTimerRef.current = setTimeout(() => {
        onSearchChange(value);
      }, 300);
    },
    [onSearchChange]
  );

  return (
    <div className="mb-6 space-y-4">
      {/* Status Filter Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedStatus === option.value
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Busca por número de apartamento..."
            value={debouncedSearch}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {debouncedSearch && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
