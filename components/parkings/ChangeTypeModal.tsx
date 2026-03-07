"use client";

import { useState, } from "react";
import { X, Tag } from "lucide-react";

interface ChangeTypeModalProps {
  onClose: () => void;
  onSave: (newType: string) => void;
  isProcessing: boolean;
  currentType: string;
}

const PARKING_TYPES = [
  { value: "RESIDENT", label: "Residente" },
  { value: "VISITOR", label: "Visitante" },
  { value: "SERVICE", label: "Servicio" },
  { value: "DISABLED", label: "Discapacitado" },
];

export default function ChangeTypeModal({ onClose, onSave, isProcessing, currentType }: ChangeTypeModalProps) {
  const [selectedType, setSelectedType] = useState(currentType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType && selectedType !== currentType) {
      onSave(selectedType);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" /> Cambiar Tipo
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nuevo tipo de parqueadero</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
            >
              {PARKING_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isProcessing || selectedType === currentType}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 shadow-md transition-all"
            >
              {isProcessing ? "Guardando..." : "Actualizar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}