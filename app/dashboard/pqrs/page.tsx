"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { fetchPqrs } from "@/services/pqrs.service";
import { IPqrsTicket, PqrsStatus } from "./pqrs.types";
import PqrsDetailModal from "@/components/pqrs/PqrsDetailModal";
import PqrsCard from "@/components/pqrs/PqrsCard";
import { Loader2, AlertCircle } from "lucide-react";

type FilterStatus = "ALL" | PqrsStatus;

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Pendientes", value: "PENDING" },
  { label: "En Progreso", value: "IN_PROGRESS" },
  { label: "Resueltos", value: "RESOLVED" },
];

export default function PqrsPage() {
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const token = useAppSelector((state) => state.auth.token);

  const [tickets, setTickets] = useState<IPqrsTicket[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("ALL");
  const [selectedTicket, setSelectedTicket] = useState<IPqrsTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const complexId = activeComplex?.id;

  // Load PQRS when component mounts or filter changes
  const loadPqrs = useCallback(
    async (cursor: string | null = null) => {
      if (!complexId || !token) {
        setError("No active complex or authentication token");
        return;
      }

      const loaderSetter = cursor ? setIsLoadingMore : setIsLoading;
      loaderSetter(true);
      setError(null);

      try {
        const response = await fetchPqrs({
          token,
          complexId,
          options: {
            status: selectedStatus === "ALL" ? undefined : selectedStatus,
            limit: 20,
            cursor: cursor || undefined,
            order: "desc",
          },
        });

        if (cursor) {
          // Append to existing tickets for "load more"
          setTickets((prev) => [...prev, ...response.pqrs]);
        } else {
          // Replace for new filter
          setTickets(response.pqrs);
        }

        setNextCursor(response.nextCursor);
        setHasMore(!!response.nextCursor);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error cargando PQRS"
        );
      } finally {
        loaderSetter(false);
      }
    },
    [complexId, token, selectedStatus]
  );

  // Initial load
  useEffect(() => {
    if (complexId && token) {
      loadPqrs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complexId, token, selectedStatus]);

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      loadPqrs(nextCursor);
    }
  };

  const handleCardClick = (ticket: IPqrsTicket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  const handleModalSuccess = () => {
    // Reload from the start when status changes
    loadPqrs();
  };

  if (!complexId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
        <p className="text-lg font-semibold text-slate-700">
          No active complex selected
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            PQRS
          </h1>
          <p className="text-slate-600 text-sm">
            Peticiones, Quejas, Reclamos y Sugerencias - Gestiona las solicitudes de la comunidad de manera ordenada y auditable
          </p>
        </div>

        {/* Tabs/Filters */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedStatus === option.value
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}

        {/* Tickets Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 gap-4">
            {tickets.length > 0 ? (
              <>
                {tickets.map((ticket) => (
                  <PqrsCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => handleCardClick(ticket)}
                  />
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-6 py-3 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoadingMore && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {isLoadingMore ? "Cargando..." : "Cargar más"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 text-lg">
                  No hay PQRS que mostrar
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <PqrsDetailModal
        isOpen={isModalOpen}
        ticket={selectedTicket}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        complexId={complexId}
        token={token || ""}
      />
    </div>
  );
}
