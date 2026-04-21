"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getPublicListings,
  ListingType,
  PublicComplex,
  PublicListing,
} from "@/services/public-listings.service";

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function ClasificadosPublicPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complexes, setComplexes] = useState<PublicComplex[]>([]);
  const [listings, setListings] = useState<PublicListing[]>([]);

  const [complexId, setComplexId] = useState("");
  const [listingType, setListingType] = useState<"ALL" | ListingType>("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [minBathrooms, setMinBathrooms] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialComplex = params.get("complexId") ?? "";
    const initialType = params.get("type")?.toUpperCase();

    setComplexId(initialComplex);
    if (initialType === "SALE" || initialType === "RENT") {
      setListingType(initialType);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadListings = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getPublicListings(
          {
            complexId: complexId || undefined,
            listingType: listingType !== "ALL" ? listingType : undefined,
            q: query,
            minPrice,
            maxPrice,
            minBedrooms,
            minBathrooms,
          },
          controller.signal,
        );

        setComplexes(data.complexes ?? []);
        setListings(data.listings ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadListings();

    return () => controller.abort();
  }, [complexId, listingType, query, minPrice, maxPrice, minBedrooms, minBathrooms]);

  const activeComplexName = useMemo(() => {
    if (!complexId) return null;
    return complexes.find((c) => c.id === complexId)?.name ?? null;
  }, [complexes, complexId]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#eef2ff_40%,_#ffffff_100%)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Mercado Inmobiliario</p>
            <h1 className="text-xl font-extrabold sm:text-2xl">Apartamentos en Venta y Arriendo</h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900"
          >
            Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8 lg:py-8">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Filtros</h2>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Complejo
              <select
                value={complexId}
                onChange={(e) => setComplexId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Todos los complejos</option>
                {complexes.map((complex) => (
                  <option key={complex.id} value={complex.id}>
                    {complex.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Tipo
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as "ALL" | ListingType)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="ALL">Todos</option>
                <option value="SALE">Venta</option>
                <option value="RENT">Arriendo</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold text-slate-700">
                Precio Min
                <input
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Precio Max
                <input
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold text-slate-700">
                Min Habit.
                <input
                  value={minBedrooms}
                  onChange={(e) => setMinBedrooms(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Min Baños
                <input
                  value={minBathrooms}
                  onChange={(e) => setMinBathrooms(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Buscar
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej: Torre, vista, penthouse..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <button
              onClick={() => {
                setComplexId("");
                setListingType("ALL");
                setMinPrice("");
                setMaxPrice("");
                setMinBedrooms("");
                setMinBathrooms("");
                setQuery("");
              }}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              Limpiar Filtros
            </button>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              {activeComplexName
                ? `Mostrando publicaciones de ${activeComplexName}`
                : "Mostrando publicaciones de todos los complejos"}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
              {loading ? "Cargando..." : `${listings.length} inmueble(s) disponible(s)`}
            </h2>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
              {error}
            </div>
          ) : null}

          {!loading && listings.length === 0 && !error ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-700">No hay resultados con los filtros actuales.</p>
              <p className="mt-2 text-sm text-slate-500">Intenta ampliar los criterios o quitar el filtro de complejo.</p>
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => {
              const cover = listing.photoUrls[0] ?? null;
              return (
                <Link
                  key={listing.id}
                  href={`/clasificados/${listing.id}`}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="relative h-52 w-full bg-slate-100">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                        Sin foto
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide text-white ${
                        listing.listingType === "SALE" ? "bg-emerald-600" : "bg-cyan-700"
                      }`}
                    >
                      {listing.listingType === "SALE" ? "VENTA" : "ARRIENDO"}
                    </span>
                  </div>

                  <div className="space-y-3 p-4">
                    <h3 className="line-clamp-2 text-lg font-extrabold text-slate-900">{listing.title}</h3>
                    <p className="text-2xl font-black text-indigo-700">{COP.format(listing.price)}</p>

                    <p className="line-clamp-2 text-sm text-slate-600">{listing.description}</p>

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                      <span>{listing.areaM2 ? `${listing.areaM2} m²` : "Área N/D"}</span>
                      <span>{listing.bedrooms} Hab</span>
                      <span>{listing.bathrooms} Baños</span>
                      <span>{listing.parkingSpots} Parqueaderos</span>
                    </div>

                    <div className="border-t border-slate-100 pt-3 text-sm text-slate-600">
                      <p className="font-semibold text-slate-800">
                        {listing.apartment.complex.name} - {listing.apartment.blockName}
                      </p>
                      <p>Apto {listing.apartment.number}</p>
                      {listing.apartment.complex.address ? (
                        <p className="text-xs text-slate-500">{listing.apartment.complex.address}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {listing.whatsapp ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            window.open(
                              `https://wa.me/${listing.whatsapp?.replace(/\D/g, "")}`,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
                        >
                          WhatsApp
                        </button>
                      ) : null}
                      {listing.phone ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            window.location.href = `tel:${listing.phone}`;
                          }}
                          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                        >
                          Llamar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
