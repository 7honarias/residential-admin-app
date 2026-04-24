"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ShieldCheck, ShieldOff, Loader, QrCode } from "lucide-react";
import Image from "next/image";

type EnrollStep = "idle" | "qr" | "confirm" | "done";

interface EnrolledFactor {
  id: string;
  friendly_name?: string;
}

export default function MfaSetup() {
  const [enrolledFactor, setEnrolledFactor] = useState<EnrolledFactor | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Enroll flow
  const [enrollStep, setEnrollStep] = useState<EnrollStep>("idle");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [newFactorId, setNewFactorId] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFactors = async () => {
    setLoadingStatus(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data?.totp?.length) {
      const verified = data.totp.find((f) => f.status === "verified");
      setEnrolledFactor(verified ?? null);
    } else {
      setEnrolledFactor(null);
    }
    setLoadingStatus(false);
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const handleStartEnroll = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Autenticador",
      });
      if (error || !data) {
        setError(error?.message ?? "Error al iniciar configuración MFA.");
        return;
      }
      setNewFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setEnrollStep("qr");
    } catch {
      setError("Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEnroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: newFactorId,
        code: verifyCode.replace(/\s/g, ""),
      });
      if (error) {
        setError("Código incorrecto. Intenta de nuevo.");
        return;
      }
      setEnrollStep("done");
      await loadFactors();
    } catch {
      setError("Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!enrolledFactor) return;
    if (!confirm("¿Seguro que deseas desactivar la autenticación en dos pasos?")) return;
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: enrolledFactor.id });
      if (error) {
        setError(error.message);
        return;
      }
      setEnrolledFactor(null);
      setEnrollStep("idle");
    } catch {
      setError("Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEnroll = () => {
    setEnrollStep("idle");
    setVerifyCode("");
    setQrCode("");
    setSecret("");
    setNewFactorId("");
    setError(null);
  };

  if (loadingStatus) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader className="animate-spin" size={18} />
        <span>Cargando estado de seguridad...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6 flex flex-col gap-5 max-w-lg">
      <div className="flex items-center gap-3">
        {enrolledFactor ? (
          <ShieldCheck className="text-green-600" size={28} />
        ) : (
          <ShieldOff className="text-gray-400" size={28} />
        )}
        <div>
          <h2 className="font-semibold text-lg">Autenticación en dos pasos (2FA)</h2>
          <p className="text-sm text-gray-500">
            {enrolledFactor
              ? "La verificación en dos pasos está activa para tu cuenta."
              : "Agrega una capa adicional de seguridad a tu cuenta."}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Already enrolled */}
      {enrolledFactor && enrollStep !== "done" && (
        <button
          onClick={handleUnenroll}
          disabled={loading}
          className="flex items-center gap-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50 w-fit"
        >
          <ShieldOff size={16} />
          {loading ? "Desactivando..." : "Desactivar 2FA"}
        </button>
      )}

      {/* Not enrolled – idle */}
      {!enrolledFactor && enrollStep === "idle" && (
        <button
          onClick={handleStartEnroll}
          disabled={loading}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 w-fit"
        >
          <QrCode size={16} />
          {loading ? "Iniciando..." : "Activar autenticación en dos pasos"}
        </button>
      )}

      {/* QR step */}
      {enrollStep === "qr" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Escanea el código QR con tu aplicación autenticadora (Google Authenticator, Authy, etc.) y luego ingresa el código de 6 dígitos.
          </p>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="QR MFA" className="w-48 h-48 border rounded-lg" />
          </div>
          <details className="text-xs text-gray-400">
            <summary className="cursor-pointer">¿No puedes escanear? Ingresa el código manualmente</summary>
            <p className="mt-1 font-mono break-all bg-gray-100 rounded p-2">{secret}</p>
          </details>
          <form onSubmit={handleConfirmEnroll} className="flex flex-col gap-3">
            <div className="flex flex-col">
              <label className="text-sm mb-1">Código de verificación</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                placeholder="000000"
                className="border rounded-lg p-2 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || verifyCode.length !== 6}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? "Verificando..." : "Confirmar"}
              </button>
              <button
                type="button"
                onClick={handleCancelEnroll}
                className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition text-gray-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success */}
      {enrollStep === "done" && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg text-sm">
          <ShieldCheck size={18} />
          <span>¡Autenticación en dos pasos activada correctamente!</span>
        </div>
      )}
    </div>
  );
}
