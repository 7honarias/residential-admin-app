/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Search,
  ShieldCheck,
  Map,
  List,
  User,
  Ban,
  CheckCircle2,
  ChevronRight,
  Download,
  Upload,
} from "lucide-react";
import ImportParkingModal from "../../../components/parking/ImportParkingModal";
import { bulkLoadParkings, getListParkings } from "@/services/parking.service";
import { useAppSelector } from "@/store/hooks";

// --- Interfaces y Tipos ---
type ParkingType = "RESIDENT" | "VISITOR" | "SERVICE" | "DISABLED";
type ParkingStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

interface ParkingSlot {
  id: string;
  number: string;
  type: ParkingType;
  status: ParkingStatus;
  apartmentNumber?: string;
  currentPlate?: string;
}

export default function ParkingManagementPage() {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);

  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  const fetchParkings = useCallback(async () => {
    if (activeComplex && token) {
      try {
        setIsLoading(true);
        const parkingsData = await getListParkings(activeComplex.id, token);
        if (Array.isArray(parkingsData.parkings)) {
          setParkingSlots(parkingsData.parkings);
        } else {
          console.error("La respuesta de la API no es un array:", parkingsData);
          setParkingSlots([]);
        }
      } catch (error) {
        console.error("Error fetching parkings:", error);
        setParkingSlots([]); 
      } finally {
        setIsLoading(false);
      }
    }
  }, [activeComplex, token]);

  useEffect(() => {
    fetchParkings();
  }, [fetchParkings]);


  const handleImportSubmit = async (mappedRows: any[]) => {
    try {
      setIsUploading(true);
      
      if (!activeComplex || !token) {
        alert("Error: No hay un complejo activo seleccionado o token no disponible.");
        return;
      }
      
      const result = await bulkLoadParkings(activeComplex.id, mappedRows, token);
      
      console.log("Carga exitosa:", result);
      alert(`¡Éxito! Se procesaron ${result.parkings_processed} parqueaderos.`);
      fetchParkings();
      
    } catch (error: any) {
      alert(`Hubo un error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Lógica de filtrado
  const filteredParkings = useMemo(() => {
    if (!Array.isArray(parkingSlots)) return [];
    return parkingSlots.filter(
      (slot) =>
        slot.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slot.currentPlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slot.apartmentNumber?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, parkingSlots]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-8">
      {/* 1. HEADER ESTRATÉGICO */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Seguridad y Control</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestión de Parqueaderos
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Control de aforo y monitoreo de visitantes en tiempo real
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Botones de Utilidad */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              title="Importar datos"
              onClick={() => setShowImportModal(true)}
              className="p-2.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border-r border-slate-100"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              title="Exportar reporte"
              className="p-2.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por placa, apto o número..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1.5 rounded-xl mr-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Map className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <main>
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-500 font-medium">
              Cargando parqueaderos...
            </p>
          </div>
        ) : filteredParkings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 font-medium">
              No se encontraron parqueaderos.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 animate-in fade-in duration-500">
            {filteredParkings.map((slot) => (
              <ParkingSlotGridItem key={slot.id} slot={slot} />
            ))}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ParkingListTable data={filteredParkings} router={router} />
          </div>
        )}
      </main>
      <ImportParkingModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportSubmit}
      />
    </div>
  );
}

function ParkingSlotGridItem({ slot }: { slot: ParkingSlot }) {
  const isAvailable = slot.status === "AVAILABLE";
  const isOccupied = slot.status === "OCCUPIED";
  const isMaint = slot.status === "MAINTENANCE";

  return (
    <div
      className={`
      relative flex flex-col p-4 rounded-3xl border-2 transition-all group cursor-pointer
      ${isAvailable ? "bg-white border-slate-100 hover:border-indigo-200" : ""}
      ${isOccupied ? "bg-white border-slate-100 shadow-sm" : ""}
      ${isMaint ? "bg-slate-50 border-transparent opacity-60" : ""}
    `}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-black text-slate-400 tracking-tighter">
          {slot.number}
        </span>
        <div
          className={`w-2 h-2 rounded-full ${isAvailable ? "bg-emerald-400" : "bg-slate-300"}`}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-3 pb-4">
        <Car
          className={`w-10 h-10 transition-transform group-hover:scale-110 ${isAvailable ? "text-slate-100" : "text-slate-800"}`}
        />

        {isOccupied ? (
          <div className="text-center">
            <p className="text-[11px] font-black text-slate-900 leading-none font-mono tracking-wider">
              {slot.currentPlate}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
              {slot.apartmentNumber || "Visita"}
            </p>
          </div>
        ) : (
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            {isMaint ? "Bloqueado" : "Disponible"}
          </p>
        )}
      </div>

      <div
        className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-lg text-[8px] font-black border shadow-sm transition-colors ${
          slot.type === "VISITOR"
            ? "bg-amber-100 text-amber-700 border-amber-200"
            : "bg-slate-900 text-white border-slate-900 group-hover:bg-indigo-600 group-hover:border-indigo-600"
        }`}
      >
        {slot.type}
      </div>
    </div>
  );
}

function ParkingListTable({
  data,
  router,
}: {
  data: ParkingSlot[];
  router: any;
}) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              Espacio
            </th>
            <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              Estado
            </th>
            <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              Vehículo
            </th>
            <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              Apartamento
            </th>
            <th className="px-6 py-5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((slot) => (
            <tr
              key={slot.id}
              onClick={() => router?.push(`/dashboard/parking/${slot.id}`)}
              className="group hover:bg-slate-50/40 transition-colors cursor-pointer"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${
                      slot.type === "VISITOR"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    {slot.number}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {slot.type === "VISITOR" ? "Visitante" : "Residente"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      Zona A-1
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadgeItem slot={slot} />
              </td>
              <td className="px-6 py-4">
                {slot.currentPlate ? (
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border border-slate-200">
                    {slot.currentPlate}
                  </span>
                ) : (
                  <span className="text-slate-300 text-xs">---</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 font-bold text-slate-600 text-sm">
                  {slot.apartmentNumber ? (
                    <>
                      <User className="w-4 h-4 text-slate-300" /> Apto{" "}
                      {slot.apartmentNumber}
                    </>
                  ) : (
                    <span className="text-slate-300 font-medium text-xs">
                      Uso Temporal
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="p-2 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadgeItem({ slot }: { slot: ParkingSlot }) {
  if (slot.status === "AVAILABLE")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border border-emerald-100">
        <CheckCircle2 className="w-3 h-3" /> Libre
      </span>
    );
  if (slot.status === "MAINTENANCE")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase border border-slate-200">
        <Ban className="w-3 h-3" /> Inactivo
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase border border-blue-100">
      <Car className="w-3 h-3" /> Ocupado
    </span>
  );
}
