"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { 
  Plus, 
  Settings2, 
  Users, 
  DollarSign, 
  CalendarCheck, 
  ChevronRight,
  Info,
} from "lucide-react";
import { fetchAmenities } from "../../../services/amenities.service";
import CreateAmenityModal from "@/components/amenities/CreateAmenityModal";
import { Amenity } from "./amenitie.tyes";

export default function AmenitiesPage() {
  const router = useRouter();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const token = useAppSelector((state) => state.auth.token);

  const activeComplex = useAppSelector((state) => state.complex.activeComplex);

  useEffect(() => {
    if (!token || !activeComplex?.id) return;
    const loadAmenities = async () => {
      try {
        setLoading(true);
        const data: Amenity[] = await fetchAmenities(activeComplex.id, token);
        setAmenities(data);
      } catch (error) {
        console.error("Error al cargar amenities:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAmenities();
  }, [token, activeComplex?.id]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">Amenities y Áreas Comunes</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona los espacios y servicios de {activeComplex?.name}</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-sm whitespace-nowrap flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva Amenity</span>
          <span className="sm:hidden">Agregar</span>
        </button>
      </div>

      {/* Grid de Amenities */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {amenities.length > 0 && amenities.map((amenity) => (
            <div 
              key={amenity.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${
                    amenity.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {amenity.is_active ? 'Disponible' : 'Inactivo'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1">{amenity.name}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                  {amenity.description || "Sin descripción disponible."}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    Capacidad: {amenity.capacity || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    {amenity.pricing_type === 'FREE' ? 'Gratis' : `$${amenity.price}`}
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <CalendarCheck className="w-4 h-4 text-slate-400" />
                    {amenity.booking_mode.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Botón Detalles */}
              <button
                onClick={() => router.push(`/dashboard/amenities/${amenity.id}`)}
                className="w-full py-3 bg-slate-50 border-t border-slate-100 text-slate-600 font-semibold text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                Ver detalles y reservas
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && amenities.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No se encontraron amenities.</p>
        </div>
      )}

      {/* Modal de Creación */}
      <CreateAmenityModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          const loadAmenities = async () => {
            if (!activeComplex?.id || !token) return;
            try {
              setLoading(true);
              const data = await fetchAmenities(activeComplex.id, token);
              setAmenities(data);
              
            } catch (error) {
              console.error("Error al cargar amenities:", error);
            } finally {
              setLoading(false);
            }
          };
          setIsModalOpen(false);
          loadAmenities();
        }}
      />
    </div>
  );
}

