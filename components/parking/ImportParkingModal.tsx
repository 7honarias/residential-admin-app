"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, X } from "lucide-react";

export default function ImportParkingModal({
  open, onClose, onImport,
}: {
  open: boolean;
  onClose: () => void;
  // Ahora onImport espera el array para enviarlo como JSON en el body de la petición
  onImport: (rows: any[]) => void; 
}) {
  const [parsedRows, setParsedRows] = useState<any[] | null>(null);

  if (!open) return null;

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convertimos a JSON. defval: "" asegura que las celdas vacías no devuelvan undefined
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    setParsedRows(rows as any[]);
  };

  const handleImport = () => {
    if (!parsedRows) return;

    // Limpiamos la data (quitamos espacios en blanco accidentales del Excel)
    const mapped = parsedRows.map(row => ({
      parking_number: String(row.parking_number || "").trim(),
      parking_type: String(row.parking_type || "").trim(),
      vehicle_allowed: String(row.vehicle_allowed || "").trim(),
      apartment_number: String(row.apartment_number || "").trim(),
      block_name: String(row.block_name || "").trim(),
      vehicle_plate: String(row.vehicle_plate || "").trim(),
      vehicle_brand: String(row.vehicle_brand || "").trim(),
      vehicle_model: String(row.vehicle_model || "").trim(),
      vehicle_color: String(row.vehicle_color || "").trim(),
    })).filter(row => row.parking_number !== ""); // Filtramos filas totalmente vacías

    onImport(mapped);
    setParsedRows(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600" /> 
            Carga Masiva de Parqueaderos
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors">
            <label className="cursor-pointer block">
              <span className="block text-sm font-bold text-slate-700 mb-1">Seleccionar archivo Excel</span>
              <span className="block text-xs text-slate-400 mb-4">Soporta .xlsx, .xls y .csv</span>
              <input
                type="file"
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mx-auto"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {parsedRows && (
            <div className="animate-in fade-in">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Previsualización ({parsedRows.length} registros)</p>
              <div className="max-h-48 overflow-auto border border-slate-100 rounded-xl bg-slate-50">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-100/50 sticky top-0">
                    <tr>
                      {Object.keys(parsedRows[0]).slice(0, 6).map((k) => (
                        <th key={k} className="px-3 py-2 text-[10px] font-black uppercase text-slate-400">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="hover:bg-white transition-colors">
                        {Object.values(r).slice(0, 6).map((v, j) => (
                          <td key={j} className="px-3 py-2 text-xs font-medium text-slate-600">{String(v) || <span className="text-slate-300">-</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!parsedRows}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 shadow-md transition-all"
            >
              Procesar {parsedRows?.length || 0} Registros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}