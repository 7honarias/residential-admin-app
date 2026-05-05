"use client";

import { useCallback, useEffect, useState } from "react";
import { ReactNode } from "react";
import { useAppSelector } from "@/store/hooks";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Loader2,
  RefreshCw,
  Zap,
  Shield,
} from "lucide-react";
import VestapPlanCard from "@/components/settings/VestapPlanCard";
import {
  getComplexSubscription,
  getVestapPlans,
  getVestapInvoices,
  generatePaymentIntent,
  ComplexSubscription,
  VestapPlan,
  VestapInvoice,
  SubscriptionStatus,
  InvoiceStatus,
} from "@/services/vestapBilling.service";

// ==================== HELPERS ====================

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);

// ==================== CONFIG MAPS ====================

interface StatusConfig {
  label: string;
  badge: string;
  icon: ReactNode;
}

const SUBSCRIPTION_STATUS_CONFIG: Record<SubscriptionStatus, StatusConfig> = {
  ACTIVE: {
    label: "Activo",
    badge: "bg-green-100 text-green-700 border border-green-200",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  TRIAL: {
    label: "Prueba",
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
    icon: <Clock className="w-4 h-4" />,
  },
  PENDING: {
    label: "Pendiente",
    badge: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  EXPIRED: {
    label: "Vencido",
    badge: "bg-red-100 text-red-700 border border-red-200",
    icon: <XCircle className="w-4 h-4" />,
  },
  CANCELLED: {
    label: "Cancelado",
    badge: "bg-gray-100 text-gray-500 border border-gray-200",
    icon: <XCircle className="w-4 h-4" />,
  },
};

interface InvoiceStatusConfig {
  label: string;
  badge: string;
}

const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, InvoiceStatusConfig> = {
  PAID: { label: "Pagado", badge: "bg-green-100 text-green-700" },
  PENDING: { label: "Pendiente", badge: "bg-yellow-100 text-yellow-700" },
  OVERDUE: { label: "Vencido", badge: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelado", badge: "bg-gray-100 text-gray-500" },
};

// ==================== PAGE ====================

export default function SubscriptionPage() {
  const { activeComplex } = useAppSelector((state) => state.complex);
  const { token } = useAppSelector((state) => state.auth);

  const [subscription, setSubscription] = useState<ComplexSubscription | null>(null);
  const [plans, setPlans] = useState<VestapPlan[]>([]);
  const [invoices, setInvoices] = useState<VestapInvoice[]>([]);

  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!activeComplex?.id || !token) return;
    try {
      setLoading(true);
      setError(null);
      const [sub, plansData, invoicesData] = await Promise.all([
        getComplexSubscription({ token, complexId: activeComplex.id }),
        getVestapPlans({ token }),
        getVestapInvoices({ token, complexId: activeComplex.id }),
      ]);
      setSubscription(sub);
      setPlans(plansData.filter((p) => p.is_active));
      setInvoices(invoicesData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar la información de suscripción"
      );
    } finally {
      setLoading(false);
    }
  }, [activeComplex?.id, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectPlan = async (planId: string) => {
    if (!activeComplex?.id || !token) return;
    try {
      setProcessingPlanId(planId);
      setError(null);
      setSuccessMessage(null);
      await generatePaymentIntent({ token, complexId: activeComplex.id, planId });
      setSuccessMessage(
        "Intento de pago generado. Se ha creado una factura pendiente en tu historial."
      );
      setTimeout(() => setSuccessMessage(null), 6000);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al generar el intento de pago"
      );
    } finally {
      setProcessingPlanId(null);
    }
  };

  // ── Guard: no complex selected ──
  if (!activeComplex) {
    return (
      <div className="m-6 p-5 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
        <p className="text-yellow-800 text-sm font-medium">
          Selecciona un conjunto para ver y gestionar su suscripción.
        </p>
      </div>
    );
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">Cargando suscripción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suscripción Vestap</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona el plan y los pagos de la licencia para{" "}
            <span className="font-semibold text-slate-700">{activeComplex.name}</span>.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors mt-1"
          title="Recargar"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ══════════════════════════════════════
          SECTION 1 — Subscription Summary
      ══════════════════════════════════════ */}
      <section>
        <SectionTitle icon={<Shield className="w-5 h-5 text-indigo-500" />}>
          Resumen de Suscripción
        </SectionTitle>

        {subscription ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {/* Top row: plan info + status badge */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <CreditCard className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    Plan Actual
                  </p>
                  <p className="text-xl font-bold text-slate-900">
                    {subscription.plan.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {subscription.plan.billing_cycle === "MONTHLY"
                      ? "Mensual"
                      : "Anual"}{" "}
                    · {formatCurrency(subscription.plan.price)}
                  </p>
                </div>
              </div>

              {/* Status badge */}
              {(() => {
                const cfg = SUBSCRIPTION_STATUS_CONFIG[subscription.status];
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium self-start sm:self-center ${cfg.badge}`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </span>
                );
              })()}
            </div>

            {/* Details grid */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
                  Inicio del periodo
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {formatDate(subscription.current_period_start)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
                  Próximo corte
                </p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                  <p className="text-sm font-semibold text-slate-700">
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
                  Renovación automática
                </p>
                <p
                  className={`text-sm font-semibold ${
                    subscription.auto_renew ? "text-green-600" : "text-slate-400"
                  }`}
                >
                  {subscription.auto_renew ? "Activada" : "Desactivada"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <EmptyCard
            icon={<CreditCard className="w-10 h-10 text-slate-300" />}
            title="Sin suscripción activa"
            description="Selecciona uno de los planes disponibles para comenzar."
          />
        )}
      </section>

      {/* ══════════════════════════════════════
          SECTION 2 — Available Plans
      ══════════════════════════════════════ */}
      <section>
        <SectionTitle icon={<Zap className="w-5 h-5 text-indigo-500" />}>
          Planes Disponibles
        </SectionTitle>

        {plans.length === 0 ? (
          <p className="text-sm text-slate-500">No hay planes activos en este momento.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <VestapPlanCard
                key={plan.id}
                plan={plan}
                isCurrent={subscription?.plan_id === plan.id}
                isProcessing={processingPlanId === plan.id}
                onSelect={() => handleSelectPlan(plan.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════
          SECTION 3 — Billing History
      ══════════════════════════════════════ */}
      <section>
        <SectionTitle icon={<CreditCard className="w-5 h-5 text-indigo-500" />}>
          Historial de Facturación
        </SectionTitle>

        {invoices.length === 0 ? (
          <EmptyCard
            icon={<RefreshCw className="w-10 h-10 text-slate-300" />}
            title="Sin facturas registradas"
            description="Aquí aparecerán tus pagos una vez que actives un plan."
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    {["Periodo de Facturación", "Vencimiento", "Monto", "Estado", "Recibo"].map(
                      (h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((invoice) => {
                    const statusCfg =
                      INVOICE_STATUS_CONFIG[invoice.status] ?? {
                        label: invoice.status,
                        badge: "bg-gray-100 text-gray-500",
                      };
                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {formatDate(invoice.billing_period_start)}
                          {" – "}
                          {formatDate(invoice.billing_period_end)}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {formatDate(invoice.due_date)}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.badge}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {invoice.status === "PAID" && (
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL}/downloadInvoice?invoiceId=${invoice.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                              aria-label="Descargar recibo"
                            >
                              <Download className="w-4 h-4" />
                              Descargar
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function SectionTitle({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-700 mb-4">
      {icon}
      {children}
    </h2>
  );
}

function EmptyCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-slate-600 font-medium">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{description}</p>
    </div>
  );
}

// placeholder
function _unused() {
  return <div className="hidden" />;
}
