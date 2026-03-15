/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Clock,
  Trash2,
  PlusCircle,
  Info,
  DollarSign,
  Users,
  Save,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { upsertAmenity } from "@/services/amenities.service";
import {
  AmenityFormData,
  AmenityFormProps,
  Schedule,
} from "@/app/dashboard/amenities/amenitie.tyes";

const days = [
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

export default function AmenityForm({
  complexId,
  token,
  amenityId,
  defaultValues,
  onFinished,
  onSuccess,
}: AmenityFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AmenityFormData>({
    defaultValues: defaultValues || {
      name: "",
      description: "",
      capacity: 1,
      booking_mode: "TIME_SLOT",
      pricing_type: "FREE",
      slot_duration: 60,
      price: 0,
      max_slots_per_reservation: 1,
      requires_approval: false,
      is_active: true,
    },
  });

  const [schedules, setSchedules] = useState<Schedule[]>(defaultValues?.schedules || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pricingType = watch("pricing_type");
  const bookingMode = watch("booking_mode");

  // --- Lógica de Horarios ---
  const addSchedule = (day: number) => {
    setSchedules([...schedules, { day_of_week: day, start_time: "08:00", end_time: "20:00" }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: keyof Schedule, value: string | number) => {
    const updated = [...schedules];
    (updated[index] as any)[field] = value;
    setSchedules(updated);
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
          const dayLabel = days.find((d) => d.value === Number(day))?.label;
          return `Existen horarios solapados el día ${dayLabel}.`;
        }
      }
    }
    return null;
  };

  const onSubmit = async (data: AmenityFormData) => {
    setError("");
    const scheduleError = validateSchedules();
    if (scheduleError) {
      setError(scheduleError);
      return;
    }

    try {
      setLoading(true);
      
      // Asegurar que los valores numéricos se envíen correctamente
      const payload = {
        ...data,
        capacity: parseInt(String(data.capacity), 10),
        price: parseFloat(String(data.price)) || 0,
        slot_duration: parseInt(String(data.slot_duration), 10),
        max_slots_per_reservation: parseInt(String(data.max_slots_per_reservation), 10),
        schedules,
      };

      await upsertAmenity(token, complexId, payload, amenityId);
      if (onSuccess) onSuccess();
      if (onFinished) onFinished();
    } catch (err: any) {
      setError(err.message || "Error al guardar la amenity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-8 pb-20">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* SECCIÓN 1: IDENTIDAD */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
            <div className="p-2 bg-blue-500 rounded-lg text-white">
                <Info className="w-4 h-4" />
            </div>
          <h3 className="font-bold text-slate-800">Identidad del Espacio</h3>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nombre de la Amenity</label>
            <input
              {...register("name", { required: true })}
              className="w-full px-4 py-3 bg-slate-50 border-transparent border focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-700"
              placeholder="Ej: Piscina Olímpica, Salón de Eventos..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Descripción y Normas</label>
            <textarea
              {...register("description")}
              className="w-full px-4 py-3 bg-slate-50 border-transparent border focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all min-h-[100px] text-slate-600 text-sm"
              placeholder="Describe las reglas de uso..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> Aforo Máximo
            </label>
            <input
              type="number"
              min="1"
              step="1"
              {...register("capacity", { valueAsNumber: true, min: 1 })}
              className="w-full px-4 py-3 bg-slate-50 border-transparent border focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Modo de Operación</label>
            <select
              {...register("booking_mode")}
              className="w-full px-4 py-3 bg-slate-50 border-transparent border focus:border-blue-500 focus:bg-white rounded-2xl outline-none appearance-none font-medium text-slate-700 cursor-pointer"
            >
              <option value="TIME_SLOT">Por Franjas Horarias</option>
              <option value="FULL_DAY">Día Completo</option>
              <option value="MULTI_USER">Uso Comunitario</option>
            </select>
          </div>
        </div>

        {/* Configuración Dinámica de Slots */}
        {bookingMode === "TIME_SLOT" && (
          <div className="p-6 bg-blue-50/30 border-t border-blue-50 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div>
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Duración de cada Turno
              </label>
              <select 
                {...register("slot_duration", { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-white border border-blue-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
              >
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={120}>2 horas</option>
                <option value={240}>4 horas</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Máx. Turnos por Persona
              </label>
              <select 
                {...register("max_slots_per_reservation", { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-white border border-blue-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
              >
                {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} {v === 1 ? 'Turno' : 'Turnos'}</option>)}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN 2: TARIFAS */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
            <div className="p-2 bg-emerald-500 rounded-lg text-white">
                <DollarSign className="w-4 h-4" />
            </div>
          <h3 className="font-bold text-slate-800">Tarifas y Aprobaciones</h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Esquema de Cobro</label>
              <select
                {...register("pricing_type")}
                className="w-full px-4 py-3 bg-slate-50 border-transparent border focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-medium"
              >
                <option value="FREE">Uso Gratuito</option>
                <option value="PER_HOUR">Costo por Hora</option>
                <option value="PER_DAY">Costo Fijo por Reserva</option>
              </select>
            </div>

            {pricingType !== "FREE" && (
              <div className="animate-in slide-in-from-left-4 duration-300">
                <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 ml-1 italic">Precio en Divisa Local ($)</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-emerald-600">$</span>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        {...register("price", { valueAsNumber: true, min: 0 })}
                        className="w-full pl-8 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-black text-emerald-700"
                    />
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl cursor-pointer group hover:bg-slate-100 transition-colors">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                {...register("requires_approval")}
                className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all"
              />
              <CheckCircle2 className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 left-1 transition-opacity pointer-events-none" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Requiere Validación</p>
              <p className="text-[11px] text-slate-500 font-medium tracking-tight">El administrador deberá aprobar manualmente cada solicitud.</p>
            </div>
          </label>
        </div>
      </section>

      {/* SECCIÓN 3: DISPONIBILIDAD */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500 rounded-lg text-white"><Clock className="w-4 h-4" /></div>
                <h3 className="font-bold text-slate-800 tracking-tight">Disponibilidad Semanal</h3>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {days.map((day) => {
            const daySchedules = schedules.filter((s) => s.day_of_week === day.value);
            return (
              <div key={day.value} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[160px]">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black text-slate-800 text-xs uppercase tracking-tighter">{day.label}</span>
                  <button
                    type="button"
                    onClick={() => addSchedule(day.value)}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all group"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 flex-1">
                  {daySchedules.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <XCircleIcon className="w-5 h-5 mb-1" />
                        <p className="text-[10px] font-bold uppercase">Cerrado</p>
                    </div>
                  ) : (
                    daySchedules.map((s) => {
                      const realIndex = schedules.findIndex((item) => item === s);
                      return (
                        <div key={realIndex} className="flex items-center gap-2 group animate-in slide-in-from-right-2">
                          <div className="flex bg-slate-50 rounded-xl p-1 items-center border border-slate-100">
                            <input
                                type="time" value={s.start_time}
                                onChange={(e) => updateSchedule(realIndex, "start_time", e.target.value)}
                                className="bg-transparent text-[11px] font-bold outline-none px-1 w-16"
                            />
                            <span className="text-slate-300 mx-0.5"><ChevronRight className="w-3 h-3"/></span>
                            <input
                                type="time" value={s.end_time}
                                onChange={(e) => updateSchedule(realIndex, "end_time", e.target.value)}
                                className="bg-transparent text-[11px] font-bold outline-none px-1 w-16"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSchedule(realIndex)}
                            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ACTION FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent flex justify-center z-10">
        <button
          type="submit"
          disabled={loading}
          className="w-full max-w-lg flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 active:scale-95 disabled:opacity-50 transition-all shadow-2xl shadow-blue-200"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {amenityId ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {amenityId ? "Actualizar Configuración" : "Publicar Espacio"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function XCircleIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}