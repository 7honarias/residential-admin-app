/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { X, Loader, PlusCircle, Trash2, ChevronRight } from "lucide-react";
import { Amenity, Schedule } from "@/app/dashboard/amenities/amenitie.tyes";

// 24h <-> 12h helpers
const parseTo12h = (t: string): { hour: number; minute: number; period: "AM" | "PM" } => {
  if (!t) return { hour: 12, minute: 0, period: "AM" };
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { hour: h, minute: m, period };
};

const formatTo24h = (hour: number, minute: number, period: "AM" | "PM"): string => {
  let h = hour;
  if (period === "AM" && h === 12) h = 0;
  else if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const DAYS = [
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

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
  const [schedules, setSchedules] = useState<Schedule[]>([]);

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
      setSchedules(amenity.amenity_schedules ? [...amenity.amenity_schedules] : []);
    }
  }, [amenity, amenity?.id, isOpen]);

  const addSchedule = (day: number) => {
    setSchedules((prev) => [...prev, { day_of_week: day, start_time: "08:00", end_time: "20:00" }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: keyof Schedule, value: string | number) => {
    setSchedules((prev) => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
  };

  const validateSchedules = (): string | null => {
    const grouped: Record<number, Schedule[]> = {};
    for (const s of schedules) {
      if (!s.start_time || !s.end_time) return "Todos los bloques deben tener hora de inicio y fin.";
      if (s.start_time >= s.end_time) return "La hora de inicio debe ser menor a la de fin.";
      if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
      grouped[s.day_of_week].push(s);
    }
    for (const day in grouped) {
      const blocks = [...grouped[day]].sort((a, b) => a.start_time.localeCompare(b.start_time));
      for (let i = 0; i < blocks.length - 1; i++) {
        if (blocks[i].end_time > blocks[i + 1].start_time) {
          const dayLabel = DAYS.find((d) => d.value === Number(day))?.label;
          return `Existen horarios solapados el día ${dayLabel}.`;
        }
      }
    }
    return null;
  };

  // Calcula en tiempo real qué índices tienen solapamiento para marcarlos visualmente
  const overlappingIndices = (() => {
    const result = new Set<number>();
    const grouped: Record<number, number[]> = {};
    schedules.forEach((s, i) => {
      if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
      grouped[s.day_of_week].push(i);
    });
    for (const idxList of Object.values(grouped)) {
      for (let a = 0; a < idxList.length; a++) {
        for (let b = a + 1; b < idxList.length; b++) {
          const sa = schedules[idxList[a]];
          const sb = schedules[idxList[b]];
          if (sa.start_time && sa.end_time && sb.start_time && sb.end_time) {
            const overlap = sa.start_time < sb.end_time && sb.start_time < sa.end_time;
            if (overlap) {
              result.add(idxList[a]);
              result.add(idxList[b]);
            }
          }
        }
      }
    }
    return result;
  })();

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

    const scheduleError = validateSchedules();
    if (scheduleError) {
      setError(scheduleError);
      return;
    }

    setLoading(true);
    try {
      const updatedAmenity: Amenity = {
        ...amenity!,
        name: formData.name,
        description: formData.description,
        capacity: formData.capacity,
        price: formData.price,
        slot_duration: formData.slot_duration,
        max_slots_per_reservation: formData.max_slots_per_reservation,
        amenity_schedules: schedules,
      };
      await onSave(updatedAmenity);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar los cambios");
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

          {/* Disponibilidad Semanal */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Disponibilidad Semanal</h3>
            <div className="grid grid-cols-2 gap-3">
              {DAYS.map((day) => {
                const daySchedules = schedules.filter((s) => s.day_of_week === day.value);
                return (
                  <div
                    key={day.value}
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-600 uppercase tracking-tight">
                        {day.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => addSchedule(day.value)}
                        disabled={loading || isProcessing}
                        className="p-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all disabled:opacity-40"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {daySchedules.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-1">Cerrado</p>
                    ) : (
                      daySchedules.map((s) => {
                        const realIndex = schedules.findIndex((item) => item === s);
                        const isOverlapping = overlappingIndices.has(realIndex);
                        const st = parseTo12h(s.start_time);
                        const et = parseTo12h(s.end_time);
                        const sel = `bg-transparent outline-none cursor-pointer appearance-none text-center text-[10px] font-bold disabled:opacity-50`;
                        const tc = isOverlapping ? "text-red-600" : "text-slate-700";
                        const ac = isOverlapping ? "text-red-600" : "text-blue-500";
                        return (
                          <div key={realIndex} className="flex items-center gap-1">
                            <div className={`flex bg-white rounded-lg p-1.5 items-center border flex-1 justify-between ${
                              isOverlapping ? "border-red-400 bg-red-50" : "border-slate-200"
                            }`}>
                              {/* Inicio */}
                              <div className="flex items-center gap-px">
                                <select
                                  value={st.hour}
                                  onChange={(e) => updateSchedule(realIndex, "start_time", formatTo24h(+e.target.value, st.minute, st.period))}
                                  disabled={loading || isProcessing}
                                  className={`${sel} ${tc} w-5`}
                                >
                                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <span className={`text-[10px] font-bold ${tc}`}>:</span>
                                <select
                                  value={st.minute}
                                  onChange={(e) => updateSchedule(realIndex, "start_time", formatTo24h(st.hour, +e.target.value, st.period))}
                                  disabled={loading || isProcessing}
                                  className={`${sel} ${tc} w-6`}
                                >
                                  {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
                                </select>
                                <select
                                  value={st.period}
                                  onChange={(e) => updateSchedule(realIndex, "start_time", formatTo24h(st.hour, st.minute, e.target.value as "AM"|"PM"))}
                                  disabled={loading || isProcessing}
                                  className={`${sel} ${ac} font-black w-7`}
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                              <ChevronRight className={`w-3 h-3 flex-shrink-0 ${isOverlapping ? "text-red-300" : "text-slate-300"}`} />
                              {/* Fin */}
                              <div className="flex items-center gap-px">
                                <select
                                  value={et.hour}
                                  onChange={(e) => updateSchedule(realIndex, "end_time", formatTo24h(+e.target.value, et.minute, et.period))}
                                  disabled={loading || isProcessing}
                                  className={`${sel} ${tc} w-5`}
                                >
                                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <span className={`text-[10px] font-bold ${tc}`}>:</span>
                                <select
                                  value={et.minute}
                                  onChange={(e) => updateSchedule(realIndex, "end_time", formatTo24h(et.hour, +e.target.value, et.period))}
                                  disabled={loading || isProcessing}
                                  className={`${sel} ${tc} w-6`}
                                >
                                  {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
                                </select>
                                <select
                                  value={et.period}
                                  onChange={(e) => updateSchedule(realIndex, "end_time", formatTo24h(et.hour, et.minute, e.target.value as "AM"|"PM"))}
                                  disabled={loading || isProcessing}
                                  className={`${sel} ${ac} font-black w-7`}
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSchedule(realIndex)}
                              disabled={loading || isProcessing}
                              className="p-1 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
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
              disabled={loading || isProcessing || overlappingIndices.size > 0}
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
