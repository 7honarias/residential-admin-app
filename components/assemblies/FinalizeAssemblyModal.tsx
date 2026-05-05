/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * Modal de Finalización de Asamblea
 * Flujo de 4 pasos:
 *   1. Datos del Acta (número, tipo, ciudad, convocatoria)
 *   2. Firma del Secretario (autenticación en plataforma + canvas)
 *   3. Firma del Presidente del Consejo (autenticación + canvas)
 *   4. Generación y descarga del PDF final
 *
 * Cumple con Ley 675/2001 y Ley 527/1999 (firmas electrónicas).
 */

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  X,
  FileText,
  Pen,
  CheckCircle2,
  Download,
  Loader2,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  RotateCcw,
  Users,
  ListTodo,
  BarChart3,
  History,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { generateActaPDF, SignatureData, ActaData } from "@/lib/actaPDF";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface SignerInfo {
  fullName: string;
  documentId: string;
  email: string;
  password: string;
  signatureDataUrl: string;
  verified: boolean;
  signedAt: string;
}

interface FinalizeAssemblyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalize: () => Promise<void>;
  assembly: any;
  agenda: any[];
  polls: any[];
  logs: any[];
  attendanceList: any[];
  complexName: string;
  complexId: string;
}

// ── Canvas de Firma (componente interno) ─────────────────────────────────────

interface SignatureCanvasRef {
  toDataURL: () => string;
  isEmpty: () => boolean;
  clear: () => void;
}

const SignatureCanvas = forwardRef<SignatureCanvasRef, { disabled?: boolean }>(
  function SignatureCanvas({ disabled }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const hasDrawnRef = useRef(false);

    const getPos = (e: MouseEvent | TouchEvent, rect: DOMRect) => {
      if ("touches" in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Configurar el contexto de dibujo
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1e293b";

      const onStart = (e: MouseEvent | TouchEvent) => {
        if (disabled) return;
        e.preventDefault();
        isDrawingRef.current = true;
        const rect = canvas.getBoundingClientRect();
        const { x, y } = getPos(e, rect);
        ctx.beginPath();
        ctx.moveTo(x, y);
      };

      const onMove = (e: MouseEvent | TouchEvent) => {
        if (!isDrawingRef.current || disabled) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const { x, y } = getPos(e, rect);
        ctx.lineTo(x, y);
        ctx.stroke();
        hasDrawnRef.current = true;
      };

      const onEnd = () => {
        isDrawingRef.current = false;
      };

      canvas.addEventListener("mousedown", onStart);
      canvas.addEventListener("mousemove", onMove);
      canvas.addEventListener("mouseup", onEnd);
      canvas.addEventListener("mouseleave", onEnd);
      canvas.addEventListener("touchstart", onStart, { passive: false });
      canvas.addEventListener("touchmove", onMove, { passive: false });
      canvas.addEventListener("touchend", onEnd);

      return () => {
        canvas.removeEventListener("mousedown", onStart);
        canvas.removeEventListener("mousemove", onMove);
        canvas.removeEventListener("mouseup", onEnd);
        canvas.removeEventListener("mouseleave", onEnd);
        canvas.removeEventListener("touchstart", onStart);
        canvas.removeEventListener("touchmove", onMove);
        canvas.removeEventListener("touchend", onEnd);
      };
    }, [disabled]);

    useImperativeHandle(ref, () => ({
      toDataURL: () => canvasRef.current?.toDataURL("image/png") ?? "",
      isEmpty: () => !hasDrawnRef.current,
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawnRef.current = false;
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        width={420}
        height={120}
        className={`w-full border-2 rounded-xl bg-white touch-none ${
          disabled
            ? "border-slate-200 opacity-50 cursor-not-allowed"
            : "border-indigo-200 cursor-crosshair hover:border-indigo-400"
        }`}
        style={{ height: "120px" }}
      />
    );
  },
);

// ── Supabase auxiliar para verificar credenciales del firmante ──────────────
// Se usa una instancia separada para no afectar la sesión del administrador actual.
const signerSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { storageKey: "signer-verification-session", persistSession: false } },
);

// ── Paso de firma (reutilizable) ──────────────────────────────────────────────

interface SignerStepProps {
  role: "SECRETARIO" | "PRESIDENTE_CONSEJO";
  roleLabel: string;
  onComplete: (data: Omit<SignerInfo, "verified">) => void;
}

