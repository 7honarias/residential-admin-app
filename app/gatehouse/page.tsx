/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout as logoutAction } from "@/store/slices/authSlice";
import { supabase } from "@/lib/supabaseClient";
import { IPackage, PackageStatus } from "@/app/dashboard/packages/packages.types";
import { fetchPackages } from "@/services/packages.service";
import { fetchApartments } from "@/services/apartments.service";
import { PackageCard } from "@/components/packages/PackageCard";
import { CreatePackageModal } from "@/components/packages/CreatePackageModal";
import { DeliverPackageModal } from "@/components/packages/DeliverPackageModal";
import VehicleControlPanel from "@/components/parkings/VehicleControlPanel";
import DigitalLogbookModule from "@/components/gatehouse/DigitalLogbookModule";

// Tipos para simular nuestra base de datos
type TabType = "VISITORS" | "VEHICLES" | "PACKAGES" | "LOGS";

export default function GatehouseDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token, isAuthenticated, user } = useAppSelector((state) => state.auth);
  const complexId = useAppSelector((state) => state.complex.activeComplex?.id);

  // Route guard: only SECURITY users can access this page
  // Wait for user to be resolved before redirecting (async session restore)
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace("/login");
      return;
    }
    if (user === null) return; // still loading — wait
    if (user.role !== "SECURITY") {
      const adminRoles = ["ADMIN", "STAFF"];
      router.replace(adminRoles.includes(user.role) ? "/dashboard" : "/login");
    }
  }, [isAuthenticated, token, user, router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      dispatch(logoutAction());
      router.replace("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Estado para bloques
  const [blocks, setBlocks] = useState<{ id: string; name: string }[]>([]);

  // Cargar bloques al montar
  useEffect(() => {
    if (!token || !complexId) return;
    const loadBlocks = async () => {
      try {
        const response = await fetchApartments({ token, complexId });
        setBlocks(response.blocks.map((block: any) => ({ id: block.id, name: block.name })));
      } catch (err) {
        // Opcional: manejar error de carga de bloques
      }
    };
    loadBlocks();
  }, [token, complexId]);

  const [activeTab, setActiveTab] = useState<TabType>("VISITORS");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [showDeliverPackage, setShowDeliverPackage] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<IPackage | null>(null);
  const [packageStatus, setPackageStatus] = useState<PackageStatus>("PENDING_PICKUP");
  const [pendingPackages, setPendingPackages] = useState<IPackage[]>([]);
  const [deliveredPackages, setDeliveredPackages] = useState<IPackage[]>([]);
  const [packageCursor, setPackageCursor] = useState<string | null>(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [packageSearch, setPackageSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Cargar paquetes
  const loadPackages = useCallback(
    async (cursor?: string) => {
      if (!token || !complexId) return;
      setIsLoadingPackages(true);
      setError(null);
      try {
        const response = await fetchPackages({
          token,
          complexId,
          options: {
            status: packageStatus,
            limit: 10,
            cursor,
          },
        });
        if (cursor) {
          if (packageStatus === "PENDING_PICKUP") {
            setPendingPackages((prev) => [...prev, ...response.packages]);
          } else {
            setDeliveredPackages((prev) => [...prev, ...response.packages]);
          }
        } else {
          if (packageStatus === "PENDING_PICKUP") {
            setPendingPackages(response.packages);
          } else {
            setDeliveredPackages(response.packages);
          }
        }
        setPackageCursor(response.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando paquetes");
      } finally {
        setIsLoadingPackages(false);
      }
    },
    [token, complexId, packageStatus]
  );

  // Cargar paquetes al cambiar status o al montar
  useEffect(() => {
    if (!token || !complexId) return;
    loadPackages();
  }, [token, complexId, packageStatus, loadPackages]);

  // Handlers para registrar y entregar paquetes
  const handleRegisterPackageSuccess = (newPackage: IPackage) => {
    if (newPackage.status === "PENDING_PICKUP") {
      setPendingPackages((prev) => [newPackage, ...prev]);
    } else {
      setDeliveredPackages((prev) => [newPackage, ...prev]);
    }
  };

  const handleDeliverPackageSuccess = (updatedPackage: IPackage) => {
    setPendingPackages((prev) => prev.filter((pkg) => pkg.id !== updatedPackage.id));
    setDeliveredPackages((prev) => [updatedPackage, ...prev]);
  };

  // Filtrado de paquetes
  const currentPackages = packageStatus === "PENDING_PICKUP" ? pendingPackages : deliveredPackages;
  const filteredPackages = currentPackages.filter((pkg) =>
    pkg.apartment_number?.toLowerCase().includes(packageSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">

      {/* Header con botón cerrar sesión */}
      <header className="flex items-center justify-between bg-white px-4 py-3 shadow-sm border-b border-slate-200 lg:px-8">
        <h1 className="text-xl font-bold text-slate-800">🏢 Portería</h1>
        <div className="flex items-center gap-4">
          {user?.name && (
            <span className="text-sm font-medium text-slate-600">
              👤 {user.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </header>

      {/* 2. ÁREA DE TRABAJO PRINCIPAL - Ocupa todo el ancho (Full Width) */}
      <main className="flex-1 max-w-screen-2xl w-full mx-auto p-4 lg:p-8">
        <div className="space-y-8">
          
          {/* Navegación de Pestañas - Botones más grandes y legibles */}
          <div className="flex overflow-x-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            {[
              { id: "VISITORS", icon: "🚶", label: "Visitantes" },
              { id: "VEHICLES", icon: "🚗", label: "Vehículos" },
              { id: "PACKAGES", icon: "📦", label: "Paquetes" },
              { id: "LOGS", icon: "📝", label: "Bitácora" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span className="text-2xl">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Área Dinámica Principal */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[600px]">
            
            {/* --- VISITANTES --- */}
            {activeTab === "VISITORS" && (
              <div className="animate-fade-in max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">
                  Registrar Ingreso de Visitante
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button className="p-10 border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition flex flex-col items-center justify-center gap-6 group">
                    <div className="w-24 h-24 bg-slate-100 group-hover:bg-white rounded-full flex items-center justify-center text-5xl shadow-sm transition-transform group-hover:scale-110">
                      🛵
                    </div>
                    <span className="font-bold text-xl text-slate-700 group-hover:text-indigo-700">
                      Domicilio / Delivery
                    </span>
                  </button>
                  <button className="p-10 border-2 border-dashed border-slate-300 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-6 group">
                    <div className="w-24 h-24 bg-slate-100 group-hover:bg-white rounded-full flex items-center justify-center text-5xl shadow-sm transition-transform group-hover:scale-110">
                      👨‍👩‍👧
                    </div>
                    <span className="font-bold text-xl text-slate-700 group-hover:text-emerald-700">
                      Visita Familiar / Personal
                    </span>
                  </button>
                  <button className="p-10 border-2 border-dashed border-slate-300 rounded-2xl hover:border-amber-500 hover:bg-amber-50 transition flex flex-col items-center justify-center gap-6 group md:col-span-2 lg:col-span-1">
                    <div className="w-24 h-24 bg-slate-100 group-hover:bg-white rounded-full flex items-center justify-center text-5xl shadow-sm transition-transform group-hover:scale-110">
                      🛠️
                    </div>
                    <span className="font-bold text-xl text-slate-700 group-hover:text-amber-700">
                      Contratista / Soporte
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* --- VEHÍCULOS --- */}
            {activeTab === 'VEHICLES' && (
              <div className="animate-fade-in flex justify-center">
                 <div className="w-full max-w-4xl">
                    {/* Al tener más ancho, tu VehicleControlPanel se verá mucho más imponente */}
                    <VehicleControlPanel />
                 </div>
              </div>
            )}

            {/* --- PAQUETES --- */}
            {activeTab === "PACKAGES" && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">
                    📦 Gestión de Paquetes
                  </h2>
                  <button
                    onClick={() => setShowCreatePackage(true)}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-lg font-bold text-white hover:bg-blue-700 shadow-md transition-colors"
                  >
                    + Nuevo Paquete
                  </button>
                </div>

                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Tabs de Paquetes */}
                  <div className="border-b border-gray-200 bg-gray-50 px-6">
                    <div className="flex gap-8">
                      <button
                        onClick={() => {
                          setPackageStatus("PENDING_PICKUP");
                          setPackageCursor(null);
                        }}
                        className={`border-b-4 px-2 py-5 font-bold text-lg ${
                          packageStatus === "PENDING_PICKUP"
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        Pendientes de Entrega ({pendingPackages.length})
                      </button>
                      <button
                        onClick={() => {
                          setPackageStatus("DELIVERED");
                          setPackageCursor(null);
                        }}
                        className={`border-b-4 px-2 py-5 font-bold text-lg ${
                          packageStatus === "DELIVERED"
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        Ya Entregados ({deliveredPackages.length})
                      </button>
                    </div>
                  </div>

                  {/* Buscador de Paquetes */}
                  <div className="px-6 py-5 border-b border-gray-200 bg-white">
                    <input
                      type="text"
                      placeholder="🔍 Buscar por número de apartamento..."
                      value={packageSearch}
                      onChange={(e) => setPackageSearch(e.target.value)}
                      className="w-full rounded-xl border-2 border-gray-200 px-5 py-4 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 outline-none transition"
                    />
                  </div>

                  {/* Grid de Paquetes */}
                  <div className="bg-gray-50 px-6 py-8 min-h-[300px]">
                    {error && (
                      <div className="rounded-xl bg-red-100 p-5 text-lg text-red-800 mb-6 font-medium">
                        {error}
                      </div>
                    )}
                    
                    {filteredPackages.length === 0 ? (
                      <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-16 text-center">
                        <span className="text-4xl block mb-4">📭</span>
                        <p className="text-xl text-gray-500 font-medium">No hay paquetes en esta categoría</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredPackages.map((pkg) => (
                          <PackageCard
                            key={pkg.id}
                            package={pkg}
                            onDeliver={(pkg) => {
                              setSelectedPackage(pkg);
                              setShowDeliverPackage(true);
                            }}
                          />
                        ))}
                      </div>
                    )}
                    
                    {packageCursor && (
                      <div className="mt-8 flex justify-center">
                        <button
                          onClick={() => loadPackages(packageCursor)}
                          disabled={isLoadingPackages}
                          className="rounded-xl border-2 border-gray-300 bg-white px-8 py-3 text-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-sm transition"
                        >
                          {isLoadingPackages ? "Cargando..." : "Cargar Más"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- LOGS / BITÁCORA --- */}
            {activeTab === "LOGS" && (
              <div className="animate-fade-in max-w-5xl mx-auto">
                {token && complexId ? (
                  <DigitalLogbookModule token={token} complexId={complexId} />
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
                    <p className="text-xl font-medium text-amber-800">Inicia sesion y selecciona un conjunto para usar la bitacora.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modales para crear y entregar paquetes */}
      <CreatePackageModal
        isOpen={showCreatePackage}
        onClose={() => setShowCreatePackage(false)}
        onSuccess={handleRegisterPackageSuccess}
        token={token!}
        complexId={complexId!}
        blocks={blocks}
      />
      <DeliverPackageModal
        isOpen={showDeliverPackage}
        onClose={() => {
          setShowDeliverPackage(false);
          setSelectedPackage(null);
        }}
        onSuccess={handleDeliverPackageSuccess}
        packageItem={selectedPackage}
        token={token!}
        complexId={complexId!}
      />
    </div>
  );
}   