"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Info } from "lucide-react";

// Estas interfaces deberían hacer match con las de tu settings.service.ts
interface FinancialConfig {
  interestType: "PERCENTAGE" | "FIXED_AMOUNT";
  interestRate: number;
  gracePeriodDays: number;
}

interface FinancialSettingsFormProps {
  initialConfig?: FinancialConfig;
  onSave: (config: FinancialConfig) => Promise<void>;
  isSaving: boolean;
}

export default function FinancialSettingsForm({
  initialConfig,
  onSave,
  isSaving,
}: FinancialSettingsFormProps) {
  const [interestType, setInterestType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">(
    initialConfig?.interestType || "PERCENTAGE"
  );
  const [interestRate, setInterestRate] = useState<string>(
    initialConfig?.interestRate?.toString() || "0"
  );
  const [gracePeriodDays, setGracePeriodDays] = useState<string>(
    initialConfig?.gracePeriodDays?.toString() || "0"
  );

  // Actualiza el formulario si la configuración inicial cambia (cuando termina de cargar de la BD)
  useEffect(() => {
    if (initialConfig) {
      setInterestType(initialConfig.interestType);
      setInterestRate(initialConfig.interestRate.toString());
      setGracePeriodDays(initialConfig.gracePeriodDays.toString());
    }
  }, [initialConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      interestType,
      interestRate: parseFloat(interestRate) || 0,
      gracePeriodDays: parseInt(gracePeriodDays) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tipo de Cobro */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tipo de Interés / Mora
          </label>
          <select
            value={interestType}
            onChange={(e) => setInterestType(e.target.value as "PERCENTAGE" | "FIXED_AMOUNT")}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
            disabled={isSaving}
          >
            <option value="PERCENTAGE">Porcentaje Mensual (%)</option>
            <option value="FIXED_AMOUNT">Monto Fijo Mensual ($)</option>
          </select>
        </div>

        {/* Valor de la tasa o monto */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {interestType === "PERCENTAGE" ? "Tasa de Interés (%)" : "Monto a Cobrar ($)"}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">
                {interestType === "PERCENTAGE" ? "%" : "$"}
              </span>
            </div>
            <input
              type="number"
              step={interestType === "PERCENTAGE" ? "0.01" : "1"}
              min="0"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
              placeholder={interestType === "PERCENTAGE" ? "2.5" : "15000"}
              disabled={isSaving}
              required
            />
          </div>
        </div>

        {/* Días de Gracia */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Días de Gracia
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={gracePeriodDays}
            onChange={(e) => setGracePeriodDays(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
            placeholder="Ej: 5"
            disabled={isSaving}
            required
          />
          <div className="flex items-start gap-2 mt-2 text-sm text-gray-500">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>
              Si la factura vence el día 1 y pones 5 días de gracia, el sistema 
              marcará la factura como vencida (y aplicará intereses) recién el día 6.
              Si pones 0, se aplica de inmediato.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Políticas
            </>
          )}
        </button>
      </div>
    </form>
  );
}
    