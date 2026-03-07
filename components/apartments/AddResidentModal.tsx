"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react"; // Importamos AlertCircle para errores
import {
  Resident,
  ResidentForm,
} from "@/app/dashboard/apartments/apartment.types";

interface addResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentId: string | null;
  onSave: (resident: Resident) => Promise<void>;
}

export default function AddResidentModal({
  isOpen,
  onClose,
  apartmentId,
  onSave,
}: addResidentModalProps) {
  const [form, setForm] = useState<ResidentForm>({
    fullName: "",
    email: "",
    confirmEmail: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      fullName: "",
      email: "",
      confirmEmail: "",
      phone: "",
    });

    setError(null);
  }, [isOpen]);

  if (!isOpen || !apartmentId) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null); // Limpiar error al escribir
  };

  const handleSubmit = async () => {
    if (form.email !== form.confirmEmail) {
      setError("Los correos electrónicos no coinciden");
      return;
    }

    try {
      setLoading(true);
      await onSave(form as Resident);
      onClose();
    } catch (error) {
      console.error("Error saving resident", error);
      setError("Hubo un error al guardar los datos");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-800">
            {"Asignar residente"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm bg-red-50 text-red-600 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-600">
              Nombre completo
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <input
              type="email"
              name="email"
              value={form.email ?? ""}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">
              Confirmar Email
            </label>
            <input
              type="email"
              name="confirmEmail" // 👈 Corregido: ahora coincide con el estado
              value={form.confirmEmail ?? ""}
              onChange={handleChange}
              placeholder="Repite el correo"
              className={`w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                form.confirmEmail && form.email !== form.confirmEmail
                  ? "border-red-300 focus:ring-red-500"
                  : "border-slate-200 focus:ring-blue-500"
              }`}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">
              Teléfono
            </label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Ej: 300 123 4567"
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              (!!form.confirmEmail && form.email !== form.confirmEmail)
            }
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
