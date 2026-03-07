"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import { useAppSelector } from "@/store/hooks";
import { useRouter, usePathname } from "next/navigation"; // 👈 Añadir usePathname
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth); // 👈 Traemos el token también
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Solo redirigimos si isAuthenticated es false Y no hay un token en el estado
    // Esto nos da el margen de espera mientras SessionSync hace su trabajo
    if (!isAuthenticated && !token) {
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`/login?redirectTo=${redirectUrl}`);
    }
  }, [isAuthenticated, token, router, pathname]);

  // ⚡ IMPORTANTE: Si no está autenticado, no renderizamos el contenido.
  // Esto evita que el usuario vea el Sidebar un milisegundo antes de ser pateado al login.
  if (!isAuthenticated) {
    return null; // O un Spinner de carga
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <section className="p-8 overflow-y-auto">{children}</section>
      </main>
    </div>
  );
}