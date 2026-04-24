"use client";

import { useState } from "react";
import {
  Save,
  Loader2,
  Zap,
  FileSpreadsheet,
  CreditCard,
  Link2,
  Eye,
  EyeOff,
  CheckCircle2,
  Info,
  CalendarDays,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type InvoiceGenerationMode = "AUTOMATIC" | "EXCEL_UPLOAD";
export type PaymentMode = "PAYMENT_GATEWAY" | "REDIRECT_LINK";
export type GatewayProvider = "PLACETOPAY" | "BOLD";

export interface BillingConfig {
  invoiceGenerationMode: InvoiceGenerationMode;
  paymentMode: PaymentMode;
  gatewayProvider?: GatewayProvider;
  /** Day of month (1-28) on which invoices are auto-generated */
  invoiceGenerationDay?: number;
  /** Days after generation day before invoice is considered overdue */
  paymentDueDays?: number;
  merchantId?: string;
  privateKey?: string;
  boldIdentityKey?: string;
  boldSecretKey?: string;
  redirectPaymentUrl?: string;
  /** True when the backend has stored secret credentials */
  hasConfiguredSecrets?: boolean;
}

interface BillingConfigFormProps {
  initialConfig?: BillingConfig | null;
  onSave: (config: BillingConfig) => Promise<void>;
  isSaving: boolean;
}

// ─────────────────────────────────────────────
// SelectionCard sub-component
// ─────────────────────────────────────────────
interface SelectionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function SelectionCard({
  icon,
  title,
  description,
  badge,
  selected,
  onClick,
  disabled = false,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full text-left p-5 rounded-xl border-2 transition-all duration-200 group
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-md"}
        ${
          selected
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 bg-white hover:border-blue-300"
        }
      `}
    >
      {/* Selected indicator */}
      {selected && (
        <span className="absolute top-3 right-3">
          <CheckCircle2 className="w-5 h-5 text-blue-500" />
        </span>
      )}

      {/* Badge */}
      {badge && (
        <span className="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          {badge}
        </span>
      )}

      <div className="flex items-start gap-4">
        <div
          className={`
            flex-shrink-0 p-2.5 rounded-lg transition-colors
            ${selected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500"}
          `}
        >
          {icon}
        </div>
        <div>
          <p
            className={`font-semibold text-sm ${selected ? "text-blue-700" : "text-gray-800"}`}
          >
            {title}
          </p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// PasswordInput sub-component
// ─────────────────────────────────────────────
interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** When true, show dots to indicate a saved value exists */
  hasExistingValue?: boolean;
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  hasExistingValue,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const displayPlaceholder = !value && hasExistingValue
    ? "••••••••••••••••"
    : placeholder;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {!value && hasExistingValue && (
          <span className="ml-2 text-xs font-normal text-green-600">✓ Configurada</span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={displayPlaceholder}
          disabled={disabled}
          className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition
            disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
type FormState = {
  invoiceMode: InvoiceGenerationMode;
  paymentMode: PaymentMode;
  gatewayProvider: GatewayProvider;
  invoiceGenerationDay: string;
  paymentDueDays: string;
  merchantId: string;
  privateKey: string;
  boldIdentityKey: string;
  boldSecretKey: string;
  redirectUrl: string;
};

const buildFormState = (c?: BillingConfig | null): FormState => ({
  invoiceMode: c?.invoiceGenerationMode ?? "AUTOMATIC",
  paymentMode: c?.paymentMode ?? "PAYMENT_GATEWAY",
  gatewayProvider: c?.gatewayProvider ?? "PLACETOPAY",
  invoiceGenerationDay: c?.invoiceGenerationDay?.toString() ?? "1",
  paymentDueDays: c?.paymentDueDays?.toString() ?? "10",
  merchantId: c?.merchantId ?? "",
  privateKey: c?.privateKey ?? "",
  boldIdentityKey: c?.boldIdentityKey ?? "",
  boldSecretKey: c?.boldSecretKey ?? "",
  redirectUrl: c?.redirectPaymentUrl ?? "",
});

export default function BillingConfigForm({
  initialConfig,
  onSave,
  isSaving,
}: BillingConfigFormProps) {
  // State is reset via key prop from parent when initialConfig changes
  const [form, setForm] = useState<FormState>(() => buildFormState(initialConfig));
  const [validationError, setValidationError] = useState<string | null>(null);

  const setInvoiceMode = (v: InvoiceGenerationMode) =>
    setForm((f) => ({ ...f, invoiceMode: v }));
  const setPaymentMode = (v: PaymentMode) =>
    setForm((f) => ({ ...f, paymentMode: v }));
  const setGatewayProvider = (v: GatewayProvider) =>
    setForm((f) => ({ ...f, gatewayProvider: v }));
  const setInvoiceGenerationDay = (v: string) =>
    setForm((f) => ({ ...f, invoiceGenerationDay: v }));
  const setPaymentDueDays = (v: string) =>
    setForm((f) => ({ ...f, paymentDueDays: v }));
  const setMerchantId = (v: string) => setForm((f) => ({ ...f, merchantId: v }));
  const setPrivateKey = (v: string) => setForm((f) => ({ ...f, privateKey: v }));
  const setBoldIdentityKey = (v: string) => setForm((f) => ({ ...f, boldIdentityKey: v }));
  const setBoldSecretKey = (v: string) => setForm((f) => ({ ...f, boldSecretKey: v }));
  const setRedirectUrl = (v: string) => setForm((f) => ({ ...f, redirectUrl: v }));

  const { invoiceMode, paymentMode, gatewayProvider, invoiceGenerationDay, paymentDueDays, merchantId, privateKey, boldIdentityKey, boldSecretKey, redirectUrl } = form;

  const hasConfiguredSecrets = initialConfig?.hasConfiguredSecrets === true;

  /** For secret fields: send REDACTED if empty but already configured in backend */
  const REDACTED = "**REDACTED**";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (invoiceMode === "AUTOMATIC") {
      const day = parseInt(invoiceGenerationDay);
      const due = parseInt(paymentDueDays);
      if (isNaN(day) || day < 1 || day > 28) {
        setValidationError("El día de generación debe estar entre 1 y 28.");
        return;
      }
      if (isNaN(due) || due < 1 || due > 60) {
        setValidationError("Los días límite de pago deben estar entre 1 y 60.");
        return;
      }
    }

    if (paymentMode === "PAYMENT_GATEWAY") {
      if (gatewayProvider === "PLACETOPAY") {
        const needsSecrets = !hasConfiguredSecrets;
        if (!merchantId.trim() || (needsSecrets && !privateKey.trim())) {
          setValidationError(
            "Completa los campos de PlaceToPay (Merchant ID y Private Key)."
          );
          return;
        }
      } else if (gatewayProvider === "BOLD") {
        const needsSecrets = !hasConfiguredSecrets;
        if (needsSecrets && (!boldIdentityKey.trim() || !boldSecretKey.trim())) {
          setValidationError(
            "Completa los campos de BOLD (Llave de Identidad y Llave Secreta)."
          );
          return;
        }
      }
    }

    if (paymentMode === "REDIRECT_LINK") {
      if (!redirectUrl.trim()) {
        setValidationError("Ingresa el link de redirección al pago.");
        return;
      }
      try {
        new URL(redirectUrl.trim());
      } catch {
        setValidationError("El link de pago no tiene un formato de URL válido.");
        return;
      }
    }

    await onSave({
      invoiceGenerationMode: invoiceMode,
      paymentMode,
      gatewayProvider: paymentMode === "PAYMENT_GATEWAY" ? gatewayProvider : undefined,
      invoiceGenerationDay:
        invoiceMode === "AUTOMATIC" ? parseInt(invoiceGenerationDay) : undefined,
      paymentDueDays:
        invoiceMode === "AUTOMATIC" ? parseInt(paymentDueDays) : undefined,
      merchantId: paymentMode === "PAYMENT_GATEWAY" && gatewayProvider === "PLACETOPAY" ? merchantId.trim() : undefined,
      privateKey: paymentMode === "PAYMENT_GATEWAY" && gatewayProvider === "PLACETOPAY"
        ? (privateKey.trim() || (hasConfiguredSecrets ? REDACTED : undefined))
        : undefined,
      boldIdentityKey: paymentMode === "PAYMENT_GATEWAY" && gatewayProvider === "BOLD"
        ? (boldIdentityKey.trim() || (hasConfiguredSecrets ? REDACTED : undefined))
        : undefined,
      boldSecretKey: paymentMode === "PAYMENT_GATEWAY" && gatewayProvider === "BOLD"
        ? (boldSecretKey.trim() || (hasConfiguredSecrets ? REDACTED : undefined))
        : undefined,
      redirectPaymentUrl:
        paymentMode === "REDIRECT_LINK" ? redirectUrl.trim() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 max-w-3xl">
      {/* ── Section 1: Invoice Generation ── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
              1
            </span>
            Generación de Facturas
          </h3>
          <p className="text-sm text-gray-500 mt-1 ml-8">
            Elige cómo se crearán las facturas mensuales para los residentes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-8">
          <SelectionCard
            icon={<Zap className="w-5 h-5" />}
            title="Generación Automática"
            description="El sistema genera y envía las facturas automáticamente al inicio de cada período de facturación."
            badge="Recomendado"
            selected={invoiceMode === "AUTOMATIC"}
            onClick={() => setInvoiceMode("AUTOMATIC")}
            disabled={isSaving}
          />
          <SelectionCard
            icon={<FileSpreadsheet className="w-5 h-5" />}
            title="Carga de Excel"
            description="Sube un archivo Excel con las facturas cada mes. Ideal si manejas cálculos personalizados externamente."
            selected={invoiceMode === "EXCEL_UPLOAD"}
            onClick={() => setInvoiceMode("EXCEL_UPLOAD")}
            disabled={isSaving}
          />
        </div>

        {invoiceMode === "AUTOMATIC" && (
          <div className="ml-8 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Las facturas se generarán automáticamente el primer día de cada mes
              usando los valores de administración y coeficientes configurados en
              esta sección.
            </p>
          </div>
        )}

        {invoiceMode === "AUTOMATIC" && (
          <div className="ml-8 mt-2 p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold text-gray-800">Programación de Facturas</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Día de generación */}
              <div className="space-y-1.5">
                <label htmlFor="invoiceGenerationDay" className="block text-sm font-medium text-gray-700">
                  Día de generación
                </label>
                <div className="relative">
                  <input
                    id="invoiceGenerationDay"
                    type="number"
                    min={1}
                    max={28}
                    value={invoiceGenerationDay}
                    onChange={(e) => setInvoiceGenerationDay(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition
                      disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Día del mes en que se generan las facturas (1 – 28).
                </p>
              </div>

              {/* Días límite de pago */}
              <div className="space-y-1.5">
                <label htmlFor="paymentDueDays" className="block text-sm font-medium text-gray-700">
                  Días límite de pago
                </label>
                <div className="relative">
                  <input
                    id="paymentDueDays"
                    type="number"
                    min={1}
                    max={60}
                    value={paymentDueDays}
                    onChange={(e) => setPaymentDueDays(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition
                      disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Días después de la generación para pagar sin mora (1 – 60).
                </p>
              </div>
            </div>

            {/* Preview */}
            {invoiceGenerationDay && paymentDueDays && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Las facturas se generarán el día{" "}
                  <strong>{invoiceGenerationDay}</strong> de cada mes y el plazo
                  límite de pago será el día{" "}
                  <strong>
                    {Math.min(
                      parseInt(invoiceGenerationDay) + parseInt(paymentDueDays),
                      28
                    )}
                  </strong>{" "}
                  del mismo mes ({paymentDueDays} días después).
                </p>
              </div>
            )}
          </div>
        )}

        {invoiceMode === "EXCEL_UPLOAD" && (
          <div className="ml-8 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Deberás subir el archivo Excel desde el módulo de{" "}
              <strong>Finanzas → Facturas</strong> cada mes. El archivo debe
              respetar la plantilla establecida.
            </p>
          </div>
        )}
      </section>

      <hr className="border-gray-200" />

      {/* ── Section 2: Payment Method ── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
              2
            </span>
            Método de Pago
          </h3>
          <p className="text-sm text-gray-500 mt-1 ml-8">
            Configura cómo los residentes realizarán el pago de sus facturas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-8">
          <SelectionCard
            icon={<CreditCard className="w-5 h-5" />}
            title="Pasarela de Pagos"
            description="Integración con PlaceToPay o BOLD. Los residentes pagan directamente desde la app de forma segura."
            badge="Integrado"
            selected={paymentMode === "PAYMENT_GATEWAY"}
            onClick={() => setPaymentMode("PAYMENT_GATEWAY")}
            disabled={isSaving}
          />
          <SelectionCard
            icon={<Link2 className="w-5 h-5" />}
            title="Link de Pago"
            description="Redirige a los residentes a un enlace externo (PSE, portal bancario u otro medio de pago)."
            selected={paymentMode === "REDIRECT_LINK"}
            onClick={() => setPaymentMode("REDIRECT_LINK")}
            disabled={isSaving}
          />
        </div>

        {/* ── Gateway provider selector + credential forms ── */}
        {paymentMode === "PAYMENT_GATEWAY" && (
          <div className="ml-8 mt-2 space-y-4">
            {/* Gateway provider selector */}
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-semibold text-gray-800">
                  Selecciona la Pasarela de Pagos
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGatewayProvider("PLACETOPAY")}
                  disabled={isSaving}
                  className={`
                    relative text-left p-4 rounded-lg border-2 transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                    ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-sm"}
                    ${
                      gatewayProvider === "PLACETOPAY"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }
                  `}
                >
                  {gatewayProvider === "PLACETOPAY" && (
                    <span className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    </span>
                  )}
                  <p className={`font-semibold text-sm ${gatewayProvider === "PLACETOPAY" ? "text-blue-700" : "text-gray-800"}`}>
                    PlaceToPay
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pagos con PSE, tarjetas de crédito y débito.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setGatewayProvider("BOLD")}
                  disabled={isSaving}
                  className={`
                    relative text-left p-4 rounded-lg border-2 transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                    ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-sm"}
                    ${
                      gatewayProvider === "BOLD"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }
                  `}
                >
                  {gatewayProvider === "BOLD" && (
                    <span className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    </span>
                  )}
                  <p className={`font-semibold text-sm ${gatewayProvider === "BOLD" ? "text-blue-700" : "text-gray-800"}`}>
                    BOLD
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pagos con link de pago, datáfono y transferencias.
                  </p>
                </button>
              </div>
            </div>

            {/* PlaceToPay credentials */}
            {gatewayProvider === "PLACETOPAY" && (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-800">
                    Credenciales de PlaceToPay
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="merchantId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Merchant ID
                  </label>
                  <input
                    id="merchantId"
                    type="text"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    placeholder="Ingresa el Merchant ID de PlaceToPay"
                    disabled={isSaving}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition
                      disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>

                <PasswordInput
                  id="privateKey"
                  label="Private Key"
                  value={privateKey}
                  onChange={setPrivateKey}
                  placeholder="Clave privada de PlaceToPay"
                  disabled={isSaving}
                  hasExistingValue={hasConfiguredSecrets}
                />

                <p className="text-xs text-gray-500 flex items-start gap-1.5 pt-1">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  Las claves son almacenadas de forma cifrada. Puedes obtenerlas en
                  el panel de administración de PlaceToPay.
                </p>
              </div>
            )}

            {/* BOLD credentials */}
            {gatewayProvider === "BOLD" && (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-800">
                    Credenciales de BOLD
                  </p>
                </div>

                <PasswordInput
                  id="boldIdentityKey"
                  label="Llave de Identidad"
                  value={boldIdentityKey}
                  onChange={setBoldIdentityKey}
                  placeholder="Ingresa la llave de identidad de BOLD"
                  disabled={isSaving}
                  hasExistingValue={hasConfiguredSecrets}
                />

                <PasswordInput
                  id="boldSecretKey"
                  label="Llave Secreta"
                  value={boldSecretKey}
                  onChange={setBoldSecretKey}
                  placeholder="Ingresa la llave secreta de BOLD"
                  disabled={isSaving}
                  hasExistingValue={hasConfiguredSecrets}
                />

                <p className="text-xs text-gray-500 flex items-start gap-1.5 pt-1">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  Las claves son almacenadas de forma cifrada. Puedes obtenerlas en
                  el panel de desarrolladores de BOLD.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Redirect link sub-form ── */}
        {paymentMode === "REDIRECT_LINK" && (
          <div className="ml-8 mt-2 p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold text-gray-800">
                Link de Redirección al Pago
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="redirectUrl"
                className="block text-sm font-medium text-gray-700"
              >
                URL de pago
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Link2 className="w-4 h-4" />
                </span>
                <input
                  id="redirectUrl"
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://portal.banco.com/pagos/conjunto"
                  disabled={isSaving}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition
                    disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <p className="text-xs text-gray-500">
                Los residentes serán redirigidos a este enlace al hacer clic en
                &quot;Pagar factura&quot;.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── Validation error ── */}
      {validationError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {validationError}
        </div>
      )}

      {/* ── Save button ── */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold
            rounded-lg hover:bg-blue-700 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-all shadow-sm"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>
    </form>
  );
}
