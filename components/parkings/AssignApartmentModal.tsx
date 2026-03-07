/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Building, Loader2 } from "lucide-react";
import { fetchApartments } from "@/services/apartments.service";

// Importa tu servicio real aquí
// import { fetchApartments } from "@/services/apartment.service"; 

interface AssignApartmentModalProps {
  onClose: () => void;
  onAssign: (apartmentId: string) => void;
  isProcessing: boolean;
  token: string;
  complexId: string;
}

export default function AssignApartmentModal({ 
  onClose, 
  onAssign, 
  isProcessing,
  token,
  complexId 
}: AssignApartmentModalProps) {
  
  // Listas de datos desde la API
  const [blocks, setBlocks] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);

  // Selecciones actuales
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [selectedAptId, setSelectedAptId] = useState("");

  // Estados de carga (Spinners)
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);
  const [isLoadingApts, setIsLoadingApts] = useState(false);

  // 1. Cargar las Torres/Bloques al abrir el modal
  useEffect(() => {
    const loadBlocks = async () => {
      try {
        setIsLoadingBlocks(true);
        setApartments([]); 
        setSelectedAptId("");
        const apartments = await fetchApartments({ token, complexId, blockId: selectedBlockId });
        setBlocks(apartments.blocks);
        setApartments(apartments.apartments);
        setIsLoadingBlocks(false);
        setIsLoadingApts(false);
        

      } catch (error) {
        console.error("Error cargando bloques", error);
        setIsLoadingBlocks(false);
      }
    };

    loadBlocks();
  }, [token, complexId, selectedBlockId]);

  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAptId) {
      onAssign(selectedAptId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" /> Vincular Apartamento
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* PASO 1: SELECCIONAR TORRE */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              1. Selecciona la Torre/Bloque
            </label>
            <div className="relative">
              <select
                value={selectedBlockId}
                onChange={(e) => setSelectedBlockId(e.target.value)}
                disabled={isLoadingBlocks || isProcessing}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60 appearance-none"
              >
                <option value="" disabled>-- Elige una torre --</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
              </select>
              {isLoadingBlocks && (
                <Loader2 className="absolute right-3 top-3 w-5 h-5 text-indigo-500 animate-spin" />
              )}
            </div>
          </div>

          {/* PASO 2: SELECCIONAR APARTAMENTO */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              2. Selecciona el Apartamento
            </label>
            <div className="relative">
              <select
                value={selectedAptId}
                onChange={(e) => setSelectedAptId(e.target.value)}
                required
                disabled={!selectedBlockId || isLoadingApts || isProcessing}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60 appearance-none"
              >
                <option value="" disabled>
                  {!selectedBlockId 
                    ? "Primero elige una torre arriba" 
                    : "-- Elige un apartamento disponible --"}
                </option>
                {apartments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    Apto {apt.number}
                  </option>
                ))}
              </select>
              {isLoadingApts && (
                <Loader2 className="absolute right-3 top-3 w-5 h-5 text-indigo-500 animate-spin" />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={!selectedAptId || isProcessing}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isProcessing ? "Asignando..." : "Asignar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}