"use client";

interface ShiftBannerProps {
  hasActiveShift: boolean;
  elapsedLabel: string;
  isLoading: boolean;
  onStartShift: () => void;
  onCloseShift: () => void;
}

export function ShiftBanner({
  hasActiveShift,
  elapsedLabel,
  isLoading,
  onStartShift,
  onCloseShift,
}: ShiftBannerProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Bitacora Digital</p>
          <h2 className="mt-1 text-2xl font-black md:text-3xl">Control de Turno de Porteria</h2>
          <p className="mt-2 text-slate-300">
            {hasActiveShift ? `Turno activo: ${elapsedLabel}` : "No hay turno activo. Abre turno para empezar a registrar novedades."}
          </p>
        </div>

        <button
          onClick={hasActiveShift ? onCloseShift : onStartShift}
          disabled={isLoading}
          className={`w-full rounded-2xl px-7 py-5 text-xl font-extrabold shadow-xl transition md:w-auto ${
            hasActiveShift
              ? "bg-red-600 text-white hover:bg-red-500"
              : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {isLoading ? "Procesando..." : hasActiveShift ? "ENTREGAR TURNO" : "ABRIR TURNO"}
        </button>
      </div>
    </div>
  );
}
