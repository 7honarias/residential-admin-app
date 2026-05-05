"use client";

import { CheckCircle, XCircle, Star, Loader2, ChevronRight, Building2, Layers } from "lucide-react";
import { VestapPlan } from "@/services/vestapBilling.service";

// ==================== HELPERS ====================

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);

// ==================== PROPS ====================

export interface VestapPlanCardProps {
  plan: VestapPlan;
  isCurrent: boolean;
  isProcessing: boolean;
  onSelect: () => void;
}

// ==================== COMPONENT ====================

export default function VestapPlanCard({
  plan,
  isCurrent,
  isProcessing,
  onSelect,
}: VestapPlanCardProps) {
  const cycleLabel = plan.billing_cycle === "MONTHLY" ? "mes" : "año";
  const cycleTag = plan.billing_cycle === "MONTHLY" ? "Mensual" : "Anual";

  return (
    <div
      className={`relative flex flex-col h-full rounded-2xl border transition-all duration-200 overflow-hidden ${
        plan.is_recommended && !isCurrent
          ? "border-indigo-400 shadow-lg shadow-indigo-100"
          : isCurrent
          ? "border-indigo-500 bg-indigo-50 shadow-md"
          : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md"
      }`}
    >
      {/* ── Recommended banner ── */}
      {plan.is_recommended && (
        <div className="bg-indigo-600 text-white text-xs font-bold text-center py-1.5 tracking-wider uppercase">
          ⭐ Más popular
        </div>
      )}

      <div className="flex flex-col flex-1 p-6">
        {/* ── Current badge ── */}
        {isCurrent && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow">
              <Star className="w-3 h-3" />
              Plan actual
            </span>
          </div>
        )}

        {/* ── Header ── */}
        <div className="mb-4">
          <span className="inline-block text-xs font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full mb-2">
            {cycleTag}
          </span>
          <h3 className="text-lg font-bold text-slate-900 leading-tight pr-16">
            {plan.name}
          </h3>
          {plan.description && (
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              {plan.description}
            </p>
          )}
        </div>

        {/* ── Price ── */}
        <div className="mb-4">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-extrabold text-slate-900">
              {formatCurrency(plan.price)}
            </span>
            <span className="text-sm font-medium text-slate-400 mb-1">
              /{cycleLabel}
            </span>
          </div>
          {plan.is_per_unit && (
            <p className="text-xs text-slate-400 mt-0.5">por unidad residencial</p>
          )}
        </div>

        {/* ── Limits ── */}
        {(plan.max_apartments !== null || plan.max_blocks !== null) && (
          <div className="flex flex-wrap gap-3 mb-5">
            {plan.max_apartments !== null && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Hasta {plan.max_apartments} apartamentos
              </div>
            )}
            {plan.max_blocks !== null && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Hasta {plan.max_blocks} bloques
              </div>
            )}
          </div>
        )}

        {/* ── Feature list ── */}
        {(plan.features?.length ?? 0) > 0 && (
          <ul className="flex-1 space-y-2 mb-6">
            {(plan.features ?? []).map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                {feature.included ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                )}
                <span
                  className={`text-sm leading-snug ${
                    feature.included ? "text-slate-700" : "text-slate-400 line-through"
                  }`}
                >
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
