"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import { Amenity } from "@/app/dashboard/amenities/amenitie.tyes";
import { fetchAmenities } from "@/services/amenities.service";
import { fetchAmenityBookings } from "@/services/bookings.service";

type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface AmenityBooking {
  id: string;
  user_name: string;
  unit: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  date: string;
}

interface AmenitiesAgendaPanelProps {
  token: string;
  complexId: string;
}

const getTodayValue = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split("T")[0];
};

const formatAgendaDate = (value: string) => {
  if (!value) return "";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
};

const formatTimeRange = (startTime: string, endTime: string) =>
  `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;

const statusStyles: Record<
  BookingStatus,
  { label: string; className: string; accent: string }
> = {
  APPROVED: {
    label: "Aprobada",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    accent: "text-emerald-600",
  },
  PENDING: {
    label: "Pendiente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    accent: "text-amber-600",
  },
  REJECTED: {
    label: "Rechazada",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    accent: "text-rose-600",
  },
  CANCELLED: {
    label: "Cancelada",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    accent: "text-slate-500",
  },
};

export default function AmenitiesAgendaPanel({
  token,
  complexId,
}: AmenitiesAgendaPanelProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenityId, setSelectedAmenityId] = useState("");
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayValue());
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingAmenities, setLoadingAmenities] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAmenities = async () => {
      try {
        setLoadingAmenities(true);
        setError(null);

        const response = await fetchAmenities(complexId, token);
        const activeAmenities = response.filter((amenity) => amenity.is_active);

        setAmenities(activeAmenities);
        setSelectedAmenityId((current) => current || activeAmenities[0]?.id || "");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar la agenda de amenities.",
        );
      } finally {
        setLoadingAmenities(false);
      }
    };

    if (!token || !complexId) return;
    loadAmenities();
  }, [complexId, token]);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoadingBookings(true);
        setError(null);

        const response = await fetchAmenityBookings(
          selectedAmenityId,
          token,
          complexId,
        );

        setBookings(response.bookings ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar las reservas.",
        );
      } finally {
        setLoadingBookings(false);
      }
    };

    if (!selectedAmenityId) {
      setBookings([]);
      return;
    }

    loadBookings();
  }, [complexId, selectedAmenityId, token]);

  const selectedAmenity = useMemo(
    () => amenities.find((amenity) => amenity.id === selectedAmenityId) ?? null,
    [amenities, selectedAmenityId],
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const bookingsForDate = useMemo(
    () =>
      bookings
        .filter((booking) => booking.date === selectedDate)
        .sort((left, right) => left.start_time.localeCompare(right.start_time)),
    [bookings, selectedDate],
  );

  const filteredBookings = useMemo(() => {
    if (!normalizedQuery) return bookingsForDate;

    return bookingsForDate.filter((booking) => {
      const residentName = booking.user_name?.toLowerCase() ?? "";
      const unit = booking.unit?.toLowerCase() ?? "";
      return residentName.includes(normalizedQuery) || unit.includes(normalizedQuery);
    });
  }, [bookingsForDate, normalizedQuery]);

  const validStatuses = filteredBookings.filter(
    (booking) => booking.status === "APPROVED" || booking.status === "PENDING",
  );

  const validationTone =
    normalizedQuery.length === 0
      ? null
      : validStatuses.length > 0
        ? {
            className: "border-emerald-200 bg-emerald-50 text-emerald-800",
            icon: CheckCircle2,
            title: "Reserva encontrada",
            description: `Se encontraron ${validStatuses.length} reservas vigentes para esta búsqueda.`,
          }
        : {
            className: "border-rose-200 bg-rose-50 text-rose-800",
            icon: XCircle,
            title: "Sin reserva vigente",
            description:
              "No hay reservas aprobadas o pendientes que coincidan con el residente o apartamento consultado.",
          };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
              Agenda en portería
            </span>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Valida reservas de amenities antes de autorizar el ingreso
              </h2>
              <p className="mt-2 text-sm text-slate-200">
                Consulta por residente o apartamento y confirma, por ejemplo, si un usuario tiene reservada la mesa de ping pong hoy.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                <CalendarDays className="h-4 w-4" />
                Fecha de consulta
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
              />
            </label>

            <label className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                <Search className="h-4 w-4" />
                Residente o apartamento
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Ej: Laura o Apto 502"
                className="w-full rounded-xl border border-white/15 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-300"
              />
            </label>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Amenity a validar</h3>
            <p className="mt-1 text-sm text-slate-500">
              Selecciona el espacio que quiere usar el residente y revisa la agenda del día.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {loadingAmenities ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Cargando amenities...
              </div>
            ) : amenities.length > 0 ? (
              amenities.map((amenity) => (
                <button
                  key={amenity.id}
                  onClick={() => setSelectedAmenityId(amenity.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    selectedAmenityId === amenity.id
                      ? "border-cyan-300 bg-cyan-50 text-cyan-900 shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {amenity.name}
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                No hay amenities activos en este conjunto.
              </div>
            )}
          </div>
        </div>

        {selectedAmenity && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Amenity seleccionado
              </p>
              <p className="mt-2 text-lg font-bold text-slate-800">{selectedAmenity.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {selectedAmenity.description || "Sin descripción registrada."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Agenda del día
              </p>
              <p className="mt-2 text-lg font-bold text-slate-800 capitalize">
                {formatAgendaDate(selectedDate)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {bookingsForDate.length} reservas registradas para esta fecha.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Coincidencias vigentes
              </p>
              <p className="mt-2 text-lg font-bold text-slate-800">{validStatuses.length}</p>
              <p className="mt-1 text-sm text-slate-500">
                Reservas aprobadas o pendientes para la búsqueda actual.
              </p>
            </div>
          </div>
        )}
      </section>

      {validationTone && (
        <section className={`rounded-2xl border px-4 py-4 ${validationTone.className}`}>
          <div className="flex items-start gap-3">
            <validationTone.icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-bold">{validationTone.title}</p>
              <p className="text-sm">{validationTone.description}</p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Reservas encontradas</h3>
            <p className="mt-1 text-sm text-slate-500">
              Revisa horario, apartamento y estado antes de autorizar el acceso al amenity.
            </p>
          </div>

          {loadingBookings && (
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Actualizando agenda...
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {!selectedAmenityId && !loadingAmenities && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
              Selecciona un amenity para consultar su agenda.
            </div>
          )}

          {selectedAmenityId && !loadingBookings && filteredBookings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <p className="text-lg font-semibold text-slate-700">
                No hay reservas que coincidan con la consulta.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Ajusta la fecha, el amenity o escribe el nombre del residente o el apartamento para validar la reserva.
              </p>
            </div>
          )}

          {filteredBookings.map((booking) => {
            const status = statusStyles[booking.status] ?? {
              label: booking.status,
              className: "bg-slate-100 text-slate-600 border-slate-200",
              accent: "text-slate-500",
            };

            return (
              <article
                key={booking.id}
                className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${status.className}`}>
                        {status.label}
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Clock3 className={`h-4 w-4 ${status.accent}`} />
                        {formatTimeRange(booking.start_time, booking.end_time)}
                      </span>
                    </div>

                    <div>
                      <p className="text-lg font-bold text-slate-900">{booking.user_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <UserRound className="h-4 w-4 text-slate-400" />
                          Apartamento {booking.unit}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          {formatAgendaDate(booking.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Validación rápida
                    </p>
                    <p className="mt-1 font-semibold">
                      {booking.status === "APPROVED"
                        ? "Puede ingresar al amenity."
                        : booking.status === "PENDING"
                          ? "Requiere revisión antes del ingreso."
                          : "No autorizar ingreso con esta reserva."}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}