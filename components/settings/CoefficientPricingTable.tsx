"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader, Plus, X, AlertCircle } from "lucide-react";
import { createCoefficientPricing, getCoefficientPricingList, updateSingleCoefficientPricing, type CoefficientPricing } from "@/services/settings.service";

export interface CoefficientPricingTableProps {
  token: string | null;
  complexId: string;
  onCoefficientAdded: () => void;
}

export default function CoefficientPricingTable({
  token,
  complexId,
  onCoefficientAdded,
}: CoefficientPricingTableProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCoefficient, setEditingCoefficient] = useState<CoefficientPricing | null>(null);
  const [newCoefficient, setNewCoefficient] = useState("");
  const [newMeters, setNewMeters] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [addingCoefficient, setAddingCoefficient] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [coefficients, setCoefficients] = useState<CoefficientPricing[]>([]);
  const [loadingCoefficients, setLoadingCoefficients] = useState(false);


  const handleAddCoefficient = async () => {
    if (!newCoefficient.trim() || !newPrice.trim()) {
      setAddError("Por favor completa los campos obligatorios");
      return;
    }

    if (!token) {
      setAddError("Token de autenticación no disponible");
      return;
    }

    setAddingCoefficient(true);
    setAddError(null);

    try {
      const coefficient = parseFloat(newCoefficient);
      const price = parseFloat(newPrice);
      const meters = newMeters ? parseFloat(newMeters) : undefined;

      if (isNaN(coefficient) || isNaN(price)) {
        throw new Error("Los valores numéricos no son válidos");
      }

      // Si estamos editando, usar updateSingleCoefficientPricing
      if (editingCoefficient) {
        await updateSingleCoefficientPricing({
          token,
          complexId,
          pricingId: editingCoefficient.id,
          coefficient,
          meters,
          price,
        });
        
        setShowEditModal(false);
        setEditingCoefficient(null);
      } else {
        // Si no, crear uno nuevo
        await createCoefficientPricing({
          token,
          complexId,
          coefficient,
          meters,
          price,
        });

        setShowAddModal(false);
      }

      setNewCoefficient("");
      setNewMeters("");
      setNewPrice("");
      
      // Reload coefficients list
      await loadCoefficients();
      
      // Call parent callback
      onCoefficientAdded();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : editingCoefficient ? "Error al actualizar el coeficiente" : "Error al crear el coeficiente";
      setAddError(errorMessage);
    } finally {
      setAddingCoefficient(false);
    }
  };

  // Load coefficient pricing list from service
  const loadCoefficients = useCallback(async () => {
    if (!token || !complexId) return;

    setLoadingCoefficients(true);
    try {
      const data = await getCoefficientPricingList({
        token,
        complexId,
      });
      setCoefficients(data);
    } catch (error) {
      console.error("Error loading coefficients:", error);
    } finally {
      setLoadingCoefficients(false);
    }
  }, [token, complexId]);

  useEffect(() => {
    loadCoefficients();
  }, [loadCoefficients]);

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Precios por Coeficiente</h2>
        <button
          onClick={() => {
            setNewCoefficient("");
            setNewMeters("");
            setNewPrice("");
            setAddError(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Agregar Coeficiente
        </button>
      </div>

      {/* Coefficients Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Coeficiente
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Metros de Referencia
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Precio Administración
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {coefficients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  {loadingCoefficients ? "Cargando coeficientes..." : "No hay coeficientes configurados aún"}
                </td>
              </tr>
            ) : (
              coefficients.map((row) => (
                <tr key={row.coefficient} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {row.coefficient.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700">
                    {row.meters > 0 ? `${row.meters}m²` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                    ${row.price.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setEditingCoefficient(row);
                        setNewCoefficient(row.coefficient.toString());
                        setNewMeters(row.meters.toString());
                        setNewPrice(row.price.toString());
                        setAddError(null);
                        setShowEditModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      

      {/* Add Coefficient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Agregar Nuevo Coeficiente</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCoefficient("");
                  setNewMeters("");
                  setNewPrice("");
                  setAddError(null);
                }}
                disabled={addingCoefficient}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{addError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="add-coefficient" className="block text-sm font-medium text-gray-700 mb-1">
                  Coeficiente *
                </label>
                <input
                  id="add-coefficient"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Ej: 1.5000"
                  value={newCoefficient}
                  onChange={(e) => setNewCoefficient(e.target.value)}
                  disabled={addingCoefficient}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Valor único del coeficiente</p>
              </div>

              <div>
                <label htmlFor="add-meters" className="block text-sm font-medium text-gray-700 mb-1">
                  Metros de Referencia (Opcional)
                </label>
                <input
                  id="add-meters"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 150.50"
                  value={newMeters}
                  onChange={(e) => setNewMeters(e.target.value)}
                  disabled={addingCoefficient}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Área promedio de apartamentos con este coeficiente</p>
              </div>

              <div>
                <label htmlFor="add-price" className="block text-sm font-medium text-gray-700 mb-1">
                  Precio de Administración *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500 font-medium">$</span>
                  <input
                    id="add-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 250000"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    disabled={addingCoefficient}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Precio mensual de administración</p>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCoefficient("");
                  setNewMeters("");
                  setNewPrice("");
                  setAddError(null);
                }}
                disabled={addingCoefficient}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCoefficient}
                disabled={addingCoefficient}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {addingCoefficient ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  "Agregar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Coefficient Modal */}
      {showEditModal && editingCoefficient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Editar Coeficiente {editingCoefficient.coefficient.toFixed(4)}</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCoefficient(null);
                  setNewCoefficient("");
                  setNewMeters("");
                  setNewPrice("");
                  setAddError(null);
                }}
                disabled={addingCoefficient}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{addError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-coefficient" className="block text-sm font-medium text-gray-700 mb-1">
                  Coeficiente *
                </label>
                <input
                  id="edit-coefficient"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={newCoefficient}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">El coeficiente no puede ser editado</p>
              </div>

              <div>
                <label htmlFor="edit-meters" className="block text-sm font-medium text-gray-700 mb-1">
                  Metros de Referencia (Opcional)
                </label>
                <input
                  id="edit-meters"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newMeters}
                  onChange={(e) => setNewMeters(e.target.value)}
                  disabled={addingCoefficient}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Área promedio de apartamentos con este coeficiente</p>
              </div>

              <div>
                <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-1">
                  Precio de Administración *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500 font-medium">$</span>
                  <input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    disabled={addingCoefficient}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Precio mensual de administración</p>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCoefficient(null);
                  setNewCoefficient("");
                  setNewMeters("");
                  setNewPrice("");
                  setAddError(null);
                }}
                disabled={addingCoefficient}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCoefficient}
                disabled={addingCoefficient}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {addingCoefficient ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
