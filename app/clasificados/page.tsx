"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
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

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[16/10] w-full bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 rounded-full bg-slate-200" />
        <div className="h-5 w-3/4 rounded-xl bg-slate-200" />
        <div className="h-7 w-1/2 rounded-xl bg-slate-200" />
        <div className="h-3 w-full rounded-full bg-slate-200" />
        <div className="h-3 w-5/6 rounded-full bg-slate-200" />
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 400);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
            q: debouncedQuery,
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
  }, [complexId, listingType, debouncedQuery, minPrice, maxPrice, minBedrooms, minBathrooms]);

  const activeComplexName = useMemo(() => {
    if (!complexId) return null;
    return complexes.find((c) => c.id === complexId)?.name ?? null;
  }, [complexes, complexId]);

  const hasActiveFilters =
    complexId !== "" ||
    listingType !== "ALL" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    minBedrooms !== "" ||
    minBathrooms !== "" ||
    query !== "";

  const clearFilters = () => {
    setComplexId("");
    setListingType("ALL");
    setMinPrice("");
    setMaxPrice("");
    setMinBedrooms("");
    setMinBathrooms("");
    setQuery("");
    setDebouncedQuery("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar hideActions />

      {/* Page hero */}
      <div className=" bg-white pt-20">
        
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8 lg:px-8 lg:py-10">
        {/* Filter sidebar */}
        <aside className="mb-6 h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:mb-0 lg:sticky lg:top-28">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Filtros
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Limpiar todo
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* Search */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Búsqueda
              </p>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z"
                  />
                </svg>
                <input
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Torre, vista, penthouse..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Complex */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Complejo
              </p>
              <select
                value={complexId}
                onChange={(e) => setComplexId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos los complejos</option>
                {complexes.map((complex) => (
                  <option key={complex.id} value={complex.id}>
                    {complex.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type — segmented control */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tipo
              </p>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                {(["ALL", "SALE", "RENT"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setListingType(t)}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      listingType === t
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {t === "ALL" ? "Todos" : t === "SALE" ? "Venta" : "Arriendo"}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Price */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Precio (COP)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Mínimo"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Máximo"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Rooms & baths */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Habitaciones y Baños
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-[11px] font-medium text-slate-400">Hab. mínimas</p>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={minBedrooms}
                    onChange={(e) => setMinBedrooms(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-medium text-slate-400">Baños mínimos</p>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={minBathrooms}
                    onChange={(e) => setMinBathrooms(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Limpiar filtros
            </button>
          </div>
        </aside>

        {/* Listings column */}
        <section className="min-w-0 space-y-5">
          {/* Results bar */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div>
              <p className="text-xs text-slate-500">
                {activeComplexName
                  ? `Publicaciones de ${activeComplexName}`
                  : "Todos los complejos"}
              </p>
              <h2 className="mt-0.5 text-xl font-extrabold text-slate-900" aria-live="polite">
                {loading
                  ? "Buscando inmuebles..."
                  : `${listings.length} inmueble${listings.length !== 1 ? "s" : ""} disponible${listings.length !== 1 ? "s" : ""}`}
              </h2>
            </div>
            {hasActiveFilters && !loading && (
              <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                Filtros activos
              </span>
            )}
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              <p className="font-semibold">Ocurrió un error al cargar los inmuebles.</p>
              <p className="mt-1 text-rose-600">{error}</p>
            </div>
          ) : null}

          {/* Skeleton while loading */}
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : listings.length === 0 && !error ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
                🏠
              </div>
              <h3 className="text-lg font-bold text-slate-800">Sin resultados</h3>
              <p className="mt-2 text-sm text-slate-500">
                No hay inmuebles con los filtros actuales. Intenta ampliar los
                criterios de búsqueda.
              </p>
              <button
                onClick={clearFilters}
                className="mt-5 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
              >
                Ver todos los inmuebles
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => {
                const cover = listing.photoUrls[0] ?? null;
                return (
                  <Link
                    key={listing.id}
                    href={`/clasificados/${listing.id}`}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Cover image */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt={listing.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-1.5 text-slate-400">
                          <svg
                            className="h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M3 9.75 12 4.5l9 5.25V21H3V9.75z"
                            />
                          </svg>
                          <span className="text-xs font-medium">Sin foto</span>
                        </div>
                      )}
                      <span
                        className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide text-white shadow-sm ${
                          listing.listingType === "SALE"
                            ? "bg-emerald-600"
                            : "bg-cyan-700"
                        }`}
                      >
                        {listing.listingType === "SALE" ? "VENTA" : "ARRIENDO"}
                      </span>
                    </div>

                    <div className="p-4">
                      {/* Complex label — scannable at a glance */}
                      <p className="mb-1 truncate text-xs font-semibold text-indigo-600">
                        {listing.apartment.complex.name} &middot;{" "}
                        {listing.apartment.blockName}
                      </p>

                      <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-slate-900">
                        {listing.title}
                      </h3>

                      <p className="mt-1 text-2xl font-black text-indigo-700">
                        {COP.format(listing.price)}
                      </p>

                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {listing.description}
                      </p>

                      {/* Stats — icon + value + label */}
                      <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                        {[
                          {
                            icon: "📐",
                            value: listing.areaM2 ? `${listing.areaM2}m²` : "N/D",
                            label: "Área",
                          },
                          { icon: "🛏", value: listing.bedrooms, label: "Hab." },
                          { icon: "🚿", value: listing.bathrooms, label: "Baños" },
                          { icon: "🚗", value: listing.parkingSpots, label: "Pkgs." },
                        ].map(({ icon, value, label }) => (
                          <div
                            key={label}
                            className="rounded-xl bg-slate-50 px-1 py-1.5"
                          >
                            <p className="text-sm leading-none">{icon}</p>
                            <p className="mt-1 text-xs font-bold text-slate-800">
                              {value}
                            </p>
                            <p className="text-[10px] text-slate-400">{label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Address */}
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="text-xs text-slate-500">
                          Apto {listing.apartment.number}
                          {listing.apartment.floor
                            ? `, Piso ${listing.apartment.floor}`
                            : ""}
                        </p>
                        {listing.apartment.complex.address ? (
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {listing.apartment.complex.address}
                          </p>
                        ) : null}
                      </div>

                      {/* Contact CTAs */}
                      {(listing.whatsapp || listing.phone) ? (
                        <div className="mt-3 flex gap-2">
                          {listing.whatsapp ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(
                                  `https://wa.me/${listing.whatsapp?.replace(/\D/g, "")}`,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                              className="flex-1 rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                            >
                              WhatsApp
                            </button>
                          ) : null}
                          {listing.phone ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = `tel:${listing.phone}`;
                              }}
                              className="flex-1 rounded-full border border-slate-900 px-3 py-2 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
                            >
                              Llamar
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
