"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Calendar,
  Clock,
  ChevronRight,
  Search,
  Activity,
  Loader2,
  Inbox,
} from "lucide-react";
import CreateAssemblyModal from "@/components/assemblies/CreateAssemblyModal";
import { createAssembly, fetchAssemblies } from "@/services/assembly.service";
import { useAppSelector } from "@/store/hooks";

// Diccionarios para la UI
const statusConfig: Record<
  string,
  { label: string; color: string; icon?: boolean }
> = {
  SCHEDULED: {
    label: "Programada",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  REGISTRATION_OPEN: {
    label: "Registro Abierto",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: true,
  },
  IN_PROGRESS: {
    label: "En Progreso",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: true,
  },
  FINISHED: {
    label: "Finalizada",
    color: "bg-purple-50 text-purple-700 border-purple-100",
  },
};

export default function AssembliesPage() {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Iniciamos en true para el primer render
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Formateador de fechas
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("es-CO", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  // Función para cargar los datos (la sacamos del useEffect para poder re-usarla)
  const loadAssemblies = async () => {
    if (!token || !activeComplex?.id) return;
    try {
      setLoading(true);
      const data = await fetchAssemblies({
        token,
        complexId: activeComplex.id,
      });
      setAssemblies(data.assemblies || []);
    } catch (error) {
      console.error("Error fetching assemblies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssemblies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeComplex?.id]);

  const handleCreateAssembly = async (data: {
    title: string;
    scheduled_for: string;
  }) => {
    try {
      setIsProcessing(true);

      // Usamos el ID real del conjunto
      await createAssembly(data, token!, activeComplex!.id);

      setIsCreateModalOpen(false);

      // Recargamos la lista para que aparezca la nueva asamblea instantáneamente
      await loadAssemblies();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Hubo un error al crear la asamblea");
    } finally {
      setIsProcessing(false);
    }
  };

  // LÓGICA DEL BUSCADOR: Filtramos el arreglo en memoria
  const filteredAssemblies = assemblies.filter((assembly) => {
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = assembly.title.toLowerCase().includes(searchLower);
    const dateMatch = assembly.scheduled_for.includes(searchTerm); // Permite buscar por año (ej: "2026")
    return titleMatch || dateMatch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-6">
      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            Asambleas y Votaciones
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">
            Gestiona los eventos, el quórum y las decisiones del conjunto.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all whitespace-nowrap flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva Asamblea</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por título o año..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
        />
      </div>

      {/* CONTENIDO PRINCIPAL: Loading, Empty State, o Grid */}
      {loading ? (
        // ESTADO 1: CARGANDO
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-500 font-bold animate-pulse">
            Cargando asambleas...
          </p>
        </div>
      ) : filteredAssemblies.length === 0 ? (
        // ESTADO 2: VACÍO (Sin asambleas o sin resultados de búsqueda)
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1 text-center">
            {searchTerm
              ? "No se encontraron resultados"
              : "Aún no hay asambleas"}
          </h3>
          <p className="text-sm text-slate-500 text-center max-w-md">
            {searchTerm
              ? `No encontramos ninguna asamblea que coincida con "${searchTerm}".`
              : "Programa la primera asamblea o votación de tu conjunto haciendo clic en el botón 'Nueva Asamblea'."}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        // ESTADO 3: GRILLA CON DATOS
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAssemblies.map((assembly) => {
            const statusDef =
              statusConfig[assembly.status] || statusConfig.SCHEDULED;

            return (
              <div
                key={assembly.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full"
              >
                {/* Parte superior de la tarjeta */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Contenedor del título y badge ajustado para flex-wrap */}
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                    <h3
                      className="text-lg font-bold text-slate-900 leading-tight w-full"
                      // Permite que el texto se corte con "..." si es absurdamente largo
                      style={{ wordBreak: "break-word" }}
                    >
                      {assembly.title}
                    </h3>
                    
                  </div>

                  {/* Fechas e info - MT-AUTO empuja esto hacia abajo si la tarjeta crece */}
                  <div className="space-y-3 mt-auto pt-4">
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        {" "}
                        {/* min-w-0 ayuda con truncamiento si es necesario */}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Fecha
                        </p>
                        <p className="text-sm font-bold capitalize truncate">
                          {formatDate(assembly.scheduled_for)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Hora
                        </p>
                        <p className="text-sm font-bold uppercase truncate">
                          {formatTime(assembly.scheduled_for)}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${statusDef.color}`}
                    >
                      {statusDef.icon && (
                        <Activity className="w-3 h-3 animate-pulse" />
                      )}
                      {statusDef.label}
                    </div>
                  </div>
                </div>

                {/* Botón inferior de la tarjeta */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto">
                  <button
                    onClick={() =>
                      router.push(`/dashboard/assemblies/${assembly.id}`)
                    }
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors group"
                  >
                    <span className="truncate mr-2">
                      {assembly.status === "SCHEDULED"
                        ? "Configurar Preguntas"
                        : "Entrar a la Sala"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CREACIÓN */}
      {isCreateModalOpen && (
        <CreateAssemblyModal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateAssembly}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
