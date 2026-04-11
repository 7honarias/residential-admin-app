"use client";

import { useEffect, useRef } from "react";
import { LogCategory, ShiftLogItem } from "@/services/gatehouseLogbook.service";

const categoryMeta: Record<LogCategory, { label: string; icon: string; chip: string }> = {
  ROUTINE: { label: "Ronda", icon: "🔵", chip: "bg-blue-100 text-blue-800 border-blue-200" },
  PACKAGE: { label: "Paquete", icon: "📦", chip: "bg-violet-100 text-violet-800 border-violet-200" },
  INCIDENT: { label: "Incidente", icon: "🚨", chip: "bg-red-100 text-red-800 border-red-200" },
  OTHER: { label: "Otro", icon: "📝", chip: "bg-slate-100 text-slate-700 border-slate-200" },
  CORRECTION: { label: "Fe de erratas", icon: "✏️", chip: "bg-amber-100 text-amber-800 border-amber-200" },
};

interface LogTimelineProps {
  logs: ShiftLogItem[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onCorrection: (log: ShiftLogItem) => void;
}

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export function LogTimeline({ logs, hasMore, loadingMore, onLoadMore, onCorrection }: LogTimelineProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "240px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <p className="text-lg font-semibold text-slate-600">Aun no hay registros en este turno.</p>
        <p className="mt-1 text-sm text-slate-500">Usa el boton + para crear la primera novedad.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const meta = categoryMeta[log.category] ?? categoryMeta.OTHER;
        return (
          <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${meta.chip}`}>
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </span>
                <span className="text-xs font-semibold text-slate-500">{formatTimestamp(log.created_at)}</span>
              </div>

              <button
                onClick={() => onCorrection(log)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Hacer correccion
              </button>
            </div>

            <p className="mt-3 text-base leading-relaxed text-slate-800">{log.content}</p>

            {log.reference_log_id && (
              <p className="mt-2 text-xs font-semibold text-amber-700">Refiere al registro: {log.reference_log_id}</p>
            )}

            {log.attachments && log.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {log.attachments.map((attachment) => (
                  <a
                    key={attachment.file_url}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200"
                  >
                    <img src={attachment.file_url} alt="Adjunto" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </article>
        );
      })}

      <div ref={sentinelRef} className="h-4" />

      {loadingMore && <p className="py-4 text-center text-sm font-semibold text-slate-500">Cargando mas registros...</p>}
      {!hasMore && <p className="py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">No hay mas registros</p>}
    </div>
  );
}
