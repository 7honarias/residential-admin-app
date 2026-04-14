"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import { useAppSelector } from "@/store/hooks";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

// Mapeo de rutas a títulos (versión corta para móvil)
const pageTitle: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/notices": "Avisos",
  "/dashboard/pqrs": "PQRS",
  "/dashboard/finances": "Finanzas",
  "/dashboard/finances/payments": "Pagos",
  "/dashboard/finances/suppliers": "Proveedores",
  "/dashboard/apartments": "Apartamentos",
  "/dashboard/parking": "Parqueaderos",
  "/dashboard/packages": "Paquetería",
  "/dashboard/amenities": "Zonas",
  "/dashboard/assemblies": "Asambleas",
  "/dashboard/settings": "Configuración",
};

function getPageTitle(pathname: string): string {
  // Busca una coincidencia exacta primero
  if (pageTitle[pathname]) {
    return pageTitle[pathname];
  }
  
  // Si no, busca una coincidencia con prefijo (para subrutas)
  for (const [route, title] of Object.entries(pageTitle)) {
    if (pathname.startsWith(route) && pathname !== "/dashboard") {
      return title;
    }
  }
  
  return "AdminResidencial";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, token, user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pageHeading = getPageTitle(pathname);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      const redirectUrl = encodeURIComponent(pathname);
      router.replace(`/login?redirectTo=${redirectUrl}`);
      return;
    }
    if (user === null) return; // still loading — wait
    const allowedRoles = ["ADMIN", "STAFF"];
    if (!allowedRoles.includes(user.role)) {
      router.replace(user.role === "SECURITY" ? "/gatehouse" : "/login");
    }
  }, [isAuthenticated, token, user, router, pathname]);

  // Cerrar menú cuando cambia de ruta
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header con botón hamburguesa (solo móvil) */}
      <header className="lg:hidden flex items-center h-16 bg-white border-b border-gray-200 px-4 z-30">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Abrir menú"
        >
          <Menu className="w-6 h-6 text-slate-900" />
        </button>
        <span className="ml-3 font-medium text-sm text-slate-900 truncate">{pageHeading}</span>
      </header>

      {/* Contenido principal */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isMobileOpen={isMobileMenuOpen} onMobileOpenChange={setIsMobileMenuOpen} />
        <main className="flex-1 flex flex-col overflow-hidden lg:ml-64">
          <section className="p-4 lg:p-8 overflow-y-auto">{children}</section>
        </main>
      </div>
    </div>
  );
}
