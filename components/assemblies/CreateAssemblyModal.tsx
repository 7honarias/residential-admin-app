"use client";

import { useState } from "react";
import { X, Calendar, Clock, Type, Loader2 } from "lucide-react";

interface CreateAssemblyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; scheduled_for: string }) => void;
  isProcessing: boolean;
}

export default function CreateAssemblyModal({ isOpen, onClose, onSubmit, isProcessing }: CreateAssemblyModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combinamos la fecha (YYYY-MM-DD) y la hora (HH:mm) en un formato ISO válido
    // Esto asegura que respete la zona horaria local (Colombia) al enviarlo a la BD
    const dateTimeString = `${date}T${time}:00`;
    const scheduled_for = new Date(dateTimeString).toISOString();

    onSubmit({ title, scheduled_for });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Programar Asamblea
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" /> Título de la Asamblea
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Asamblea General Ordinaria 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Fecha
              </label>
              <input
                type="date"
                required
                value={date}
                // No permitimos fechas en el pasado
                min={new Date().toISOString().split("T")[0]} 
                onChange={(e) => setDate(e.target.value)}
                disabled={isProcessing}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Hora
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isProcessing}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={!title || !date || !time || isProcessing}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isProcessing ? "Guardando..." : "Crear Asamblea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}