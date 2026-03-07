/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { X, Car } from "lucide-react";

// Ya no necesitamos 'isOpen' aquí, el componente padre controlará si existimos o no
interface VehicleModalProps {
  onClose: () => void;
  onSave: (vehicleData: any) => void;
  isProcessing: boolean;
  initialData?: any; 
}

export default function VehicleModal({ onClose, onSave, isProcessing, initialData }: VehicleModalProps) {
  // Tomamos los datos INMEDIATAMENTE al construir el componente.
  // Como el componente se destruirá al cerrarse, siempre tendrá datos frescos al abrirse.
  const [plate, setPlate] = useState(initialData?.currentPlate || "");
  const [brand, setBrand] = useState(initialData?.vehicleBrand || "");
  const [model, setModel] = useState(initialData?.vehicleModel || "");
  const [color, setColor] = useState(initialData?.vehicleColor || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      plate: plate.toUpperCase(),
      brand,
      model,
      color
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Car className="w-5 h-5 text-indigo-600" /> 
            {initialData ? "Editar Vehículo" : "Registrar Vehículo"}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Placa *</label>
            <input
              type="text"
              required
              placeholder="Ej: ABC-123"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              disabled={!!initialData} // No editar placa si ya existe
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Marca</label>
              <input
                type="text"
                placeholder="Ej: Mazda"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Modelo</label>
              <input
                type="text"
                placeholder="Ej: CX-5"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Color</label>
            <input
              type="text"
              placeholder="Ej: Rojo"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={!plate || isProcessing}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 shadow-md transition-all"
            >
              {isProcessing ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
