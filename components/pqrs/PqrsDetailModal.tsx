"use client";

import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { IPqrsTicket, PqrsStatus } from "@/app/dashboard/pqrs/pqrs.types";
import { respondPqrs } from "@/services/pqrs.service";
import { formatDate } from "@/lib/utils"; // We'll create this if it doesn't exist

interface Props {
  isOpen: boolean;
  ticket: IPqrsTicket | null;
  onClose: () => void;
  onSuccess?: () => void;
  complexId: string;
  token: string;
}

const STATUS_OPTIONS: PqrsStatus[] = ["PENDING", "IN_PROGRESS", "RESOLVED"];

const STATUS_LABELS: Record<PqrsStatus, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  RESOLVED: "Resuelto",
  REJECTED: "Rechazado",
};

const TYPE_LABELS: Record<string, string> = {
  PETICION: "Petición",
  QUEJA: "Queja",
  RECLAMO: "Reclamo",
  SUGERENCIA: "Sugerencia",
};

const TYPE_COLORS: Record<string, { bg: string; text: string; ring: string }> =
  {
    RECLAMO: {
      bg: "bg-red-50",
      text: "text-red-700",
      ring: "ring-red-200",
    },
    QUEJA: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-200",
    },
    PETICION: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      ring: "ring-blue-200",
    },
    SUGERENCIA: {
      bg: "bg-teal-50",
      text: "text-teal-700",
      ring: "ring-teal-200",
    },
  };

const STATUS_COLORS: Record<PqrsStatus, { bg: string; text: string }> = {
  PENDING: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
  IN_PROGRESS: {
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  RESOLVED: {
    bg: "bg-green-50",
    text: "text-green-700",
  },
  REJECTED: {
    bg: "bg-gray-50",
    text: "text-gray-700",
  },
};

export default function PqrsDetailModal({
  isOpen,
  ticket,
  onClose,
  onSuccess,
  complexId,
  token,
}: Props) {
  const [newStatus, setNewStatus] = useState<PqrsStatus | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Limpiar estados cuando el modal se abre o cierra
  useEffect(() => {
    if (isOpen && ticket) {
      setNewStatus(null);
      setAdminResponse("");
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, ticket]);

  if (!isOpen || !ticket) return null;

  // La respuesta es obligatoria solo si el estado es RESOLVED
  const isResponseRequired = newStatus === "RESOLVED";
  const hasResponseError = isResponseRequired && adminResponse.trim().length === 0;
  const canSave =
    newStatus &&
    (isResponseRequired ? adminResponse.trim().length > 0 : true) &&
    (newStatus !== ticket.status || adminResponse !== ticket.admin_response);

  const handleSave = async () => {
    if (!newStatus) {
      setError("Por favor selecciona un estado");
      return;
    }
    if (newStatus === "RESOLVED" && !adminResponse.trim()) {
      setError("La respuesta del administrador es obligatoria para resolver");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await respondPqrs({
        token,
        complexId,
        payload: {
          pqrs_id: ticket.id,
          status: newStatus,
          admin_response: adminResponse,
        },
      });

      setSuccessMessage("PQRS actualizado exitosamente");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar el PQRS"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const typeColor = TYPE_COLORS[ticket.type] || TYPE_COLORS.PETICION;
  const statusColor = STATUS_COLORS[ticket.status];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-start z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ring-1 ring-inset ${typeColor.bg} ${typeColor.text} ${typeColor.ring}`}
              >
                {TYPE_LABELS[ticket.type]}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor.bg} ${statusColor.text}`}>
                {STATUS_LABELS[ticket.status]}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {ticket.subject}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Alert Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-900 font-semibold">{successMessage}</p>
            </div>
          )}

          {/* Ticket Info */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-600">Apartamento</p>
              <p className="text-slate-900">{ticket.apartment_info}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">
                Fecha de creación
              </p>
              <p className="text-slate-900">{formatDate(ticket.created_at)}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-2">
              Descripción
            </p>
            <div className="bg-slate-50 rounded-lg p-4 text-slate-900 whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>

          {/* Current Admin Response (if exists) */}
          {ticket.admin_response && (
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">
                Respuesta anterior del administrador
              </p>
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-300 text-slate-900 whitespace-pre-wrap">
                {ticket.admin_response}
              </div>
            </div>
          )}

          {/* Status Change Section */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Cambiar estado
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setNewStatus(status);
                      setError(null);
                    }}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                      newStatus === status
                        ? "ring-2 ring-offset-2 ring-slate-400 bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            {/* Response Field (only show if status changed) */}
            {newStatus && (
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Respuesta del administrador{" "}
                  {isResponseRequired && <span className="text-red-600">*</span>}
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  {isResponseRequired
                    ? "Requerida para resolver el ticket"
                    : "Opcional - Deja un mensaje si lo deseas"}
                </p>
                <textarea
                  value={adminResponse}
                  onChange={(e) => {
                    setAdminResponse(e.target.value);
                    setError(null);
                  }}
                  placeholder="Escriba la respuesta oficial del administrador..."
                  className={`w-full mt-2 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all resize-none ${
                    hasResponseError
                      ? "border-red-300 focus:ring-red-500 bg-red-50"
                      : "border-slate-300 focus:ring-slate-500"
                  }`}
                  rows={4}
                />
                {hasResponseError && (
                  <p className="text-red-600 text-sm font-medium mt-1">
                    La respuesta del administrador es obligatoria
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-slate-200 pt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || isLoading}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
