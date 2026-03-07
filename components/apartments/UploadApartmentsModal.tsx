"use client";

import { useState } from "react";
import { X, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { bulkUploadApartments } from "@/services/apartments.service";
import { useAppSelector } from "@/store/hooks";
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadApartmentsModal({ isOpen, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    msg: string;
  }>({ type: null, msg: "" });
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus({ type: null, msg: "" });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setStatus({ type: null, msg: "" });

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = (err) => reject(err);
      });

      if (!activeComplex?.id) {
        throw new Error("No hay un conjunto seleccionado.");
      }

      const data = await bulkUploadApartments(base64, activeComplex.id);
      setStatus({
        type: "success",
        msg: data.message || "Carga completada con éxito.",
      });

      setTimeout(() => {
        onClose();
        setFile(null);
        setStatus({ type: null, msg: "" });
      }, 2000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setStatus({
        type: "error",
        msg: err.message || "Error de conexión con el servidor.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-slate-800">Cargar Unidades</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6">
            Selecciona un archivo Excel (.xlsx) con la estructura de torres y
            apartamentos.
          </p>

          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <>
                  <FileText className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    {file.name}
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">
                    Click para buscar archivo
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </label>

          {status.msg && (
            <div
              className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                status.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {status.msg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Procesando..." : "Subir Archivo"}
          </button>
        </div>
      </div>
    </div>
  );
}
