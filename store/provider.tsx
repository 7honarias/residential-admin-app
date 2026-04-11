"use client";

import { Provider } from "react-redux";
import { store } from "./index";
import { useEffect } from "react";
import { setAuth, logout } from "./slices/authSlice";
import { supabase } from "@/lib/supabaseClient";
import {
  setComplexes,
  setActiveComplex,
  clearComplex,
} from "./slices/complexSlice";
import { fetchUserComplexes } from "../services/complex.service";

function SessionSync({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1️⃣ Obtener sesión inicial
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        const { access_token, user } = data.session;

        store.dispatch(
          setAuth({
            token: access_token,
            user: {
              id: user.id,
              name: user.user_metadata?.name || "",
              email: user.email || "",
              role: user.user_metadata?.role || "USER",
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
        store.dispatch(
          setAuth({
            token: session.access_token,
            user: {
              id: session.user.id,
              name: session.user.user_metadata?.name || "",
              email: session.user.email || "",
              role: session.user.user_metadata?.role || "ADMIN",
            },
          }),
        );
        const complexes = await fetchUserComplexes(session.access_token);

        store.dispatch(setComplexes(complexes));

        // 🔥 Recuperar selección previa
        const savedComplexId =
          typeof window !== "undefined"
            ? localStorage.getItem("activeComplexId")
            : null;

        let selectedComplex = null;

        if (savedComplexId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          selectedComplex = complexes.find((c: any) => c.id === savedComplexId);
        }

        // ✅ Si existe el guardado, usarlo
        if (selectedComplex) {
          store.dispatch(setActiveComplex(selectedComplex));
        }
        // ✅ Si no existe pero hay complejos, usar el primero
        else if (complexes.length > 0) {
          store.dispatch(setActiveComplex(complexes[0]));
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
