"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import AmenityForm from "./AmenityForm"; // Tu formulario actual
import { useAppSelector } from "@/store/hooks";
import type { AmenityFormData } from "@/app/dashboard/amenities/amenitie.tyes";
import type { Schedule } from "@/app/dashboard/amenities/amenitie.tyes"; // Adjust import path as needed

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Para refrescar la lista tras crear
  amenityId?: string;     // Si viene, es edición
  defaultValues?: AmenityFormData & { schedules?: Schedule[] };    // Datos previos si es edición
}

export default function CreateAmenityModal({ isOpen, onClose, onSuccess, amenityId, defaultValues }: Props) {
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const token = useAppSelector((state) => state.auth.token);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay: Fondo oscuro */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
      />

      {/* Contenedor del Modal */}
      <div className="relative bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        
        {/* Header fijo del Modal */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {amenityId ? "Editar Espacio" : "Nuevo Espacio Común"}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Tu Formulario */}
        <div className="p-2">
          <AmenityForm 
            complexId={activeComplex?.id || ""}
            token={token || ""}
            amenityId={amenityId}
            defaultValues={defaultValues}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}