"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { AlertCircle, Save, Loader, Settings, Receipt } from "lucide-react";
import CoefficientPricingTable from "@/components/settings/CoefficientPricingTable";
import FinancialSettingsForm from "@/components/settings/FinancialSettingsForm";
import BillingConfigForm, { BillingConfig as BillingConfigFormData } from "@/components/settings/BillingConfigForm";
import {
  fetchFinancialSettings,
  updateFinancialSettings,
  FinancialSettings,
  fetchBillingConfig,
  updateBillingConfig,
  BillingConfig,
} from "@/services/settings.service";

type ActiveTab = "administration" | "billing";

export default function SettingsPage() {
  const { activeComplex } = useAppSelector((state) => state.complex);
  const { token } = useAppSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>("administration");
  
  const [financialSettings, setFinancialSettings] = useState<FinancialSettings | null>(null);
  const [billingConfig, setBillingConfig] = useState<BillingConfig | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadConfiguration = useCallback(async () => {
    if (!activeComplex?.id || !token) return;

    try {
      setLoading(true);
      setError(null);

      if (activeTab === "billing") {
        const [financialData, billingData] = await Promise.all([
          fetchFinancialSettings({ token, complexId: activeComplex.id }),
          fetchBillingConfig({ token, complexId: activeComplex.id }),
        ]);
        setFinancialSettings(financialData);
        setBillingConfig(billingData);
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


  const handleSaveBillingConfig = async (config: BillingConfigFormData) => {
    if (!activeComplex?.id || !token) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const updated = await updateBillingConfig({
        token,
        complexId: activeComplex.id,
        config,
      });
      if (updated) setBillingConfig(updated);
      setSuccess("Configuración de facturación guardada correctamente");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando configuración de facturación");
    } finally {
      setSaving(false);
    }
  };

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
          
          {/* TAB: FACTURACIÓN */}
          <button
            onClick={() => {
              setActiveTab("billing");
              setError(null);
              setSuccess(null);
            }}
            className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
              activeTab === "billing"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Receipt className="w-5 h-5" />
            Facturación
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

              {/* CONTENIDO TAB FACTURACIÓN */}
              {activeTab === "billing" && (
                <div className="space-y-8">
                  {/* Sección: Configuración de Facturación */}
                  <div className="bg-white rounded-lg shadow border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Configuración de Facturación
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Define cómo se generan las facturas y cómo los residentes realizarán sus pagos.
                      </p>
                    </div>
                    <div className="p-6">
                      <BillingConfigForm
                        key={billingConfig ? JSON.stringify({ m: billingConfig.invoiceGenerationMode, p: billingConfig.paymentMode }) : "empty"}
                        initialConfig={billingConfig}
                        onSave={handleSaveBillingConfig}
                        isSaving={saving}
                      />
                    </div>
                  </div>

                  {/* Sección: Políticas de Intereses y Mora */}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