function SignerStep({ role, roleLabel, onComplete }: SignerStepProps) {
  const canvasRef = useRef<SignatureCanvasRef>(null);
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const handleVerifyAndSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !documentId.trim() || !email.trim() || !password.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (canvasRef.current?.isEmpty()) {
      setError("Por favor, dibuja tu firma en el recuadro antes de continuar.");
      return;
    }

    setIsVerifying(true);

    try {
      // Verificar identidad con las credenciales de la plataforma
      const { error: authError } = await signerSupabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(
          "Las credenciales no son válidas. Verifica tu correo y contraseña registrados en la plataforma.",
        );
        return;
      }

      // Cerrar la sesión temporal del signer (no queremos mantenerla)
      await signerSupabase.auth.signOut();

      setVerified(true);
      const signatureDataUrl = canvasRef.current!.toDataURL();

      onComplete({
        fullName: fullName.trim(),
        documentId: documentId.trim(),
        email: email.trim(),
        password: "",
        signatureDataUrl,
        signedAt: new Date().toISOString(),
      });
    } catch {
      setError("Ocurrió un error al verificar la identidad. Inténtalo de nuevo.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Encabezado del rol */}
      <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-slate-800 text-sm">{roleLabel}</p>
          <p className="text-xs text-slate-500">
            Ingresa tus credenciales de la plataforma para autenticar tu firma electrónica.
          </p>
        </div>
      </div>

      {verified ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-emerald-800">Firma registrada exitosamente</p>
            <p className="text-sm text-emerald-600">{fullName} · C.C. {documentId}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleVerifyAndSign} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: María García Ruiz"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                Cédula de ciudadanía
              </label>
              <input
                type="text"
                required
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Ej: 1020304050"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              Correo registrado en la plataforma
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="secretario@conjunto.com"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
              Contraseña de la plataforma
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Canvas de firma */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Firma manuscrita digital
              </label>
              <button
                type="button"
                onClick={() => canvasRef.current?.clear()}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Borrar
              </button>
            </div>
            <SignatureCanvas ref={canvasRef} />
            <p className="text-[10px] text-slate-400 mt-1.5">
              Dibuja tu firma con el ratón o con el dedo en pantalla táctil.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Verificando identidad...</>
            ) : (
              <><Shield className="w-4 h-4" /> Autenticar y Firmar Acta</>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Datos del Acta", icon: FileText },
  { id: 2, label: "Firma Secretario", icon: Pen },
  { id: 3, label: "Firma Presidente", icon: Pen },
  { id: 4, label: "Generar PDF", icon: Download },
];

export default function FinalizeAssemblyModal({
  isOpen,
  onClose,
  onFinalize,
  assembly,
  agenda,
  polls,
  logs,
  attendanceList,
  complexName,
  complexId,
}: FinalizeAssemblyModalProps) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  // Datos del acta (paso 1)
  const [actaNumber, setActaNumber] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
  );
  const [assemblyType, setAssemblyType] = useState<"ORDINARIA" | "EXTRAORDINARIA">("ORDINARIA");
  const [city, setCity] = useState("Bogotá D.C.");
  const [convocatoriaForm, setConvocatoriaForm] = useState("Correo electrónico y cartelera del conjunto");

  // Firmas
  const [secretaryData, setSecretaryData] = useState<Omit<SignerInfo, "verified"> | null>(null);
  const [presidentData, setPresidentData] = useState<Omit<SignerInfo, "verified"> | null>(null);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsGenerated(false);
      setPdfBlob(null);
      setSecretaryData(null);
      setPresidentData(null);
    }
  }, [isOpen]);

  const handleSecretaryComplete = useCallback((data: Omit<SignerInfo, "verified">) => {
    setSecretaryData(data);
    setTimeout(() => setStep(3), 800);
  }, []);

  const handlePresidentComplete = useCallback((data: Omit<SignerInfo, "verified">) => {
    setPresidentData(data);
    setTimeout(() => setStep(4), 800);
  }, []);

  const handleGeneratePDF = useCallback(async () => {
    if (!secretaryData || !presidentData) return;
    setIsProcessing(true);

    try {
      const signatures: SignatureData[] = [
        {
          role: "SECRETARIO",
          fullName: secretaryData.fullName,
          documentId: secretaryData.documentId,
          email: secretaryData.email,
          signatureDataUrl: secretaryData.signatureDataUrl,
          signedAt: secretaryData.signedAt,
        },
        {
          role: "PRESIDENTE_CONSEJO",
          fullName: presidentData.fullName,
          documentId: presidentData.documentId,
          email: presidentData.email,
          signatureDataUrl: presidentData.signatureDataUrl,
          signedAt: presidentData.signedAt,
        },
      ];

      const actaData: ActaData = {
        actaNumber,
        assemblyType,
        city,
        convocatoriaForm,
        complexName,
        assemblyTitle: assembly.title,
        scheduledFor: assembly.scheduled_for,
        startDate: assembly.start_date,
        endDate: assembly.end_date,
        address: assembly.address,
        quorumPercentage: assembly.quorum_percentage,
        attendeesCount: assembly.attendees_count,
        agenda,
        polls,
        logs,
        attendanceList,
        signatures,
      };

      const blob = generateActaPDF(actaData);
      setPdfBlob(blob);

      // ── Subir a Supabase Storage ──────────────────────────────────────────
      const safeName = assembly.title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
      const filePath = `${complexId}/${assembly.id}/acta_${actaNumber}_${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("assembly-acts")
        .upload(filePath, blob, {
          contentType: "application/pdf",
          upsert: true,
          metadata: { assembly_id: assembly.id, acta_number: actaNumber },
        });

      if (uploadError) {
        console.error("Error subiendo PDF:", uploadError);
        alert(
          `El PDF se generó correctamente pero no se pudo subir al servidor: ${uploadError.message}\n\nPuedes descargarlo localmente.`,
        );
        setIsGenerated(true);
        return;
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from("assembly-acts")
        .getPublicUrl(filePath);

      const fileUrl = urlData?.publicUrl ?? "";

      // ── Guardar metadatos en assembly_acts ───────────────────────────────
      const { error: dbError } = await supabase.from("assembly_acts").upsert(
        {
          assembly_id: assembly.id,
          complex_id: complexId,
          file_path: filePath,
          file_url: fileUrl,
          acta_number: actaNumber,
          assembly_type: assemblyType,
          secretary_name: secretaryData.fullName,
          secretary_document: secretaryData.documentId,
          president_name: presidentData.fullName,
          president_document: presidentData.documentId,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "assembly_id" },
      );

      if (dbError) {
        console.error("Error guardando metadatos del acta:", dbError);
        // No bloqueamos — el PDF ya está en Storage
      }

      // Limpiar nombre de variable no usada
      void safeName;

      setIsGenerated(true);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Ocurrió un error al generar el acta. Inténtalo de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    secretaryData,
    presidentData,
    actaNumber,
    assemblyType,
    city,
    convocatoriaForm,
    complexName,
    complexId,
    assembly,
    agenda,
    polls,
    logs,
    attendanceList,
  ]);

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = assembly.title.replace(/\s+/g, "_");
    link.download = `Acta_${actaNumber}_${safeName}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFinalizeAssembly = async () => {
    setIsProcessing(true);
    try {
      await onFinalize();
      onClose();
    } catch {
      alert("Error al finalizar la asamblea.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const closedPolls = polls.filter((p) => p.status === "CLOSED");
  const presentCount = attendanceList.filter((a) => a.is_present).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-800">Finalizar y Certificar Asamblea</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ley 675/2001 · Firmas electrónicas según Ley 527/1999
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="flex border-b border-slate-100 shrink-0">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <div
                key={s.id}
                className={`flex-1 flex flex-col items-center py-3 text-xs font-bold gap-1 transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : isDone
                      ? "text-emerald-600"
                      : "text-slate-400"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="hidden sm:block text-center leading-tight">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── PASO 1: Datos del Acta ────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h3 className="text-base font-black text-slate-800 mb-1">
                  Información del Acta
                </h3>
                <p className="text-sm text-slate-500">
                  Completa los datos formales del acta según los requisitos de la Ley 675 de 2001.
                </p>
              </div>

              {/* Resumen de la asamblea */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Users, label: "Asistentes", value: presentCount },
                  { icon: BarChart3, label: "Votaciones", value: closedPolls.length },
                  { icon: ListTodo, label: "Puntos agenda", value: agenda.length },
                  { icon: History, label: "Eventos", value: logs.length },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-200">
                    <Icon className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                    <p className="text-xl font-black text-slate-800">{value}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Número del Acta
                  </label>
                  <input
                    type="text"
                    value={actaNumber}
                    onChange={(e) => setActaNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Tipo de Asamblea
                </label>
                <div className="flex gap-3">
                  {(["ORDINARIA", "EXTRAORDINARIA"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAssemblyType(t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        assemblyType === t
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Forma de Convocatoria
                </label>
                <select
                  value={convocatoriaForm}
                  onChange={(e) => setConvocatoriaForm(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option>Correo electrónico y cartelera del conjunto</option>
                  <option>Correo certificado</option>
                  <option>WhatsApp y correo electrónico</option>
                  <option>Cartelera del conjunto</option>
                  <option>Comunicado puerta a puerta</option>
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                <p className="font-bold mb-1 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Nota Legal
                </p>
                <p className="text-xs leading-relaxed">
                  El acta generada tendrá plena validez jurídica según la Ley 675 de 2001.
                  Las firmas electrónicas se autenticarán con las credenciales de la
                  plataforma de cada firmante, garantizando no repudio e integridad del
                  documento conforme a la Ley 527 de 1999.
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Continuar a Firmas →
              </button>
            </div>
          )}

          {/* ── PASO 2: Firma del Secretario ─────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h3 className="text-base font-black text-slate-800 mb-1">
                  Firma del Secretario(a)
                </h3>
                <p className="text-sm text-slate-500">
                  El secretario de la asamblea debe autenticarse con sus credenciales de la
                  plataforma y dibujar su firma para certificar el acta.
                </p>
              </div>
              <SignerStep
                role="SECRETARIO"
                roleLabel="Secretario(a) de la Asamblea"
                onComplete={handleSecretaryComplete}
              />
            </div>
          )}

          {/* ── PASO 3: Firma del Presidente del Consejo ─────────────────────── */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h3 className="text-base font-black text-slate-800 mb-1">
                  Firma del Presidente del Consejo
                </h3>
                <p className="text-sm text-slate-500">
                  El presidente del consejo de administración debe autenticarse y dibujar
                  su firma para dar validez legal al acta.
                </p>
              </div>
              <SignerStep
                role="PRESIDENTE_CONSEJO"
                roleLabel="Presidente del Consejo de Administración"
                onComplete={handlePresidentComplete}
              />
            </div>
          )}

          {/* ── PASO 4: Generar PDF y Finalizar ──────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center py-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isGenerated ? "bg-emerald-100" : "bg-indigo-50"
                  }`}
                >
                  {isGenerated ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <FileText className="w-8 h-8 text-indigo-600" />
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">
                  {isGenerated ? "¡Acta Generada Exitosamente!" : "Generar Acta Oficial"}
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  {isGenerated
                    ? "El acta ha sido firmada digitalmente por el secretario y el presidente del consejo. Descárgala y guárdala en los registros del conjunto."
                    : "Ambas firmas electrónicas han sido registradas. Genera el PDF del acta con toda la información de la asamblea."}
                </p>
              </div>

              {/* Resumen de firmantes */}
              <div className="space-y-3">
                {[
                  { data: secretaryData, label: "Secretario(a)" },
                  { data: presidentData, label: "Presidente del Consejo" },
                ].map(({ data: d, label }) =>
                  d ? (
                    <div
                      key={label}
                      className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{d.fullName}</p>
                        <p className="text-xs text-slate-500">
                          {label} · C.C. {d.documentId}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                        ✓ Firmado
                      </span>
                    </div>
                  ) : null,
                )}
              </div>

              <div className="space-y-3 pt-2">
                {!isGenerated ? (
                  <button
                    onClick={handleGeneratePDF}
                    disabled={isProcessing}
                    className="w-full py-3.5 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generando acta...</>
                    ) : (
                      <><FileText className="w-4 h-4" /> Generar Acta PDF</>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleDownload}
                      className="w-full py-3.5 bg-emerald-600 text-white font-black text-sm rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Descargar Acta (PDF)
                    </button>
                    <button
                      onClick={handleFinalizeAssembly}
                      disabled={isProcessing}
                      className="w-full py-3.5 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Finalizando...</>
                      ) : (
                        "Finalizar Asamblea Oficialmente"
                      )}
                    </button>
                    <p className="text-center text-xs text-slate-400">
                      Al finalizar, la asamblea quedará cerrada y no podrá modificarse.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
