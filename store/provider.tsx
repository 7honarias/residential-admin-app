"use client";

import { Provider } from "react-redux";
import { store } from "./index";
import { useEffect } from "react";
import { setAuth, updateRole, logout } from "./slices/authSlice";
import { supabase } from "@/lib/supabaseClient";
import {
  setComplexes,
  setActiveComplex,
  clearComplex,
} from "./slices/complexSlice";
import { fetchUserComplexes } from "../services/complex.service";

function decodeTokenPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function extractMemberships(accessToken: string) {
  const payload = decodeTokenPayload(accessToken);
  const memberships = payload?.app_metadata?.memberships || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return memberships.map((m: any) => ({
    complex_id: m.complex_id as string,
    apartment_id: (m.apartment_id as string) || null,
    role: (m.role as string) || "USER",
    is_active: !!m.is_active,
  }));
}

function SessionSync({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1️⃣ Obtener sesión inicial
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        const { access_token, user } = data.session;

        const memberships = extractMemberships(access_token);
        const firstActive = memberships.find((m: { is_active: boolean }) => m.is_active) || memberships[0];

        store.dispatch(
          setAuth({
            token: access_token,
            user: {
              id: user.id,
              name: user.user_metadata?.full_name || user.user_metadata?.name || "",
              email: user.email || "",
              role: firstActive?.role || "USER",
              memberships,
            },
          }),
        );
      }
    };

    initSession();

    // 2️⃣ Escuchar cambios (login, logout, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const memberships = extractMemberships(session.access_token);
        const firstActive = memberships.find((m: { is_active: boolean }) => m.is_active) || memberships[0];

        store.dispatch(
          setAuth({
            token: session.access_token,
            user: {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
              email: session.user.email || "",
              role: firstActive?.role || "USER",
              memberships,
            },
          }),
        );
        let complexes = [];
        if (firstActive?.role === "SECURITY") {
          complexes = [{ id: firstActive.complex_id, name: "" }];
        } else {
          complexes = await fetchUserComplexes(session.access_token);
        }

        store.dispatch(setComplexes(complexes));

        // 🔥 Recuperar selección previa
        const savedComplexId =
          typeof window !== "undefined"
            ? localStorage.getItem("activeComplexId")
            : null;

        let selectedComplex = null;
        let matchedRole: string | null = null;

        if (savedComplexId) {
          // Verificar que el usuario tiene membership activa para este complejo
          const membership = memberships.find(
            (m: { complex_id: string; is_active: boolean }) => m.complex_id === savedComplexId && m.is_active,
          );
          if (membership) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            selectedComplex = complexes.find((c: any) => c.id === savedComplexId);
            if (selectedComplex) matchedRole = membership.role;
          }
        }

        // Si no hay guardado válido, usar el primer complejo que coincida con una membership activa
        if (!selectedComplex && memberships.length > 0) {
          for (const m of memberships) {
            if (!m.is_active) continue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const complex = complexes.find((c: any) => c.id === m.complex_id);
            if (complex) {
              selectedComplex = complex;
              matchedRole = m.role;
              break;
            }
          }
        }

        // Fallback: primer complejo disponible
        if (!selectedComplex && complexes.length > 0) {
          selectedComplex = complexes[0];
        }

        if (selectedComplex) {
          store.dispatch(setActiveComplex(selectedComplex));
          if (matchedRole) {
            store.dispatch(updateRole(matchedRole));
          }
        }
      } else {
        store.dispatch(logout());
        store.dispatch(clearComplex());
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <SessionSync>{children}</SessionSync>
    </Provider>
  );
}
