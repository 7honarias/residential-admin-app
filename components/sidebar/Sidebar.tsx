"use client";

import Link from "next/link";
import { Home, Building2, Coffee, Settings, LogOut, Car, Users, MessageSquare, Bell, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setActiveComplex } from "@/store/slices/complexSlice";
import { logout as logoutAction } from "@/store/slices/authSlice";
import { clearComplex } from "@/store/slices/complexSlice";

const menuItems = [
  { name: "Dashboard", icon: Home, href: "/dashboard" },
  { name: "Apartamentos", icon: Building2, href: "/dashboard/apartments" },
  { name: "Amenities", icon: Coffee, href: "/dashboard/amenities" },
  { name: "Parqueaderos", icon: Car, href: "/dashboard/parking" },
  { name: "Asambleas", icon: Users, href: "/dashboard/assemblies" },
  { name: "PQRS", icon: MessageSquare, href: "/dashboard/pqrs" },
  { name: "Avisos", icon: Bell, href: "/dashboard/notices" },
  { name: "Paquetes", icon: Package, href: "/dashboard/packages" },
  { name: "Configuración", icon: Settings, href: "/dashboard/settings" },

];

export default function Sidebar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { complexes, activeComplex } = useAppSelector((state) => state.complex);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = complexes.find((c) => c.id === e.target.value);
    if (selected) {
      dispatch(setActiveComplex(selected));
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Cerrando sesión...");
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
    <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col sticky top-0">
      <div className="p-6 text-2xl font-bold border-b border-slate-800">
        AdminResidencial
      </div>
      <div className="p-4">
        <select
          value={activeComplex?.id || ""}
          onChange={handleChange}
          className="w-full p-2 rounded bg-slate-800 text-white"
        >
          <option value="">Seleccionar Conjunto</option>
          {complexes.map((complex) => (
            <option key={complex.id} value={complex.id}>
              {complex.name}
            </option>
          ))}
        </select>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <item.icon className="w-5 h-5 text-slate-400 group-hover:text-white" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
