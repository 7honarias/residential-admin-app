"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { AlertCircle, Save, Loader, Settings, CreditCard, DollarSign } from "lucide-react";
import CoefficientPricingTable from "@/components/settings/CoefficientPricingTable";
import PlaceToPayConfigForm from "@/components/settings/PlaceToPayConfigForm";
import FinancialSettingsForm from "@/components/settings/FinancialSettingsForm"; // <-- NUEVO COMPONENTE
import {
  fetchPlaceToPayConfig,
  updatePlaceToPayConfig,
  PlaceToPayConfig,
  fetchFinancialSettings,     // <-- NUEVAS FUNCIONES EN TU SERVICIO
  updateFinancialSettings,    // <-- NUEVAS FUNCIONES EN TU SERVICIO
  FinancialSettings,          // <-- NUEVA INTERFAZ EN TU SERVICIO
} from "@/services/settings.service";

// 1. Agregamos el nuevo Tab "finances"
type ActiveTab = "administration" | "placetopay" | "finances";

export default function SettingsPage() {
  const { activeComplex } = useAppSelector((state) => state.complex);
  const { token } = useAppSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>("administration");
  const [placeToPayConfig, setPlaceToPayConfig] = useState<PlaceToPayConfig | null>(null);
  
  // 2. Estado para la nueva configuración financiera
  const [financialSettings, setFinancialSettings] = useState<FinancialSettings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadConfiguration = useCallback(async () => {
    if (!activeComplex?.id || !token) return;

    try {
      setLoading(true);
      setError(null);

      if (activeTab === "placetopay") {
        const config = await fetchPlaceToPayConfig({
          token,
          complexId: activeComplex.id,
        });
        setPlaceToPayConfig(config);
      } else if (activeTab === "finances") {
        // Cargar la configuración financiera
        const config = await fetchFinancialSettings({
          token,
          complexId: activeComplex.id,
        });
        setFinancialSettings(config);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error loading configuration"
      );
    } finally {
      setLoading(false);
    }
  }, [activeComplex?.id, token, activeTab]);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  const handleSavePlaceToPayConfig = async (config: {
    merchantId: string;
    publicKey: string;
    privateKey: string;
  }) => {
    if (!activeComplex?.id || !token) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updatedConfig = await updatePlaceToPayConfig({
        token,
        complexId: activeComplex.id,
        merchantId: config.merchantId,
        publicKey: config.publicKey,
        privateKey: config.privateKey,
      });

      if (updatedConfig) {
        setPlaceToPayConfig(updatedConfig);
        setSuccess("Credenciales de PlaceToPay guardadas correctamente");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving PlaceToPay configuration");
    } finally {
      setSaving(false);
    }
  };

  // 3. Función para guardar la configuración financiera
  const handleSaveFinancialSettings = async (config: {
    interestType: "PERCENTAGE" | "FIXED_AMOUNT";
    interestRate: number;
    gracePeriodDays: number;
  }) => {
    if (!activeComplex?.id || !token) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updatedConfig = await updateFinancialSettings({
        token,
        complexId: activeComplex.id,
        interestType: config.interestType,
        interestRate: config.interestRate,
        gracePeriodDays: config.gracePeriodDays,
      });

      if (updatedConfig) {
        setFinancialSettings(updatedConfig);
        setSuccess("Configuración financiera guardada correctamente");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando configuración financiera");
    } finally {
      setSaving(false);
    }
  };

  if (!activeComplex) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="w-5 h-5" />
          <p>Por favor selecciona un conjunto residencial</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Gestiona los parámetros para{" "}
          <span className="font-semibold">{activeComplex.name}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="flex flex-wrap border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab("administration");
              setError(null);
              setSuccess(null);
            }}
            className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
              activeTab === "administration"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Settings className="w-5 h-5" />
            Administración
          </button>
          
          {/* NUEVO TAB: FINANZAS E INTERESES */}
          <button
            onClick={() => {
              setActiveTab("finances");
              setError(null);
              setSuccess(null);
            }}
            className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
              activeTab === "finances"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Políticas de Mora
          </button>

          <button
            onClick={() => {
              setActiveTab("placetopay");
              setError(null);
              setSuccess(null);
            }}
            className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
              activeTab === "placetopay"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            PlaceToPay
          </button>
        </div>

        {/* Alertas */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border-t border-green-200">
            <div className="flex items-center gap-2 text-green-800">
              <Save className="w-5 h-5" />
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Contenido de los Tabs */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-slate-600 animate-spin" />
              <span className="ml-2 text-slate-600">Cargando configuración...</span>
            </div>
          ) : (
            <>
              {activeTab === "administration" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Tabla de Precios por Coeficiente
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Define el precio de administración para cada coeficiente.
                      </p>
                    </div>
                    <div className="p-6">
                      <CoefficientPricingTable
                        token={token}
                        complexId={activeComplex.id}
                        onCoefficientAdded={loadConfiguration}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENIDO DEL NUEVO TAB FINANZAS */}
              {activeTab === "finances" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Políticas de Intereses y Mora
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Configura cómo y cuándo se cobrarán los intereses a los residentes con facturas vencidas.
                      </p>
                    </div>
                    <div className="p-6">
                      <FinancialSettingsForm
                        initialConfig={financialSettings || undefined}
                        onSave={handleSaveFinancialSettings}
                        isSaving={saving}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "placetopay" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Credenciales de PlaceToPay
                      </h2>
                    </div>
                    <div className="p-6">
                      <PlaceToPayConfigForm
                        initialConfig={placeToPayConfig || undefined}
                        onSave={handleSavePlaceToPayConfig}
                        isSaving={saving}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
