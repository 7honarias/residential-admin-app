"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  getPublicListingDetail,
  PublicListing,
  PublicListingDetailResponse,
  RelatedPublicListing,
} from "@/services/public-listings.service";

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function ClasificadosDetailPage() {
  const params = useParams<{ id: string }>();
  const listingId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<PublicListing | null>(null);
  const [related, setRelated] = useState<RelatedPublicListing[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!listingId) return;

    const controller = new AbortController();

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const data: PublicListingDetailResponse = await getPublicListingDetail(
          listingId,
          controller.signal,
        );

        setListing(data.listing);
        setRelated(data.related ?? []);
        setActivePhoto(0);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDetail();
    return () => controller.abort();
  }, [listingId]);

  const coverPhoto = useMemo(() => {
    if (!listing) return null;
    return listing.photoUrls[activePhoto] ?? listing.photoUrls[0] ?? null;
  }, [listing, activePhoto]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar hideActions />
        <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
          {/* Skeleton detail layout */}
          <div className="mb-6 flex gap-3">
            <div className="h-9 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="h-9 w-28 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="animate-pulse overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="h-[360px] w-full bg-slate-200 sm:h-[420px]" />
            </div>
            <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-7 w-3/4 rounded-xl bg-slate-200" />
              <div className="mt-3 h-9 w-1/2 rounded-xl bg-slate-200" />
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-5 rounded-lg bg-slate-200" />)}
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 w-2/3 rounded-lg bg-slate-200" />
                <div className="h-4 w-1/2 rounded-lg bg-slate-200" />
              </div>
              <div className="mt-6 space-y-2">
                <div className="h-12 w-full rounded-xl bg-slate-200" />
                <div className="h-12 w-full rounded-xl bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar hideActions />
        <div className="mx-auto max-w-3xl px-4 pt-28 sm:px-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            <p className="font-bold">No fue posible mostrar el inmueble.</p>
            <p className="mt-1 text-sm">{error ?? "No encontrado"}</p>
            <Link
              href="/clasificados"
              className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              Volver a clasificados
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar hideActions />

      <main className="mx-auto w-full max-w-7xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        {/* Breadcrumb nav */}
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/clasificados"
            className="flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Clasificados
          </Link>
          <Link
            href={`/clasificados?complexId=${listing.apartment.complex.id}`}
            className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
          >
            Ver más en {listing.apartment.complex.name}
          </Link>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Gallery */}
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-[360px] w-full overflow-hidden bg-slate-100 sm:h-[420px]">
              {coverPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPhoto} alt={listing.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75 12 4.5l9 5.25V21H3V9.75z" />
                  </svg>
                  <span className="text-sm font-medium">Sin imagen</span>
                </div>
              )}
              <span
                className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide text-white shadow-sm ${
                  listing.listingType === "SALE" ? "bg-emerald-600" : "bg-cyan-700"
                }`}
              >
                {listing.listingType === "SALE" ? "VENTA" : "ARRIENDO"}
              </span>
            </div>

            {listing.photoUrls.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto border-t border-slate-100 p-3">
                {listing.photoUrls.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    onClick={() => setActivePhoto(idx)}
                    className={`shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      activePhoto === idx ? "border-indigo-600" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="h-14 w-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </article>

          {/* Info panel */}
          <aside className="flex flex-col gap-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="mb-1 text-xs font-semibold text-indigo-600">
                {listing.apartment.complex.name} &middot; {listing.apartment.blockName}
              </p>
              <h1 className="text-2xl font-extrabold leading-tight text-slate-900">
                {listing.title}
              </h1>
              <p className="mt-2 text-3xl font-black text-indigo-700">
                {COP.format(listing.price)}
              </p>

              {/* Stats grid */}
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                {[
                  { icon: "📐", value: listing.areaM2 ? `${listing.areaM2}m²` : "N/D", label: "Área" },
                  { icon: "🛏", value: listing.bedrooms, label: "Hab." },
                  { icon: "🚿", value: listing.bathrooms, label: "Baños" },
                  { icon: "🚗", value: listing.parkingSpots, label: "Pkgs." },
                ].map(({ icon, value, label }) => (
                  <div key={label} className="rounded-2xl bg-slate-50 px-2 py-3">
                    <p className="text-lg">{icon}</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
                    <p className="text-[11px] text-slate-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* Location */}
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-bold text-slate-800">
                  {listing.apartment.complex.name}
                </p>
                <p>{listing.apartment.blockName}, Apto {listing.apartment.number}</p>
                {listing.apartment.floor !== null ? (
                  <p>Piso {listing.apartment.floor}</p>
                ) : null}
                {listing.apartment.complex.address ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {listing.apartment.complex.address}
                  </p>
                ) : null}
              </div>

              {/* CTAs */}
              <div className="mt-5 space-y-2">
                {listing.whatsapp ? (
                  <a
                    href={`https://wa.me/${listing.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    Contactar por WhatsApp
                  </a>
                ) : null}
                {listing.phone ? (
                  <a
                    href={`tel:${listing.phone}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-900 px-4 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
                  >
                    Llamar ahora
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
        </section>

        {/* Description */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-extrabold text-slate-900">Descripción</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {listing.description}
          </p>
        </section>

        {/* Related listings */}
        {related.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-5 text-xl font-extrabold text-slate-900">
              Otros inmuebles en {listing.apartment.complex.name}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/clasificados/${item.id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                    {item.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75 12 4.5l9 5.25V21H3V9.75z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white ${
                        item.listingType === "SALE" ? "bg-emerald-600" : "bg-cyan-700"
                      }`}
                    >
                      {item.listingType === "SALE" ? "VENTA" : "ARRIENDO"}
                    </span>
                    <h3 className="mt-1.5 line-clamp-2 text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-lg font-black text-indigo-700">
                      {COP.format(item.price)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Apto {item.apartment.number} &middot; {item.apartment.blockName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
