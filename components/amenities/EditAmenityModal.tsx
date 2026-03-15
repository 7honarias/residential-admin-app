"use client";

import { useEffect, useState } from "react";
import { X, Loader } from "lucide-react";
import { Amenity } from "@/app/dashboard/amenities/amenitie.tyes";

interface EditAmenityModalProps {
  isOpen: boolean;
  onClose: () => void;
  amenity: Amenity | null;
  onSave: (amenity: Amenity) => Promise<void>;
  isProcessing: boolean;
}

interface FormData {
  name: string;
  description: string;
  capacity: number;
  price: number;
  slot_duration: number;
  max_slots_per_reservation: number;
}

export default function EditAmenityModal({
  isOpen,
  onClose,
  amenity,
  onSave,
  isProcessing,
}: EditAmenityModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    capacity: 0,
    price: 0,
    slot_duration: 0,
    max_slots_per_reservation: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar formData cuando amenity cambia
  useEffect(() => {
    if (amenity) {
      const newFormData: FormData = {
        name: String(amenity.name || ""),
        description: String(amenity.description || ""),
        capacity: Number(amenity.capacity) || 0,
        price: Number(amenity.price) || 0,
        slot_duration: Number(amenity.slot_duration) || 0,
        max_slots_per_reservation: Number(amenity.max_slots_per_reservation) || 0,
      };
      setFormData(newFormData);
      console.log("FormData inicializado:", newFormData);
    }
  }, [amenity, amenity.id, isOpen]); // Cambié la dependencia para que sea más específica

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.currentTarget;
    
    setFormData((prev) => {
      let newValue: any = value;

      // Convertir a número los campos numéricos
      if (name === "capacity" || name === "slot_duration" || name === "max_slots_per_reservation") {
        newValue = value === "" ? 0 : Math.max(1, parseInt(value, 10));
        console.log(`${name} changed:`, value, "->", newValue);
      } else if (name === "price") {
        newValue = value === "" ? 0 : Math.max(0, parseFloat(value));
        console.log(`${name} changed:`, value, "->", newValue);
      }

      const updated = { ...prev, [name]: newValue };
      console.log("FormData actualizado:", updated);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("Enviando formData:", formData);
      
      const updatedAmenity: Amenity = {
        id: amenity?.id || "",
        name: formData.name,
        description: formData.description,
        capacity: formData.capacity,
        price: formData.price,
        slot_duration: formData.slot_duration,
        max_slots_per_reservation: formData.max_slots_per_reservation,
      } as Amenity;

      console.log("UpdatedAmenity a guardar:", updatedAmenity);
      
      await onSave(updatedAmenity);
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al guardar los cambios";
      setError(errorMessage);
      console.error("Error al guardar:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !amenity) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 id="modal-title" className="text-xl font-bold text-slate-800">
            Editar Configuración de {amenity?.name}
          </h2>
          <button
            onClick={onClose}
            disabled={loading || isProcessing}
            aria-label="Cerrar modal"
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div
              className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-bold text-slate-700">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading || isProcessing}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-bold text-slate-700">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={loading || isProcessing}
              rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
            />
          </div>

          {/* Grid de campos numéricos */}
          <div className="grid grid-cols-2 gap-4">
            {/* Capacidad */}
            <div className="space-y-2">
              <label htmlFor="capacity" className="block text-sm font-bold text-slate-700">
                Aforo (personas)
              </label>
              <input
                id="capacity"
                type="number"
                name="capacity"
                min="1"
                value={formData.capacity}
                onChange={handleChange}
                disabled={loading || isProcessing}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              />
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <label htmlFor="price" className="block text-sm font-bold text-slate-700">
                Precio ($)
              </label>
              <input
                id="price"
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                disabled={loading || isProcessing}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Grid de duraciones */}
          <div className="grid grid-cols-2 gap-4">
            {/* Duración del turno */}
            <div className="space-y-2">
              <label htmlFor="slot_duration" className="block text-sm font-bold text-slate-700">
                Duración del turno (min)
              </label>
              <input
                id="slot_duration"
                type="number"
                name="slot_duration"
                min="1"
                value={formData.slot_duration}
                onChange={handleChange}
                disabled={loading || isProcessing}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              />
            </div>

            {/* Máximo de turnos por reserva */}
            <div className="space-y-2">
              <label htmlFor="max_slots_per_reservation" className="block text-sm font-bold text-slate-700">
                Máx. turnos por reserva
              </label>
              <input
                id="max_slots_per_reservation"
                type="number"
                name="max_slots_per_reservation"
                min="1"
                value={formData.max_slots_per_reservation}
                onChange={handleChange}
                disabled={loading || isProcessing}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || isProcessing}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || isProcessing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
