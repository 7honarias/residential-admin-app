"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Loader,
  Save,
  PlusCircle,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  fetchComplexBudgets,
  saveComplexBudget,
  type ComplexBudget,
} from "@/services/budget.service";

// ============================================================
// TIPOS
// ============================================================

interface BudgetTabProps {
  token: string | null;
  complexId: string;
}

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
// COMPONENTE
// ============================================================

export default function BudgetTab({ token, complexId }: BudgetTabProps) {
  const currentYear = new Date().getFullYear();

  // ── Estado principal ──────────────────────────────────────
  const [budgets, setBudgets] = useState<ComplexBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Estado del formulario ──────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [formYear, setFormYear] = useState<string>(String(currentYear));
  const [formAmount, setFormAmount] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // ── Carga inicial ─────────────────────────────────────────
  const loadBudgets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplexBudgets({ token, complexId });
      setBudgets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando presupuesto");
    } finally {
      setLoading(false);
    }
  }, [token, complexId]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  // ── Presupuesto del año en curso ──────────────────────────
  const currentBudget = budgets.find((b) => b.period_year === currentYear) ?? null;

  // ── Guardar presupuesto ───────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const year = parseInt(formYear, 10);
    const amount = parseFloat(formAmount.replace(/\./g, "").replace(",", "."));

    if (!formYear || isNaN(year) || year < 2000 || year > 2100) {
      setFormError("Ingresa un año válido (entre 2000 y 2100).");
      return;
    }
    if (!formAmount || isNaN(amount) || amount <= 0) {
      setFormError("Ingresa un monto de presupuesto válido y mayor a cero.");
      return;
    }
    if (!token) return;

    setSaving(true);
    try {
      const saved = await saveComplexBudget({
        token,
        complexId,
        period_year: year,
        total_amount: amount,
      });

      // Actualizar la lista localmente
      setBudgets((prev) => {
        const without = prev.filter((b) => b.period_year !== saved.period_year);
        return [saved, ...without].sort((a, b) => b.period_year - a.period_year);
      });

      setSuccessMsg(`Presupuesto ${saved.period_year} guardado exitosamente`);
      setShowForm(false);
      setFormAmount("");
      setFormYear(String(currentYear));
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error guardando presupuesto");
    } finally {
      setSaving(false);
    }
  };

  // ── Abrir formulario pre-cargado para editar ──────────────
  const handleEdit = (budget: ComplexBudget) => {
    setFormYear(String(budget.period_year));
    setFormAmount(String(budget.total_amount));
    setFormError(null);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("budget-form-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // ── Render ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-6 h-6 text-slate-600 animate-spin" />
        <span className="ml-2 text-slate-600">Cargando presupuesto...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Alertas globales ─────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{successMsg}</p>
        </div>
      )}

      {/* ── Tarjeta: presupuesto año en curso ────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 opacity-80" />
            <span className="text-sm font-medium opacity-80">
              Presupuesto Anual {currentYear}
            </span>
          </div>
          {currentBudget ? (
            <>
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrency(currentBudget.total_amount)}
              </p>
              <p className="text-xs mt-2 opacity-70">
                Aprobado el {formatDate(currentBudget.approved_at)}
              </p>
              <p className="text-xs opacity-70">
                Cuota mensual estimada:{" "}
                <span className="font-semibold">
                  {formatCurrency(currentBudget.total_amount / 12)}
                </span>
              </p>
            </>
          ) : (
            <p className="text-lg font-medium opacity-80 mt-2">
              No hay presupuesto cargado para {currentYear}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Registros históricos
            </h3>
            <p className="text-3xl font-bold text-gray-800">{budgets.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              {budgets.length > 0
                ? `Desde ${budgets[budgets.length - 1].period_year} hasta ${budgets[0].period_year}`
                : "Aún no hay presupuestos registrados"}
            </p>
          </div>
          <button
            onClick={() => {
              setFormYear(String(currentYear));
              setFormAmount(currentBudget ? String(currentBudget.total_amount) : "");
              setFormError(null);
              setShowForm(true);
              setTimeout(() => {
                document.getElementById("budget-form-section")?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors w-fit"
          >
            <PlusCircle className="w-4 h-4" />
            {currentBudget ? "Actualizar presupuesto" : "Cargar presupuesto"}
          </button>
        </div>
      </div>

      {/* ── Formulario ───────────────────────────────────── */}
      {showForm && (
        <div
          id="budget-form-section"
          className="bg-white rounded-xl border border-blue-200 shadow-sm"
        >
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              {budgets.find((b) => b.period_year === parseInt(formYear))
                ? "Actualizar presupuesto"
                : "Registrar nuevo presupuesto"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              El presupuesto anual sirve de base para calcular las cuotas de
              administración de cada inmueble.
            </p>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-5 max-w-lg">
            {formError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {formError}
              </div>
            )}

            {/* Año */}
            <div className="space-y-1.5">
              <label
                htmlFor="budget-year"
                className="block text-sm font-medium text-gray-700"
              >
                Año del presupuesto
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="budget-year"
                  type="number"
                  min={2000}
                  max={2100}
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={String(currentYear)}
                />
              </div>
              <p className="text-xs text-gray-500">
                Si ya existe un presupuesto para este año, será reemplazado.
              </p>
            </div>

            {/* Monto total */}
            <div className="space-y-1.5">
              <label
                htmlFor="budget-amount"
                className="block text-sm font-medium text-gray-700"
              >
                Presupuesto total anual (COP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">
                  $
                </span>
                <input
                  id="budget-amount"
                  type="number"
                  min={1}
                  step="any"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej: 120000000"
                />
              </div>
              {formAmount && !isNaN(parseFloat(formAmount)) && parseFloat(formAmount) > 0 && (
                <p className="text-xs text-blue-600">
                  Cuota mensual estimada:{" "}
                  <span className="font-semibold">
                    {formatCurrency(parseFloat(formAmount) / 12)}
                  </span>
                </p>
              )}
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Guardando..." : "Guardar presupuesto"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormError(null);
                }}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Historial de presupuestos ─────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Historial de presupuestos
          </h2>
        </div>

        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center text-gray-500">
            <TrendingUp className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium">Sin presupuestos registrados</p>
            <p className="text-xs mt-1">
              Carga el primer presupuesto anual del conjunto para comenzar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Año</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Presupuesto total
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Cuota mensual
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    Fecha aprobación
                  </th>
                  <th className="px-5 py-3 text-left font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {budgets.map((budget) => (
                  <tr
                    key={budget.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      budget.period_year === currentYear
                        ? "bg-blue-50/50"
                        : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-semibold text-gray-800">
                      {budget.period_year}
                      {budget.period_year === currentYear && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                          actual
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(budget.total_amount)}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">
                      {formatCurrency(budget.total_amount / 12)}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {formatDate(budget.approved_at)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
