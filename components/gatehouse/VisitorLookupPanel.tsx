"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkInGuest,
  findInvitationByCode,
  findInvitationById,
  GuestAuthorization,
  GuestAuthorizationType,
  searchInvitationsByApartment,
} from "@/services/guestAuthorizations.service";

// ─── helpers ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<GuestAuthorizationType, string> = {
  PEDESTRIAN: "Visitante",
  VEHICLE: "Vehículo",
  TECHNICAL_SERVICE: "Servicio técnico",
};

const TYPE_ICON: Record<GuestAuthorizationType, string> = {
  PEDESTRIAN: "🚶",
  VEHICLE: "🚗",
  TECHNICAL_SERVICE: "🛠️",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-emerald-100 text-emerald-700",
  USED: "bg-slate-100 text-slate-500",
  EXPIRED: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Vigente",
  USED: "Ya ingresó",
  EXPIRED: "Vencida",
  CANCELLED: "Cancelada",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface InvitationCardProps {
  inv: GuestAuthorization;
  onCheckIn: (inv: GuestAuthorization) => void;
  compact?: boolean;
}

function InvitationCard({ inv, onCheckIn, compact = false }: InvitationCardProps) {
  const canCheckIn = inv.status === "PENDING";
  return (
    <div
      className={`bg-white border-2 rounded-2xl transition-shadow ${canCheckIn ? "border-slate-200 hover:border-indigo-300 hover:shadow-md" : "border-slate-100 opacity-70"} ${compact ? "p-4" : "p-5"}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl shrink-0">{TYPE_ICON[inv.type]}</span>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-lg leading-tight truncate">
              {inv.guestName}
            </p>
            {inv.company && (
              <p className="text-sm text-slate-500 truncate">{inv.company}</p>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_BADGE[inv.status]}`}
        >
          {STATUS_LABEL[inv.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
        <div className="flex items-center gap-1.5">
          <span>🏠</span>
          <span>
            {inv.blockName ? `${inv.blockName} - ` : ""}Apto {inv.apartmentNumber}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>👤</span>
          <span className="truncate">{inv.residentName || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🗓️</span>
          <span>{formatDateTime(inv.scheduledAt)}</span>
        </div>
        {inv.vehiclePlate && (
          <div className="flex items-center gap-1.5">
            <span>🚘</span>
            <span className="font-mono font-semibold">{inv.vehiclePlate}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
            {inv.accessCode}
          </span>
          <span className="text-xs text-slate-400">{TYPE_LABEL[inv.type]}</span>
        </div>
        {canCheckIn && (
          <button
            onClick={() => onCheckIn(inv)}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            ✅ Confirmar ingreso
          </button>
        )}
      </div>

      {inv.notes && (
        <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 italic">
          📝 {inv.notes}
        </p>
      )}
    </div>
  );
}

// ─── Check-in confirmation modal ─────────────────────────────────────────────

interface CheckInModalProps {
  inv: GuestAuthorization;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

function CheckInModal({ inv, onConfirm, onCancel, loading }: CheckInModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-5xl mx-auto mb-4">
            {TYPE_ICON[inv.type]}
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">¿Confirmar ingreso?</h3>
          <p className="text-slate-500 text-sm">Estás a punto de registrar el ingreso de:</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 mb-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Visitante</span>
            <span className="font-bold text-slate-800">{inv.guestName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Apartamento</span>
            <span className="font-semibold text-slate-700">
              {inv.blockName ? `${inv.blockName} - ` : ""}Apto {inv.apartmentNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Anfitrión</span>
            <span className="font-semibold text-slate-700">{inv.residentName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Tipo</span>
            <span className="text-slate-700">{TYPE_LABEL[inv.type]}</span>
          </div>
          {inv.vehiclePlate && (
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Placa</span>
              <span className="font-mono font-bold text-slate-700">{inv.vehiclePlate}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border-2 border-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 transition shadow-md disabled:opacity-60"
          >
            {loading ? "Registrando…" : "✅ Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Search by apartment ─────────────────────────────────────────────────

function ApartmentSearchTab({
  complexId,
  onCheckIn,
}: {
  complexId: string;
  onCheckIn: (inv: GuestAuthorization) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GuestAuthorization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    async (value: string) => {
      if (!value.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await searchInvitationsByApartment({ complexId, query: value });
        setResults(data);
        setSearched(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error buscando invitaciones");
      } finally {
        setLoading(false);
      }
    },
    [complexId],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(value), 500);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-slate-500 text-sm mb-3">
          Escribe el número de apartamento para ver los visitantes pre-registrados con invitación
          vigente.
        </p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Ej: 301, 12, 5B…"
            value={query}
            onChange={handleChange}
            autoComplete="off"
            className="w-full rounded-2xl border-2 border-slate-200 pl-12 pr-5 py-4 text-xl font-semibold text-slate-800 placeholder-slate-300 focus:border-indigo-500 focus:outline-none transition"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <span className="animate-spin text-3xl mr-3">⏳</span>
          <span className="text-lg">Buscando…</span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-5 text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <span className="text-4xl block mb-3">🔎</span>
          <p className="text-lg font-semibold text-slate-600">Sin invitaciones vigentes</p>
          <p className="text-sm text-slate-400 mt-1">
            No hay invitados pre-registrados para el apartamento <strong>{query}</strong> con
            invitación activa hoy.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 font-medium">
            {results.length} invitación{results.length !== 1 ? "es" : ""} encontrada
            {results.length !== 1 ? "s" : ""}
          </p>
          {results.map((inv) => (
            <InvitationCard key={inv.id} inv={inv} onCheckIn={onCheckIn} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: WhatsApp access code ────────────────────────────────────────────────

function AccessCodeTab({
  complexId,
  onCheckIn,
}: {
  complexId: string;
  onCheckIn: (inv: GuestAuthorization) => void;
}) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<GuestAuthorization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setVerified(false);
    try {
      const found = await findInvitationByCode({ complexId, accessCode: code });
      setResult(found);
      setVerified(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error verificando código");
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
    setVerified(false);
    setResult(null);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleVerify();
  };

  return (
    <div className="space-y-6">
      <p className="text-slate-500 text-sm">
        El residente recibe un código por WhatsApp cuando registra a un visitante. El vigilante lo
        ingresa aquí para verificar la identidad.
      </p>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="AUT-123456"
          value={code}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="flex-1 rounded-2xl border-2 border-slate-200 px-5 py-4 text-2xl font-mono font-bold uppercase tracking-widest text-slate-800 placeholder-slate-300 focus:border-indigo-500 focus:outline-none transition"
          maxLength={12}
        />
        <button
          onClick={handleVerify}
          disabled={!code.trim() || loading}
          className="rounded-2xl bg-indigo-600 px-8 py-4 font-bold text-lg text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? "⏳" : "Verificar"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-5 text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {verified && !result && (
        <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-10 text-center">
          <span className="text-4xl block mb-3">❌</span>
          <p className="text-lg font-semibold text-amber-700">Código no encontrado</p>
          <p className="text-sm text-amber-600 mt-1">
            Verifica que el código sea correcto. Recuerda que solo son válidos los códigos vigentes.
          </p>
        </div>
      )}

      {verified && result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <span className="text-xl">✅</span> Invitación verificada
          </div>
          <InvitationCard inv={result} onCheckIn={onCheckIn} />
        </div>
      )}
    </div>
  );
}

// ─── Tab: QR Scanner ─────────────────────────────────────────────────────────

// QR content can be either the access_code (AUT-XXXXXX) or the invitation UUID.
const ACCESS_CODE_RE = /^AUT-\d{6}$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function QRScannerTab({
  complexId,
  onCheckIn,
}: {
  complexId: string;
  onCheckIn: (inv: GuestAuthorization) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedText, setScannedText] = useState<string | null>(null);
  const [result, setResult] = useState<GuestAuthorization | null>(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [barcodeDetectorSupported, setBarcodeDetectorSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      setBarcodeDetectorSupported(true);
    } else {
      setBarcodeDetectorSupported(false);
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(() => {
    if (scannerRef.current) {
      clearInterval(scannerRef.current);
      scannerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const lookupQRContent = useCallback(
    async (text: string) => {
      setLoadingLookup(true);
      setLookupError(null);
      setResult(null);
      try {
        let found: GuestAuthorization | null = null;
        const trimmed = text.trim();
        if (ACCESS_CODE_RE.test(trimmed)) {
          found = await findInvitationByCode({ complexId, accessCode: trimmed });
        } else if (UUID_RE.test(trimmed)) {
          found = await findInvitationById({ complexId, invitationId: trimmed });
        } else {
          setLookupError("El QR no contiene un código de invitación válido.");
          return;
        }
        setResult(found);
        if (!found) setLookupError("Invitación no encontrada para el código escaneado.");
      } catch (e) {
        setLookupError(e instanceof Error ? e.message : "Error verificando QR");
      } finally {
        setLoadingLookup(false);
      }
    },
    [complexId],
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScannedText(null);
    setResult(null);
    setLookupError(null);

    if (!barcodeDetectorSupported) {
      setCameraError(
        "Tu navegador no soporta el escáner de QR automático. Usa la opción de Código de Acceso.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      scannerRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue as string;
            stopCamera();
            setScannedText(rawValue);
            lookupQRContent(rawValue);
          }
        } catch {
          // Detection errors are expected on frames without QR codes
        }
      }, 300);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setCameraError("Permiso de cámara denegado. Actívalo en la configuración del navegador.");
      } else {
        setCameraError("No se pudo acceder a la cámara.");
      }
    }
  }, [barcodeDetectorSupported, lookupQRContent, stopCamera]);

  const handleReset = () => {
    setScannedText(null);
    setResult(null);
    setLookupError(null);
    setCameraError(null);
  };

  return (
    <div className="space-y-5">
      <p className="text-slate-500 text-sm">
        El visitante muestra el código QR que recibió con su invitación. Escanéalo para verificar su
        acceso.
      </p>

      {barcodeDetectorSupported === false && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
          <p className="font-semibold text-amber-800 mb-1">⚠️ Escáner no disponible</p>
          <p className="text-sm text-amber-700">
            Este navegador no soporta el escaneo automático de QR (requiere Chrome 83+ o Edge 83+).
            Usa la pestaña <strong>"Código WhatsApp"</strong> e ingresa el código manualmente.
          </p>
        </div>
      )}

      {barcodeDetectorSupported === true && !scannedText && (
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-full max-w-sm aspect-square bg-slate-900 rounded-3xl overflow-hidden border-4 border-indigo-500 shadow-lg">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? "" : "hidden"}`}
              muted
              playsInline
            />
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
                <span className="text-6xl">📷</span>
                <p className="text-sm text-slate-300 text-center px-4">
                  Presiona el botón para activar la cámara
                </p>
              </div>
            )}
            {/* QR frame overlay */}
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-4 border-white/70 rounded-2xl relative">
                  {/* Corners */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />
                </div>
              </div>
            )}
          </div>

          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="rounded-2xl bg-indigo-600 px-10 py-4 font-bold text-lg text-white hover:bg-indigo-700 transition-colors shadow-md"
            >
              📷 Activar cámara
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="rounded-2xl border-2 border-slate-300 px-8 py-3 font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Detener cámara
            </button>
          )}
        </div>
      )}

      {cameraError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-5 text-red-700 font-medium">
          ⚠️ {cameraError}
        </div>
      )}

      {scannedText && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <span className="text-2xl">📲</span>
            <div>
              <p className="text-xs text-slate-500 font-medium">Código escaneado</p>
              <p className="font-mono font-bold text-slate-800 break-all">{scannedText}</p>
            </div>
            <button
              onClick={handleReset}
              className="ml-auto text-sm font-semibold text-indigo-600 hover:underline"
            >
              Escanear otro
            </button>
          </div>

          {loadingLookup && (
            <div className="flex items-center gap-3 text-slate-500 py-4">
              <span className="animate-spin text-2xl">⏳</span> Verificando invitación…
            </div>
          )}

          {lookupError && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-5 text-red-700 font-medium">
              ⚠️ {lookupError}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <span className="text-xl">✅</span> QR verificado correctamente
              </div>
              <InvitationCard inv={result} onCheckIn={onCheckIn} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type LookupMode = "APARTMENT" | "CODE" | "QR";

interface VisitorLookupPanelProps {
  token: string;
  complexId: string;
  securityUserId: string;
}

export default function VisitorLookupPanel({
  complexId,
  securityUserId,
}: VisitorLookupPanelProps) {
  const [mode, setMode] = useState<LookupMode>("APARTMENT");
  const [checkInTarget, setCheckInTarget] = useState<GuestAuthorization | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);

  const handleCheckIn = (inv: GuestAuthorization) => {
    setCheckInTarget(inv);
  };

  const handleConfirmCheckIn = async () => {
    if (!checkInTarget) return;
    setCheckInLoading(true);
    try {
      await checkInGuest({ invitationId: checkInTarget.id, securityUserId });
      setCheckInSuccess(
        `✅ Ingreso de ${checkInTarget.guestName} registrado para Apto ${checkInTarget.apartmentNumber}.`,
      );
      setCheckInTarget(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error registrando el ingreso");
    } finally {
      setCheckInLoading(false);
    }
  };

  const tabs: { id: LookupMode; icon: string; label: string }[] = [
    { id: "APARTMENT", icon: "🏠", label: "Por apartamento" },
    { id: "CODE", icon: "💬", label: "Código WhatsApp" },
    { id: "QR", icon: "📷", label: "Escanear QR" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-1">Verificación de Invitados</h2>
        <p className="text-slate-500">
          Consulta las invitaciones pre-registradas por los residentes y confirma el ingreso.
        </p>
      </div>

      {checkInSuccess && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
          <span className="text-2xl shrink-0">🎉</span>
          <div className="flex-1">
            <p className="font-semibold text-emerald-800">{checkInSuccess}</p>
            <p className="text-sm text-emerald-600 mt-0.5">
              El residente será notificado del ingreso de su visitante.
            </p>
          </div>
          <button
            onClick={() => setCheckInSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xl font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Mode selector */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-sm transition-all ${
              mode === tab.id
                ? "bg-white shadow-sm text-indigo-700"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 min-h-[400px]">
        {mode === "APARTMENT" && (
          <ApartmentSearchTab complexId={complexId} onCheckIn={handleCheckIn} />
        )}
        {mode === "CODE" && (
          <AccessCodeTab complexId={complexId} onCheckIn={handleCheckIn} />
        )}
        {mode === "QR" && (
          <QRScannerTab complexId={complexId} onCheckIn={handleCheckIn} />
        )}
      </div>

      {/* Check-in confirmation modal */}
      {checkInTarget && (
        <CheckInModal
          inv={checkInTarget}
          onConfirm={handleConfirmCheckIn}
          onCancel={() => setCheckInTarget(null)}
          loading={checkInLoading}
        />
      )}
    </div>
  );
}
