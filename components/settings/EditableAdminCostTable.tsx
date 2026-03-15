"use client";

import { useState, useCallback, useMemo } from "react";
import { Save, Loader, Undo2 } from "lucide-react";

// Interface inline para evitar problemas de import
export interface ApartmentAdminCost {
  apartment_id: string;
  apartment_number: string;
  block_name: string;
  coefficient: number;
  coefficient_pricing_id?: string;
  custom_admin_cost: number;
  meters?: number;
  owner_name?: string;
  owner_email?: string;
}

export interface EditableAdminCostTableProps {
  apartments: ApartmentAdminCost[];
  onSave: (updatedApartments: Array<{ apartment_id: string; custom_admin_cost: number }>) => Promise<void>;
  isSaving: boolean;
}

export default function EditableAdminCostTable({
  apartments,
  onSave,
  isSaving,
}: EditableAdminCostTableProps) {
  // Extract unique coefficients and group apartments by coefficient
  const coefficientGroups = useMemo(() => {
    const groups: Record<number, ApartmentAdminCost[]> = {};
    apartments.forEach((apt) => {
      const coef = apt.coefficient;
      if (!groups[coef]) {
        groups[coef] = [];
      }
      groups[coef].push(apt);
    });
    return Object.keys(groups)
      .map((coef) => ({
        coefficient: parseFloat(coef),
        apartments: groups[parseFloat(coef)],
      }))
      .sort((a, b) => a.coefficient - b.coefficient);
  }, [apartments]);

  // Calculate base value for each coefficient
  const [editedBaseValues, setEditedBaseValues] = useState<Record<string, number>>(
    coefficientGroups.reduce((acc, group) => {
      // Calculate average base value from first apartment's custom cost
      const avgBaseValue = group.apartments[0].custom_admin_cost / group.coefficient || 0;
      acc[group.coefficient.toString()] = avgBaseValue;
      return acc;
    }, {} as Record<string, number>)
  );

  const [hasChanges, setHasChanges] = useState(false);

  const handleBaseValueChange = useCallback((coefficient: number, newValue: number) => {
    setEditedBaseValues((prev) => ({
      ...prev,
      [coefficient.toString()]: Math.max(0, newValue),
    }));
    setHasChanges(true);
  }, []);

  const handleReset = useCallback(() => {
    setEditedBaseValues(
      coefficientGroups.reduce((acc, group) => {
        const avgBaseValue = group.apartments[0].custom_admin_cost / group.coefficient || 0;
        acc[group.coefficient.toString()] = avgBaseValue;
        return acc;
      }, {} as Record<string, number>)
    );
    setHasChanges(false);
  }, [coefficientGroups]);

  const handleSave = async () => {
    // Convert base values back to custom_admin_cost (multiply by coefficient)
    const changedApartments: Array<{ apartment_id: string; custom_admin_cost: number }> = [];

    apartments.forEach((apt) => {
      const baseValue = editedBaseValues[apt.coefficient.toString()] || 0;
      const newCost = baseValue * apt.coefficient;
      
      if (newCost !== apt.custom_admin_cost) {
        changedApartments.push({
          apartment_id: apt.apartment_id,
          custom_admin_cost: newCost,
        });
      }
    });

    if (changedApartments.length > 0) {
      await onSave(changedApartments);
      setHasChanges(false);
    }
  };

  const getTotalAdminCost = () => {
    return apartments.reduce((total, apt) => {
      const baseValue = editedBaseValues[apt.coefficient.toString()] || 0;
      return total + (baseValue * apt.coefficient);
    }, 0);
  };

  if (apartments.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No hay apartamentos en este conjunto</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total de Apartamentos</p>
          <p className="text-2xl font-bold text-gray-900">{apartments.length}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Tipos de Coeficientes</p>
          <p className="text-2xl font-bold text-blue-600">
            {coefficientGroups.length}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600 mb-1">Total de Administración</p>
          <p className="text-2xl font-bold text-green-600">
            ${getTotalAdminCost().toLocaleString("es-CO", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Cómo funciona:</span> Asigna un valor base para cada coeficiente. El costo de cada apartamento se calculará automáticamente multiplicando ese valor por el coeficiente.
        </p>
      </div>

      {/* Coefficient Configuration Cards */}
      <div className="space-y-6">
        {coefficientGroups.map((group) => {
          const baseValue = editedBaseValues[group.coefficient.toString()] || 0;
          const totalForCoefficient = baseValue * group.coefficient * group.apartments.length;

          return (
            <div key={group.coefficient} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Card Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Coeficiente</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {group.coefficient.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Cantidad de Apartamentos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {group.apartments.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Costo por Apartamento</p>
                    <p className="text-lg font-bold text-gray-900">
                      ${(baseValue * group.coefficient).toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Total por Coef.</p>
                    <p className="text-lg font-bold text-green-600">
                      ${totalForCoefficient.toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Section */}
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Base (se multiplicará por {group.coefficient.toFixed(4)})
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-3 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={baseValue}
                    onChange={(e) =>
                      handleBaseValueChange(
                        group.coefficient,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    disabled={isSaving}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
                  />
                </div>

                {/* Apartments in this group */}
                <div className="mt-6">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Apartamentos con este coeficiente
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 text-gray-700 font-medium">Apartamento</th>
                          <th className="text-left py-2 px-3 text-gray-700 font-medium">Torre/Bloque</th>
                          <th className="text-left py-2 px-3 text-gray-700 font-medium">Propietario</th>
                          <th className="text-right py-2 px-3 text-gray-700 font-medium">Costo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.apartments.map((apt) => (
                          <tr key={apt.apartment_id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-3 font-medium text-gray-900">
                              Apt. {apt.apartment_number}
                            </td>
                            <td className="py-3 px-3 text-gray-700">
                              {apt.block_name}
                            </td>
                            <td className="py-3 px-3 text-gray-700">
                              {apt.owner_name || "Sin propietario"}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-gray-900">
                              ${(baseValue * group.coefficient).toLocaleString("es-CO", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with Total */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-gray-700 font-semibold">Total de Administración:</span>
        <span className="text-2xl font-bold text-green-600">
          ${getTotalAdminCost().toLocaleString("es-CO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex gap-4 justify-end pt-4">
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Undo2 className="w-5 h-5" />
            Descartar Cambios
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {isSaving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
