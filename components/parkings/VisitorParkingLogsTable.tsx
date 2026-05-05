'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  fetchVisitorParkingLogs,
  VisitorParkingLogItem,
} from '@/services/parking.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  });
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function todayCol(): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().split('T')[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VisitorParkingLogItem['status'] }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Activo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Completado
    </span>
  );
}

function PaymentBadge({
  fee,
  method,
  status,
}: {
  fee: number;
  method: VisitorParkingLogItem['payment_method'];
  status: VisitorParkingLogItem['status'];
}) {
  if (status === 'ACTIVE') {
    return <span className="text-slate-400 text-sm">—</span>;
  }
  if (fee === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
        🆓 Gratis
      </span>
    );
  }
  const label = method === 'CASH' ? '💵 Efectivo' : method === 'POS' ? '💳 Datáfono' : '—';
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-sm font-bold text-slate-800">{formatCurrency(fee)}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VisitorParkingLogsTable() {
  const token = useAppSelector((s) => s.auth.token);
  const complexId = useAppSelector((s) => s.complex.activeComplex?.id);

  const [selectedDate, setSelectedDate] = useState<string>(todayCol());
  const [items, setItems] = useState<VisitorParkingLogItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (date: string, cursor?: string) => {
      if (!token || !complexId) return;
      cursor ? setIsLoadingMore(true) : setIsLoading(true);
      setError(null);

      try {
        const res = await fetchVisitorParkingLogs({ token, complexId, date, cursor });
        if (cursor) {
          setItems((prev) => [...prev, ...res.items]);
        } else {
          setItems(res.items);
        }
        setNextCursor(res.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando registros');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [token, complexId],
  );

  useEffect(() => {
    setNextCursor(null);
    load(selectedDate);
  }, [selectedDate, load]);

  const activeCount = items.filter((i) => i.status === 'ACTIVE').length;
  const completedCount = items.filter((i) => i.status === 'COMPLETED').length;
  const totalRevenue = items.reduce((acc, i) => acc + i.fee_amount, 0);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">🚗 Registro de Vehículos Visitantes</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Historial de ingresos y salidas del día seleccionado
          </p>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2">
          <label htmlFor="log-date" className="text-sm font-medium text-slate-600 whitespace-nowrap">
            📅 Fecha:
          </label>
          <input
            id="log-date"
            type="date"
            value={selectedDate}
            max={todayCol()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
          />
          <button
            onClick={() => { setNextCursor(null); load(selectedDate); }}
            disabled={isLoading}
            title="Recargar"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition shadow-sm disabled:opacity-40"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ── Summary cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
          <p className="text-2xl font-black text-emerald-700">{activeCount}</p>
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">Activos ahora</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
          <p className="text-2xl font-black text-slate-700">{completedCount}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Completados</p>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-center">
          <p className="text-2xl font-black text-indigo-700">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs font-semibold text-indigo-600 mt-0.5">Recaudo del día</p>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        {/* Table header */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Placa
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Espacio
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Ingreso
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Salida
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Duración
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Cobro / Pago
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                // Skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 rounded-md bg-slate-200 animate-pulse" style={{ width: `${60 + (j * 11) % 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <span className="text-4xl">🅿️</span>
                      <p className="font-semibold text-slate-600">Sin registros para esta fecha</p>
                      <p className="text-sm">No hubo vehículos visitantes el {selectedDate}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-50 ${
                      item.status === 'ACTIVE' ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    {/* Plate */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-slate-800 tracking-widest text-sm bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.plate}
                      </span>
                    </td>

                    {/* Parking number */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-slate-700">
                        🅿️ {item.parking_number}
                      </span>
                    </td>

                    {/* Entry time */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-700 font-medium">
                        {formatTime(item.entry_time)}
                      </span>
                    </td>

                    {/* Exit time */}
                    <td className="px-4 py-3.5">
                      {item.exit_time ? (
                        <span className="text-sm text-slate-700 font-medium">
                          {formatTime(item.exit_time)}
                        </span>
                      ) : (
                        <span className="text-sm text-emerald-600 font-semibold">En curso</span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-600">
                        {formatDuration(item.duration_minutes)}
                      </span>
                    </td>

                    {/* Payment */}
                    <td className="px-4 py-3.5">
                      <PaymentBadge fee={item.fee_amount} method={item.payment_method} status={item.status} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {nextCursor && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <button
              onClick={() => load(selectedDate, nextCursor)}
              disabled={isLoadingMore}
              className="rounded-xl border border-slate-300 bg-white px-6 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm transition"
            >
              {isLoadingMore ? 'Cargando...' : 'Cargar más registros'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
