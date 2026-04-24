"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppSelector } from "@/store/hooks";
import { Analytics } from "@/lib/analytics";
import { ShieldCheck } from "lucide-react";

const getRoleRedirect = (role: string | undefined | null): string =>
  role === "SECURITY" ? "/gatehouse" : "/dashboard";

type Step = "credentials" | "mfa";

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // After Redux marks the session as authenticated, check the AAL level.
  // If the user has an enrolled TOTP factor pending verification, show the
  // MFA step instead of redirecting. This handles the timing issue where
  // onAuthStateChange fires before we can intercept in handleLogin.
  useEffect(() => {
    if (!isAuthenticated) {
      setIsChecking(false);
      return;
    }
    // Already showing MFA step — don't re-check on token refresh
    if (step === "mfa") return;

    const checkMfa = async () => {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.nextLevel === "aal2" && aalData.nextLevel !== aalData.currentLevel) {
        setStep("mfa");
        setIsChecking(false);
        return;
      }
      const redirectTo = searchParams.get("redirectTo") || getRoleRedirect(user?.role);
      router.push(redirectTo);
    };
    checkMfa();
  }, [isAuthenticated, user, router, searchParams, step]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      }
      // On success, onAuthStateChange → Redux sets isAuthenticated=true →
      // the useEffect above will check AAL and either show MFA or redirect.
    } catch {
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError || !factorsData?.totp?.length) {
        setError("No se encontraron factores de autenticación.");
        return;
      }

      const factorId = factorsData.totp[0].id;

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError || !challengeData) {
        setError("Error al generar el desafío MFA.");
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: totpCode.replace(/\s/g, ""),
      });

      if (verifyError) {
        setError("Código incorrecto. Intenta de nuevo.");
        return;
      }

      Analytics.login();
      router.push(searchParams.get("redirectTo") || getRoleRedirect(user?.role));
    } catch {
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  if (isChecking || (isAuthenticated && step !== "mfa")) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        <div className="mb-5 flex justify-center">
          <Image
            src="/logo-web.png"
            alt="AdminResidencial"
            width={220}
            height={70}
            className="h-14 w-auto object-contain"
            priority
          />
        </div>

        {step === "credentials" ? (
          <>
            <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-sm mb-1">Correo electrónico</label>
                <input
                  type="email"
                  required
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-100 text-red-600 p-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center mb-6 gap-2">
              <ShieldCheck className="text-green-600" size={40} />
              <h1 className="text-2xl font-bold text-center">Verificación en dos pasos</h1>
              <p className="text-sm text-gray-500 text-center">
                Ingresa el código de 6 dígitos de tu aplicación autenticadora.
              </p>
            </div>
            <form onSubmit={handleMfaVerify} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-sm mb-1">Código de autenticación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="000000"
                  className="border rounded-lg p-2 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              {error && (
                <div className="bg-red-100 text-red-600 p-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || totpCode.length !== 6}
                className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? "Verificando..." : "Verificar"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("credentials"); setError(null); setTotpCode(""); }}
                className="text-sm text-gray-500 hover:underline text-center"
              >
                Volver al inicio de sesión
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
