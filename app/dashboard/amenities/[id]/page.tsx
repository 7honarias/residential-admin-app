/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  ChevronLeft,
  Edit3,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Timer,
  AlertCircle,
  Hash,
  Layers,
  ChevronRight, // Nuevos iconos para las reglas
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import {
  fetchAmenityBookings,
  updateBookingStatus,
} from "@/services/bookings.service";
import { upsertAmenity } from "@/services/amenities.service";
import EditAmenityModal from "@/components/amenities/EditAmenityModal";
import { Amenity } from "../amenitie.tyes";

interface Booking {
  id: string;
  user_name: string;
  unit: string;
  start_time: string;
  end_time: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  date: string;
}

function getDayLabel(day: number) {
  const labels: Record<number, string> = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    0: "Domingo",
  };
  return labels[day] || "Desconocido";
}

/**
 * Componente para mostrar el Badge de estado en la tabla
 */
function StatusBadge({ status }: { status: Booking["status"] }) {
  const configs = {
    APPROVED: {
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      label: "Aprobado",
    },
    PENDING: {
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: Timer,
      label: "Pendiente",
    },
    REJECTED: {
      color: "bg-red-100 text-red-700 border-red-200",
      icon: XCircle,
      label: "Rechazado",
    },
    CANCELLED: {
      color: "bg-slate-100 text-slate-600 border-slate-200",
      icon: XCircle,
      label: "Cancelado",
    },
  };

  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${config.color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

export default function AmenityDetailsPage() {
  const { id: amenityId } = useParams();
  const router = useRouter();
  const { token } = useAppSelector((state) => state.auth);

  const [amenity, setAmenity] = useState<Amenity>({} as Amenity);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);

  const [selectedDate, setSelectedDate] = useState(new Date());

  // 2. Función para formatear fecha a YYYY-MM-DD (asumiendo que booking.date viene así)
  const formatDateKey = (date: Date) => date.toISOString().split("T")[0];

  // 3. Filtrar las reservas
  const filteredBookings = bookings.filter(
    (booking) => booking.date === formatDateKey(selectedDate),
  );

  // 4. Handlers para cambiar de día
  const nextDay = () =>
    setSelectedDate((prev) => new Date(prev.setDate(prev.getDate() + 1)));
  const prevDay = () =>
    setSelectedDate((prev) => new Date(prev.setDate(prev.getDate() - 1)));
  const goToToday = () => setSelectedDate(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!amenityId || !activeComplex || !token) {
        setError("Información requerida no disponible");
        setLoading(false);
        return;
      }
      const res = await fetchAmenityBookings(
        amenityId as string,
        token,
        activeComplex.id,
      );

      setAmenity(res.amenity);
      setBookings(res.bookings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [amenityId, activeComplex, token]);

  useEffect(() => {
    if (token && activeComplex) fetchData();
  }, [fetchData, token, activeComplex]);

  const handleStatusChange = async (
    bookingId: string,
    newStatus: "APPROVED" | "REJECTED",
  ) => {
    try {
      await updateBookingStatus(
        bookingId,
        newStatus,
        token!,
        activeComplex!.id,
      );
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)),
      );
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSaveAmenity = async (updatedAmenity: Amenity) => {
    setSaving(true);
    try {
      const amenityData = {
        name: updatedAmenity.name,
        description: updatedAmenity.description,
        capacity: updatedAmenity.capacity,
        price: updatedAmenity.price,
        slot_duration: updatedAmenity.slot_duration,
        max_slots_per_reservation: updatedAmenity.max_slots_per_reservation,
      };

      await upsertAmenity(token!, activeComplex!.id, amenityData, amenityId as string);
      setAmenity(updatedAmenity);
      console.log("Amenity updated successfully");
    } catch (err: any) {
      throw new Error(err.message || "Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Cargando información...</p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-in fade-in">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {amenity?.name}
            </h1>
            <p className="text-slate-500 flex items-center gap-1 text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-500" />{" "}
              {amenity?.description || "Sin descripción"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setEditModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg"
        >
          <Edit3 className="w-4 h-4" /> Editar Configuración
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA INFO */}
        <div className="lg:col-span-1 space-y-6">
          {/* CARACTERISTICAS PRINCIPALES */}
          <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
              General
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <Users className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-[10px] uppercase font-black text-slate-400">
                  Aforo
                </p>
                <p className="font-bold text-slate-700">
                  {amenity?.capacity} pers.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <DollarSign className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="text-[10px] uppercase font-black text-slate-400">
                  Precio
                </p>
                <p className="font-bold text-slate-700">
                  {amenity?.price > 0 ? `$${amenity.price}` : "Gratis"}
                </p>
              </div>
            </div>
          </section>

          {/* NUEVA SECCIÓN: REGLAS DE TIEMPO */}
          <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
              Reglas de Uso
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400">
                    Duración del Turno
                  </p>
                  <p className="font-bold text-slate-700">
                    {amenity?.slot_duration || 60} minutos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-50 rounded-2xl text-violet-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400">
                    Máximo de Bloques
                  </p>
                  <p className="font-bold text-slate-700">
                    {amenity?.max_slots_per_reservation || 1}{" "}
                    {amenity?.max_slots_per_reservation === 1
                      ? "turno"
                      : "turnos por reserva"}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 bg-blue-50/50 p-2 rounded-lg">
                  <Timer className="w-3.5 h-3.5" />
                  <span>
                    Tiempo máx:{" "}
                    {(amenity?.slot_duration || 60) *
                      (amenity?.max_slots_per_reservation || 1)}{" "}
                    min por reserva
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* HORARIOS */}
          <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              Horarios
            </h3>
            <div className="space-y-2">
              {amenity?.amenity_schedules?.length > 0 ? (
                amenity.amenity_schedules.map((s: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-bold text-slate-600">
                      {getDayLabel(s.day_of_week)}
                    </span>
                    <span className="text-blue-700 font-mono text-xs font-bold">
                      {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  Sin horarios configurados
                </p>
              )}
            </div>
          </section>
        </div>

        {/* COLUMNA RESERVAS */}
        {/* COLUMNA RESERVAS */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header con Navegador de Fecha */}
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-none">
                    Reservas
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">
                    {filteredBookings.length} para este día
                  </p>
                </div>
              </div>

              {/* Controles de Navegación */}
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                <button
                  onClick={prevDay}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={goToToday}
                  className="px-4 py-1.5 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-all border border-transparent hover:border-slate-100"
                >
                  {selectedDate.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  })}
                </button>

                <button
                  onClick={nextDay}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabla de Reservas Filtradas */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase text-slate-400 font-bold bg-slate-50/30">
                    <th className="px-6 py-4 tracking-widest">Residente</th>
                    <th className="px-6 py-4 tracking-widest">
                      Bloque Horario
                    </th>
                    <th className="px-6 py-4 tracking-widest">Estado</th>
                    <th className="px-6 py-4 text-right tracking-widest">
                      Gestión
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="hover:bg-slate-50/50 transition-colors group animate-in fade-in slide-in-from-bottom-1"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700 leading-none">
                            {booking.user_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                            {booking.unit}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-blue-600 bg-blue-50/50 w-fit px-3 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs font-black font-mono">
                              {booking.start_time.slice(0, 5)} -{" "}
                              {booking.end_time.slice(0, 5)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {booking.status === "PENDING" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleStatusChange(booking.id, "APPROVED")
                                }
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                title="Aprobar"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(booking.id, "REJECTED")
                                }
                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                title="Rechazar"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest border border-slate-100 px-2 py-1 rounded-md bg-slate-50/50">
                              Procesado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="p-4 bg-slate-50 rounded-full text-slate-200">
                            <Calendar className="w-10 h-10" />
                          </div>
                          <div className="max-w-[200px]">
                            <p className="text-slate-500 font-bold text-sm">
                              No hay reservas
                            </p>
                            <p className="text-slate-400 text-xs">
                              No se encontraron registros para este día
                              seleccionado.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Modal para editar configuración */}
      <EditAmenityModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        amenity={amenity && Object.keys(amenity).length > 0 ? amenity : null}
        onSave={handleSaveAmenity}
        isProcessing={saving}
      />
    </div>
  );
}
