"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
      <div className="min-h-screen bg-slate-50 px-4 py-12 text-center text-slate-600">
        Cargando inmueble...
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
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
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#eef2ff_40%,_#ffffff_100%)] text-slate-900">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={`/clasificados?complexId=${listing.apartment.complex.id}`}
            className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:border-slate-900"
          >
            Ver más en {listing.apartment.complex.name}
          </Link>
          <Link
            href="/clasificados"
            className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:border-slate-900"
          >
            Ver todos
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-[360px] w-full bg-slate-100 sm:h-[420px]">
              {coverPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPhoto} alt={listing.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">Sin imagen</div>
              )}
              <span
                className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide text-white ${
                  listing.listingType === "SALE" ? "bg-emerald-600" : "bg-cyan-700"
                }`}
              >
                {listing.listingType === "SALE" ? "VENTA" : "ARRIENDO"}
              </span>
            </div>

            {listing.photoUrls.length > 1 ? (
              <div className="grid grid-cols-5 gap-2 border-t border-slate-100 p-3 sm:grid-cols-7">
                {listing.photoUrls.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    className={`overflow-hidden rounded-lg border ${
                      activePhoto == idx ? "border-indigo-600" : "border-slate-200"
                    }`}
                    onClick={() => setActivePhoto(idx)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto ${idx + 1}`} className="h-14 w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </article>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h1 className="text-2xl font-extrabold leading-tight text-slate-900">{listing.title}</h1>
            <p className="mt-2 text-3xl font-black text-indigo-700">{COP.format(listing.price)}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              <span>{listing.areaM2 ? `${listing.areaM2} m²` : "Área N/D"}</span>
              <span>{listing.bedrooms} habitaciones</span>
              <span>{listing.bathrooms} baños</span>
              <span>{listing.parkingSpots} parqueaderos</span>
            </div>

            <div className="mt-4 text-sm text-slate-600">
              <p className="font-bold text-slate-800">
                {listing.apartment.complex.name} - {listing.apartment.blockName}
              </p>
              <p>Apto {listing.apartment.number}</p>
              {listing.apartment.floor !== null ? <p>Piso {listing.apartment.floor}</p> : null}
              {listing.apartment.complex.address ? (
                <p className="mt-1 text-xs text-slate-500">{listing.apartment.complex.address}</p>
              ) : null}
            </div>

            <div className="mt-5 space-y-2">
              {listing.whatsapp ? (
                <a
                  href={`https://wa.me/${listing.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  Contactar por WhatsApp
                </a>
              ) : null}
              {listing.phone ? (
                <a
                  href={`tel:${listing.phone}`}
                  className="block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  Llamar ahora
                </a>
              ) : null}
            </div>
          </aside>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-extrabold text-slate-900">Descripción</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {listing.description}
          </p>
        </section>

        {related.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-extrabold text-slate-900">
              Otros inmuebles en {listing.apartment.complex.name}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/clasificados/${item.id}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="h-40 bg-slate-100">
                    {item.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverUrl} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">Sin foto</div>
                    )}
                  </div>
                  <div className="space-y-1 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      {item.listingType === "SALE" ? "Venta" : "Arriendo"}
                    </p>
                    <h3 className="line-clamp-2 text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-lg font-black text-indigo-700">{COP.format(item.price)}</p>
                    <p className="text-xs text-slate-500">
                      Apto {item.apartment.number} - {item.apartment.blockName}
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
