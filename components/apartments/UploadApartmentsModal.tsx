"use client";

import { useState } from "react";
import { X, Building2, Eye, Trash2, CheckCircle2, Loader2, LayoutGrid } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { supabase } from "@/lib/supabaseClient";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type NamingConvention = "NUMERIC" | "ALPHANUMERIC";

interface ApartmentPreview {
  id: string;
  block_name: string;
  number: string;
  floor: number;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AptCard({
  apt,
  onRemove,
}: {
  apt: ApartmentPreview;
  onRemove: () => void;
}) {
  return (
    <div className="group relative flex items-center justify-center h-12 bg-blue-50 border border-blue-100 rounded-lg text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
      {apt.number}
      <button
        onClick={onRemove}
        title="Eliminar unidad"
        className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center w-5 h-5 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UploadApartmentsModal({ isOpen, onClose }: Props) {
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);

  const [blockName, setBlockName] = useState("");
  const [floors, setFloors] = useState<number>(5);
  const [unitsPerFloor, setUnitsPerFloor] = useState<number>(4);
  const [namingConvention, setNamingConvention] =
    useState<NamingConvention>("NUMERIC");
  const [previewApartments, setPreviewApartments] = useState<
    ApartmentPreview[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  if (!isOpen) return null;

  // ── Generate preview ──────────────────────────────────────────────────────

  const handleGeneratePreview = () => {
    if (!blockName.trim()) return;

    const result: ApartmentPreview[] = [];

    for (let floor = 1; floor <= floors; floor++) {
      for (let unit = 1; unit <= unitsPerFloor; unit++) {
        const number =
          namingConvention === "NUMERIC"
            ? String(floor * 100 + unit)
            : `${floor}${String.fromCharCode(64 + unit)}`;

        result.push({
          id: `${floor}-${unit}-${Date.now()}`,
          block_name: blockName.trim(),
          number,
          floor,
        });
      }
    }

    setPreviewApartments(result);
    setSaveStatus("idle");
  };

  // ── Remove single unit ────────────────────────────────────────────────────

  const handleRemoveApartment = (index: number) => {
    setPreviewApartments((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Save block ────────────────────────────────────────────────────────────

  const handleSaveBlock = async () => {
    if (!activeComplex?.id || previewApartments.length === 0) return;

    setIsLoading(true);
    setSaveStatus("idle");

    try {
      const payload = previewApartments.map(({ block_name, number, floor }) => ({
        block_name,
        number,
        floor,
      }));

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data, error } = await supabase.rpc("bulk_create_apartments", {
        p_complex_id: activeComplex.id,
        p_apartments_data: payload,
      });

      if (error) throw error;

      setSaveStatus("success");
      setTimeout(() => {
        onClose();
        setPreviewApartments([]);
        setBlockName("");
        setSaveStatus("idle");
      }, 1800);
    } catch {
      setSaveStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* ── Header ── */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Constructor de Bloques
              </h2>
              <p className="text-xs text-slate-500">
                Genera los apartamentos sin necesidad de Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-full transition"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* ── Two-column body ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* ──────────── LEFT: Form ──────────── */}
          <div className="p-6 space-y-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                1
              </span>
              Configuración del Bloque
            </h3>

            {/* Block name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Nombre del Bloque / Torre
              </label>
              <input
                type="text"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                placeholder="Ej: Torre A, Bloque 1"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Floors & units */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Número de Pisos
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={floors}
                  onChange={(e) =>
                    setFloors(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Unidades por Piso
                </label>
                <input
                  type="number"
                  min={1}
                  max={26}
                  value={unitsPerFloor}
                  onChange={(e) =>
                    setUnitsPerFloor(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Naming convention */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Nomenclatura de Apartamentos
              </label>
              <select
                value={namingConvention}
                onChange={(e) =>
                  setNamingConvention(e.target.value as NamingConvention)
                }
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              >
                <option value="NUMERIC">Numérica — 101, 102, 201…</option>
                <option value="ALPHANUMERIC">Alfanumérica — 1A, 1B, 2A…</option>
              </select>
            </div>

            {/* Info pill */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Se generarán{" "}
                <strong>
                  {floors * unitsPerFloor} apartamento
                  {floors * unitsPerFloor !== 1 ? "s" : ""}
                </strong>{" "}
                en {floors} piso{floors !== 1 ? "s" : ""} con {unitsPerFloor}{" "}
                unidad{unitsPerFloor !== 1 ? "es" : ""} por piso.
              </span>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGeneratePreview}
              disabled={!blockName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <LayoutGrid className="w-4 h-4" />
              Generar Vista Previa
            </button>
          </div>

          {/* ──────────── RIGHT: Preview ──────────── */}
          <div className="p-6 flex flex-col gap-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
              <span className="w-5 h-5 bg-emerald-600 text-white rounded-full text-xs flex items-center justify-center">
                2
              </span>
              Vista Previa Interactiva
            </h3>

            {previewApartments.length === 0 ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="p-4 bg-slate-100 rounded-full">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Sin vista previa
                </p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Llena el formulario y presiona{" "}
                  <strong>Generar Vista Previa</strong> para ver los
                  apartamentos antes de guardarlos.
                </p>
              </div>
            ) : (
              <>
                {/* Counter */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Total:{" "}
                    <span className="font-bold text-slate-800">
                      {previewApartments.length}
                    </span>{" "}
                    apartamento{previewApartments.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" />
                    Hover para eliminar
                  </p>
                </div>

                {/* Grid of cards */}
                <div className="flex-1 overflow-y-auto max-h-72 pr-1">
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {previewApartments.map((apt, index) => (
                      <AptCard
                        key={apt.id}
                        apt={apt}
                        onRemove={() => handleRemoveApartment(index)}
                      />
                    ))}
                  </div>
                </div>

                {/* Save status feedback */}
                {saveStatus === "success" && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Bloque guardado correctamente. Cerrando…
                  </div>
                )}
                {saveStatus === "error" && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                    <X className="w-4 h-4 flex-shrink-0" />
                    Error al guardar. Verifica la conexión e intenta de nuevo.
                  </div>
                )}

                {/* Save button */}
                <button
                  onClick={handleSaveBlock}
                  disabled={isLoading || saveStatus === "success"}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Guardar Bloque en Base de Datos
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
