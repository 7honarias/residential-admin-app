"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, Building2, Coffee, Settings, LogOut, Car, 
  Users, MessageSquare, Bell, Package, DollarSign, Receipt,
  ChevronDown, ChevronRight, X 
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setActiveComplex, clearComplex } from "@/store/slices/complexSlice";
import { logout as logoutAction } from "@/store/slices/authSlice";

const menuGroups = [
  {
    label: "Principal",
    items: [
      { name: "Dashboard", icon: Home, href: "/dashboard" },
      { name: "Avisos", icon: Bell, href: "/dashboard/notices" },
      { name: "PQRS", icon: MessageSquare, href: "/dashboard/pqrs" },
    ]
  },
  {
    label: "Finanzas",
    items: [
      { name: "Facturación y Cartera", icon: DollarSign, href: "/dashboard/finances" },
      { name: "Historial de Pagos", icon: Receipt, href: "/dashboard/finances/payments" }, 
    ]
  },
  {
    label: "Inmuebles y Logística",
    items: [
      { name: "Apartamentos", icon: Building2, href: "/dashboard/apartments" },
      { name: "Parqueaderos", icon: Car, href: "/dashboard/parking" },
      { name: "Paquetería", icon: Package, href: "/dashboard/packages" },
    ]
  },
  {
    label: "Comunidad",
    items: [
      { name: "Zonas Comunes", icon: Coffee, href: "/dashboard/amenities" },
      { name: "Asambleas", icon: Users, href: "/dashboard/assemblies" },
    ]
  },
  {
    label: "Sistema",
    items: [
      { name: "Configuración", icon: Settings, href: "/dashboard/settings" },
    ]
  }
];

export default function Sidebar({ isMobileOpen, onMobileOpenChange }: { isMobileOpen?: boolean; onMobileOpenChange?: (open: boolean) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { complexes, activeComplex } = useAppSelector((state) => state.complex);

  // Estado para los grupos desplegables (Acordeón)
  // Iniciamos "Principal" y "Finanzas" abiertos por defecto
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Principal": true,
    "Finanzas": true,
  });

  // Usa props del layout o estado local como fallback
  const isOpen = isMobileOpen !== undefined ? isMobileOpen : false;
  const setIsOpen = onMobileOpenChange || (() => {});

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = complexes.find((c) => c.id === e.target.value);
    if (selected) {
      dispatch(setActiveComplex(selected));
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      dispatch(logoutAction());
      dispatch(clearComplex());
      localStorage.removeItem("activeComplexId");
      router.replace("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <>
      {/* --- FONDO OSCURO (OVERLAY) PARA MÓVIL --- */}
      {/* Oscurece el resto de la pantalla cuando el menú está abierto */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 top-16 bg-black/50 z-30 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* --- SIDEBAR PRINCIPAL --- */}
      {/* Usa fixed en ambos casos para mantenerlo siempre visible. Se oculta con -translate-x-full en móvil si está cerrado */}
      <aside
        className={`w-64 bg-slate-900 text-white h-screen flex flex-col fixed top-16 lg:top-0 left-0 z-40 lg:z-20 transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header con botón para cerrar (X) en móvil */}
        <div className="p-6 text-xl font-bold border-b border-slate-800 shrink-0 flex justify-between items-center">
          <span className="truncate">AdminResidencial</span>
          <button 
            className="lg:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 shrink-0">
          <select
            value={activeComplex?.id || ""}
            onChange={handleChange}
            className="w-full p-2.5 rounded bg-slate-800 text-sm text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar Conjunto</option>
            {complexes.map((complex) => (
              <option key={complex.id} value={complex.id}>
                {complex.name}
              </option>
            ))}
          </select>
        </div>

        {/* Navegación con Acordeones */}
        <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group) => (
            <div key={group.label} className="mb-2">
              
              {/* Botón que despliega/oculta el grupo */}
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
              >
                <span>{group.label}</span>
                {openGroups[group.label] ? (
                  <ChevronDown className="w-4 h-4 transition-transform" />
                ) : (
                  <ChevronRight className="w-4 h-4 transition-transform" />
                )}
              </button>

              {/* Contenedor animado de los enlaces */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openGroups[group.label] ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
                }`}
              >
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                            isActive
                              ? "bg-blue-600/10 text-blue-400 font-medium"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <item.icon
                            className={`w-5 h-5 transition-colors ${
                              isActive ? "text-blue-400" : "text-slate-400 group-hover:text-white"
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-800 shrink-0 bg-slate-900">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
