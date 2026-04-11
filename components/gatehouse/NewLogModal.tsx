"use client";

import { useEffect, useMemo, useState } from "react";
import { LogCategory } from "@/services/gatehouseLogbook.service";

interface NewLogModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  defaultCategory?: LogCategory;
  referenceLogId?: string | null;
  onClose: () => void;
  onSubmit: (params: {
    category: LogCategory;
    content: string;
    reference_log_id?: string | null;
    files: File[];
  }) => Promise<void>;
}

const categoryButtons: Array<{ value: LogCategory; label: string; icon: string; style: string }> = [
  { value: "ROUTINE", label: "Ronda", icon: "🔵", style: "bg-blue-50 border-blue-200 text-blue-800" },
  { value: "PACKAGE", label: "Paquete", icon: "📦", style: "bg-violet-50 border-violet-200 text-violet-800" },
  { value: "INCIDENT", label: "Incidente", icon: "🚨", style: "bg-red-50 border-red-200 text-red-800" },
  { value: "OTHER", label: "Otro", icon: "📝", style: "bg-slate-50 border-slate-300 text-slate-800" },
  { value: "CORRECTION", label: "Correccion", icon: "✏️", style: "bg-amber-50 border-amber-200 text-amber-800" },
];

export function NewLogModal({
  isOpen,
  isSubmitting,
  defaultCategory = "ROUTINE",
  referenceLogId,
  onClose,
  onSubmit,
}: NewLogModalProps) {
  const [category, setCategory] = useState<LogCategory>(defaultCategory);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCategory(defaultCategory);
    setContent("");
    setFiles([]);
    setError(null);
  }, [isOpen, defaultCategory, referenceLogId]);

  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!content.trim()) {
      setError("Escribe la novedad para continuar.");
      return;
    }

    setError(null);

    try {
      await onSubmit({
        category,
        content: content.trim(),
        reference_log_id: category === "CORRECTION" ? referenceLogId || null : null,
        files,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible guardar el registro.");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 p-3 md:items-center md:p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl md:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Nuevo Registro</h3>
            <p className="text-sm text-slate-600">Usa acciones rapidas para registrar novedades sin escribir de mas.</p>
            {referenceLogId && (
              <p className="mt-1 text-xs font-semibold text-amber-700">Correccion enlazada al registro: {referenceLogId}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {categoryButtons.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={`rounded-2xl border px-3 py-4 text-center text-sm font-extrabold transition ${item.style} ${
                category === item.value ? "ring-2 ring-slate-900/20" : "opacity-80 hover:opacity-100"
              }`}
            >
              <span className="block text-2xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-bold text-slate-700">Descripcion del registro</label>
          <textarea
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Describe la novedad..."
            className="w-full rounded-2xl border-2 border-slate-300 px-4 py-3 text-base text-slate-800 outline-none transition focus:border-indigo-500"
          />
        </div>

        <div className="mt-4">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
            <span>📷 Adjuntar Foto</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
                const MAX_MB = 5 * 1024 * 1024;
                const selectedFiles = Array.from(event.target.files || []).filter((f) => {
                  if (!ALLOWED.has(f.type)) {
                    setError(`Tipo no permitido: ${f.name}. Solo JPEG, PNG o WebP.`);
                    return false;
                  }
                  if (f.size > MAX_MB) {
                    setError(`'${f.name}' supera el límite de 5 MB.`);
                    return false;
                  }
                  return true;
                });
                setFiles((prev) => [...prev, ...selectedFiles].slice(0, 4));
                event.target.value = "";
              }}
            />
          </label>

          {previewUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {previewUrls.map((url) => (
                <img key={url} src={url} alt="Preview" className="h-14 w-14 rounded-lg border border-slate-200 object-cover" />
              ))}
            </div>
          )}
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 w-full rounded-2xl bg-indigo-600 px-5 py-4 text-lg font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Guardando..." : "Guardar Registro"}
        </button>
      </form>
    </div>
  );
}
