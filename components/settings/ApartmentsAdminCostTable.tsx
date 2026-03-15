"use client";

import { Loader } from "lucide-react";

// Interface inline para evitar problemas de import
export interface ApartmentWithAdminCost {
  id: string;
  number: string;
  block_name: string;
  coefficient: number;
  administration_cost: number;
  owner_name?: string;
  owner_email?: string;
}

export interface ApartmentsAdminCostTableProps {
  apartments: ApartmentWithAdminCost[];
  administrationValue: number;
  isLoading?: boolean;
}

export default function ApartmentsAdminCostTable({
  apartments,
  administrationValue,
  isLoading = false,
}: ApartmentsAdminCostTableProps) {
  const calculateAdminCost = (coefficient: number) => {
    return administrationValue * coefficient;
  };

  const getTotalAdminCost = () => {
    return apartments.reduce((total, apt) => {
      return total + calculateAdminCost(apt.coefficient);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 text-slate-600 animate-spin" />
        <span className="ml-2 text-slate-600">Cargando apartamentos...</span>
      </div>
    );
  }

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
          <p className="text-sm text-gray-600 mb-1">Coeficiente Total</p>
          <p className="text-2xl font-bold text-blue-600">
            {apartments
              .reduce((sum, apt) => sum + apt.coefficient, 0)
              .toFixed(4)}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600 mb-1">Ingresos de Administración</p>
          <p className="text-2xl font-bold text-green-600">
            ${getTotalAdminCost().toLocaleString("es-CO", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Apartamento
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Torre/Bloque
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Propietario
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Coeficiente
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Costo Administración
              </th>
            </tr>
          </thead>
          <tbody>
            {apartments.map((apartment) => {
              const adminCost = calculateAdminCost(
                apartment.coefficient
              );
              return (
                <tr
                  key={apartment.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Apt. {apartment.number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {apartment.block_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {apartment.owner_name || "Sin propietario"}
                    {apartment.owner_email && (
                      <div className="text-xs text-gray-500">
                        {apartment.owner_email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700">
                    <span className="font-medium">
                      {apartment.coefficient.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <span className="font-semibold text-green-600">
                      ${adminCost.toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with Total */}
      <div className="flex justify-end items-center gap-4 px-6 py-4 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-gray-700 font-semibold">Total:</span>
        <span className="text-2xl font-bold text-green-600">
          ${getTotalAdminCost().toLocaleString("es-CO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
}
