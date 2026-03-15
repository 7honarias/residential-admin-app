"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { X, Loader } from "lucide-react";
import {
  getCoefficientPricingList,
  type CoefficientPricing,
} from "@/services/settings.service";

interface SelectCoefficientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (coefficient: CoefficientPricing) => Promise<void>;
  token: string;
  complexId: string;
  isProcessing: boolean;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
});

export default function SelectCoefficientModal({
  isOpen,
  onClose,
  onSelect,
  token,
  complexId,
  isProcessing,
}: SelectCoefficientModalProps) {
  const [coefficients, setCoefficients] = useState<CoefficientPricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load coefficients when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadCoefficients = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCoefficientPricingList({ token, complexId });
        setCoefficients(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error cargando los coeficientes";
        setError(errorMessage);
        console.error("Failed to load coefficients:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCoefficients();
  }, [isOpen, token, complexId]);

  const handleSelect = useCallback(
    async (coefficient: CoefficientPricing) => {
      setSelecting(true);
      setSelectedId(coefficient.id);

      try {
        await onSelect(coefficient);
        onClose();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error al asignar el coeficiente";
        setError(errorMessage);
      } finally {
        setSelecting(false);
        setSelectedId(null);
      }
    },
    [onSelect, onClose]
  );

  const isDisabled = useMemo(
    () => selecting || isProcessing || loading,
    [selecting, isProcessing, loading]
  );

  const closeButtonDisabled = useMemo(
    () => selecting || isProcessing,
    [selecting, isProcessing]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 id="modal-title" className="text-xl font-bold text-slate-800">
            Seleccionar Coeficiente de Precio
          </h2>
          <button
            onClick={onClose}
            disabled={closeButtonDisabled}
            aria-label="Cerrar modal"
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader
                className="w-6 h-6 text-blue-600 animate-spin"
                aria-label="Cargando"
              />
            </div>
          ) : coefficients.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="mb-2">No hay coeficientes disponibles</p>
              <p className="text-sm">
                Crea coeficientes en la sección de administración primero
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {coefficients.map((coeff) => (
                <button
                  key={coeff.id}
                  onClick={() => handleSelect(coeff)}
                  disabled={isDisabled}
                  className="w-full p-4 border border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-800">
                        Coeficiente: {coeff.coefficient.toFixed(4)}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        Área: {coeff.meters} m² | Precio:{" "}
                        {CURRENCY_FORMATTER.format(coeff.price)}
                      </p>
                    </div>
                    {selectedId === coeff.id && selecting && (
                      <Loader className="w-4 h-4 text-indigo-600 animate-spin" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
