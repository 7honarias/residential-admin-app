"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  closeShift,
  createShiftLog,
  fetchClosedShifts,
  fetchShiftLogs,
  LogCategory,
  ShiftInfo,
  ShiftLogItem,
  ShiftSummary,
  startShift,
  uploadLogImages,
} from "@/services/gatehouseLogbook.service";
import { ShiftBanner } from "@/components/gatehouse/ShiftBanner";
import { LogTimeline } from "@/components/gatehouse/LogTimeline";
import { NewLogModal } from "@/components/gatehouse/NewLogModal";

interface DigitalLogbookModuleProps {
  token: string;
  complexId: string;
}

const DEFAULT_CLOSING_NOTE = "Sin novedades especiales.";
const ACTIVE_SHIFT_STORAGE_KEY = "gatehouse_active_shift";
type LogbookViewMode = "CURRENT" | "HISTORY";

const getElapsedLabel = (startedAt?: string) => {
  if (!startedAt) return "0h 00m";
  const started = new Date(startedAt).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - started);
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
};

export default function DigitalLogbookModule({ token, complexId }: DigitalLogbookModuleProps) {
  const [activeShift, setActiveShift] = useState<ShiftInfo | null>(null);
  const [logs, setLogs] = useState<ShiftLogItem[]>([]);
  const [mode, setMode] = useState<LogbookViewMode>("CURRENT");
  const [historyShifts, setHistoryShifts] = useState<ShiftSummary[]>([]);
  const [selectedHistoryShiftId, setSelectedHistoryShiftId] = useState<string>("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingHistoryShifts, setLoadingHistoryShifts] = useState(false);
  const [isShiftLoading, setIsShiftLoading] = useState(false);
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<LogCategory>("ROUTINE");
  const [referenceLogId, setReferenceLogId] = useState<string | null>(null);
  const [clockTick, setClockTick] = useState(0);

  const storageKey = useMemo(() => `${ACTIVE_SHIFT_STORAGE_KEY}:${complexId}`, [complexId]);

  useEffect(() => {
    if (!complexId || typeof window === "undefined") return;

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as ShiftInfo;
      if (parsed?.shift_id && parsed?.started_at && parsed?.status === "ACTIVE") {
        setActiveShift(parsed);
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [complexId, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeShift || activeShift.status !== "ACTIVE") {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(activeShift));
  }, [activeShift, storageKey]);

  const elapsedLabel = useMemo(() => {
    void clockTick;
    return getElapsedLabel(activeShift?.started_at);
  }, [activeShift?.started_at, clockTick]);

  const hasMore = Boolean(nextCursor);
  const isHistoryMode = mode === "HISTORY";
  const targetShiftId = isHistoryMode ? selectedHistoryShiftId : activeShift?.shift_id;

  useEffect(() => {
    if (!activeShift) return;
    const timer = window.setInterval(() => setClockTick((prev) => prev + 1), 60000);
    return () => window.clearInterval(timer);
  }, [activeShift]);

  const loadLogs = useCallback(
    async (cursor?: string | null) => {
      if (!token || !targetShiftId) return;

      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoadingInitial(true);
      }

      try {
        const response = await fetchShiftLogs({
          token,
          shiftId: targetShiftId,
          cursor: cursor || undefined,
          limit: 10,
        });

        setLogs((prev) => {
          if (!cursor) return response.logs;
          const existingIds = new Set(prev.map((l) => l.id));
          const newLogs = response.logs.filter((l) => !existingIds.has(l.id));
          return [...prev, ...newLogs];
        });
        setNextCursor(response.next_cursor);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "No fue posible cargar la bitacora");
      } finally {
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    },
    [token, targetShiftId]
  );

  const loadHistoryShifts = useCallback(async () => {
    if (!token || !complexId) return;

    setLoadingHistoryShifts(true);
    try {
      const response = await fetchClosedShifts({ token, complexId, limit: 30 });
      setHistoryShifts(response.shifts);
      setSelectedHistoryShiftId((prev) => {
        if (prev && response.shifts.some((shift) => shift.shift_id === prev)) return prev;
        return response.shifts[0]?.shift_id || "";
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No fue posible cargar minutas anteriores");
    } finally {
      setLoadingHistoryShifts(false);
    }
  }, [token, complexId]);

  useEffect(() => {
    setLogs([]);
    setNextCursor(null);
    if (!targetShiftId) return;
    loadLogs();
  }, [targetShiftId, loadLogs]);

  useEffect(() => {
    if (!isHistoryMode) return;
    loadHistoryShifts();
  }, [isHistoryMode, loadHistoryShifts]);

  const handleOpenShift = async () => {
    if (!token || !complexId) {
      setErrorMessage("No hay sesion activa o complejo seleccionado.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsShiftLoading(true);

    try {
      const response = await startShift({ token, complexId });
      setActiveShift(response);
      setMode("CURRENT");
      setSuccessMessage("Turno activo listo.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No fue posible abrir el turno");
    } finally {
      setIsShiftLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!token || !activeShift?.shift_id) return;

    setErrorMessage("");
    setSuccessMessage("");
    setIsShiftLoading(true);

    try {
      await closeShift({
        token,
        shiftId: activeShift.shift_id,
        closingObservations: DEFAULT_CLOSING_NOTE,
      });
      setSuccessMessage("Turno cerrado exitosamente.");
      setActiveShift(null);
      setLogs([]);
      setNextCursor(null);
      setMode("HISTORY");
      loadHistoryShifts();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(storageKey);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No fue posible cerrar el turno");
    } finally {
      setIsShiftLoading(false);
    }
  };

  const handleCreateLog = async (params: {
    category: LogCategory;
    content: string;
    reference_log_id?: string | null;
    files: File[];
  }) => {
    if (!token || !activeShift?.shift_id) {
      throw new Error("Debes abrir un turno antes de crear un registro.");
    }

    setIsSavingLog(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const attachments = await uploadLogImages({
        files: params.files,
        complexId,
        shiftId: activeShift.shift_id,
      });

      const response = await createShiftLog({
        token,
        payload: {
          shift_id: activeShift.shift_id,
          category: params.category,
          content: params.content,
          reference_log_id: params.reference_log_id || null,
          attachments,
        },
      });

      const payload = (response as { log_id?: string; created_at?: string }).log_id
        ? (response as { log_id: string; created_at?: string })
        : { log_id: crypto.randomUUID(), created_at: new Date().toISOString() };

      const newItem: ShiftLogItem = {
        id: payload.log_id,
        shift_id: activeShift.shift_id,
        category: params.category,
        content: params.content,
        created_at: payload.created_at || new Date().toISOString(),
        reference_log_id: params.reference_log_id || null,
        attachments,
      };

      setLogs((prev) => [newItem, ...prev]);
      setIsModalOpen(false);
      setDefaultCategory("ROUTINE");
      setReferenceLogId(null);
      setSuccessMessage("Registro creado exitosamente.");
    } finally {
      setIsSavingLog(false);
    }
  };

  const openNewLogModal = () => {
    if (isHistoryMode) return;
    setDefaultCategory("ROUTINE");
    setReferenceLogId(null);
    setIsModalOpen(true);
  };

  const openCorrectionModal = (log: ShiftLogItem) => {
    setDefaultCategory("CORRECTION");
    setReferenceLogId(log.id);
    setIsModalOpen(true);
  };

  return (
    <section className="space-y-5">
      <ShiftBanner
        hasActiveShift={Boolean(activeShift)}
        elapsedLabel={elapsedLabel}
        isLoading={isShiftLoading}
        onStartShift={handleOpenShift}
        onCloseShift={handleCloseShift}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("CURRENT")}
            className={`rounded-xl px-4 py-3 text-base font-black transition ${
              mode === "CURRENT"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Turno Actual
          </button>
          <button
            type="button"
            onClick={() => setMode("HISTORY")}
            className={`rounded-xl px-4 py-3 text-base font-black transition ${
              mode === "HISTORY"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Minutas Anteriores
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-black text-slate-900">
            {isHistoryMode ? "Minuta de Turno Cerrado" : "Timeline del Turno"}
          </h3>

          {isHistoryMode && (
            <div className="w-full md:w-auto">
              {loadingHistoryShifts ? (
                <p className="text-sm font-semibold text-slate-500">Cargando turnos cerrados...</p>
              ) : historyShifts.length === 0 ? (
                <p className="text-sm font-semibold text-slate-500">No hay turnos cerrados disponibles.</p>
              ) : (
                <select
                  value={selectedHistoryShiftId}
                  onChange={(event) => setSelectedHistoryShiftId(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:border-slate-500 focus:outline-none"
                >
                  {historyShifts.map((shift) => {
                    const start = new Date(shift.started_at).toLocaleString("es-CO", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const end = shift.ended_at
                      ? new Date(shift.ended_at).toLocaleString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--";
                    return (
                      <option key={shift.shift_id} value={shift.shift_id}>
                        {`${start} - ${end}`}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          )}
        </div>

        {!targetShiftId ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            {isHistoryMode
              ? "Selecciona un turno cerrado para ver su minuta."
              : "No hay turno activo. Abre turno para ver y registrar novedades."}
          </p>
        ) : loadingInitial ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Cargando bitacora...
          </p>
        ) : (
          <LogTimeline
            logs={logs}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={() => {
              if (nextCursor) {
                loadLogs(nextCursor);
              }
            }}
            onCorrection={isHistoryMode ? () => undefined : openCorrectionModal}
          />
        )}
      </div>

      <button
        onClick={openNewLogModal}
        disabled={!activeShift || isHistoryMode}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-4 text-base font-black text-white shadow-2xl transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        <span className="text-xl">＋</span>
        Nuevo Registro
      </button>

      <NewLogModal
        isOpen={isModalOpen}
        isSubmitting={isSavingLog}
        defaultCategory={defaultCategory}
        referenceLogId={referenceLogId}
        onClose={() => {
          setIsModalOpen(false);
          setReferenceLogId(null);
        }}
        onSubmit={handleCreateLog}
      />
    </section>
  );
}
