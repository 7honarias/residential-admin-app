"use client";

import { useForm } from "react-hook-form";
import { Save, Loader } from "lucide-react";

export interface AdministrationConfigFormProps {
  initialValue: number;
  onSave: (value: number) => Promise<void>;
  isSaving: boolean;
}

interface FormData {
  administrationValue: number;
}

export default function AdministrationConfigForm({
  initialValue,
  onSave,
  isSaving,
}: AdministrationConfigFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      administrationValue: initialValue,
    },
    mode: "onChange",
  });

  // Watch for value changes - React Compiler warning is expected for React Hook Form's watch()
  const administrationValue = watch("administrationValue");

  const onSubmit = async (data: FormData) => {
    await onSave(data.administrationValue);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="administrationValue" className="block text-sm font-medium text-gray-700 mb-2">
          Valor de Administración por Coeficiente
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-gray-500 font-medium">$</span>
          <input
            id="administrationValue"
            type="number"
            step="0.01"
            min="0"
            {...register("administrationValue", {
              required: "Este campo es requerido",
              min: {
                value: 0,
                message: "El valor debe ser positivo",
              },
            })}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
        {errors.administrationValue && (
          <p className="mt-1 text-sm text-red-600">
            {errors.administrationValue.message}
          </p>
        )}
      </div>

      {/* Preview Calculation */}
      {administrationValue > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Ejemplo de cálculo:</span>
          </p>
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p>• Apartamento con coeficiente 0.05: ${(administrationValue * 0.05).toLocaleString("es-CO", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</p>
            <p>• Apartamento con coeficiente 0.08: ${(administrationValue * 0.08).toLocaleString("es-CO", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</p>
            <p>• Apartamento con coeficiente 0.10: ${(administrationValue * 0.10).toLocaleString("es-CO", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Guardar Configuración
          </>
        )}
      </button>
    </form>
  );
}
