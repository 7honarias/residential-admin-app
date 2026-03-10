/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Play,
  Square,
  BarChart3,
  Plus,
  Settings,
  AlertCircle,
  CheckCircle2,
  ListTodo,
  History,
  Check,
  Send,
  Clock,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";

import CreatePollModal from "@/components/assemblies/CreatePollModal";
import { useAppSelector } from "@/store/hooks";
import {
  fetchAssemblyDetail,
  changeAssemblyStatus,
  updateAgenda,
  addLog,
} from "@/services/assembly.service";
import {
  createPoll,
  changePollStatus,
  deletePoll,
} from "@/services/poll.service";
import {
  fetchAttendanceList,
  toggleAttendance,
} from "@/services/attendance.service";

export default function AssemblyRoomPage() {
  const router = useRouter();
  const params = useParams();
  const assemblyId = params?.id as string;

  // --- ESTADOS GLOBALES ---
  const token = useAppSelector((state) => state.auth.token);
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);

  // --- ESTADOS DE DATOS REALES ---
  const [assembly, setAssembly] = useState<any>(null);
  const [polls, setPolls] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // --- ESTADOS DE UI ---
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("POLLS");
  const [newLogNote, setNewLogNote] = useState("");
  const [newAgendaItem, setNewAgendaItem] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);

  // --- ESTADOS DE ASISTENCIA ---
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [searchApt, setSearchApt] = useState("");
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  // --- ESTADOS DEL MODAL DE CHECK-IN ---
  const [checkInModalApt, setCheckInModalApt] = useState<any>(null);
  const [isProxy, setIsProxy] = useState(false);
  const [proxyName, setProxyName] = useState("");
  const [proxyId, setProxyId] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // ==========================================
  // CARGA DE DATOS (Fetch)
  // ==========================================
  const loadData = useCallback(async () => {
    if (!token || !activeComplex?.id || !assemblyId) return;

    try {
      const data = await fetchAssemblyDetail({
        token,
        complexId: activeComplex.id,
        assemblyId,
      });

      setAssembly(data.assembly);
      setPolls(data.polls || []);
      setAgenda(data.agenda || []);
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error cargando la sala:", error);
      alert("No se pudo cargar la información de la asamblea.");
      router.push("/dashboard/assemblies");
    } finally {
      setIsLoading(false);
    }
  }, [token, activeComplex?.id, assemblyId, router]);

  const loadAttendance = useCallback(async () => {
    try {
      setIsLoadingAttendance(true);
      const list = await fetchAttendanceList(
        token!,
        activeComplex!.id,
        assemblyId,
      );
      setAttendanceList(list);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [token, activeComplex, assemblyId]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "ATTENDANCE") {
      loadAttendance();
    }
  }, [activeTab, loadAttendance]);

  if (isLoading || !assembly) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">
          Cargando sala de asamblea...
        </p>
      </div>
    );
  }

  const isAgendaLocked =
    assembly.status === "IN_PROGRESS" || assembly.status === "FINISHED";

  // ==========================================
  // FUNCIONES DE ASISTENCIA Y QUÓRUM
  // ==========================================

  // Para hacer Check-Out (salida rápida desde el botón rojo)
  const handleToggleAttendance = async (aptId: string, isPresent: boolean) => {
    try {
      setAttendanceList((prev) =>
        prev.map((apt) =>
          apt.apartment_id === aptId ? { ...apt, is_present: !isPresent } : apt,
        ),
      );

      await toggleAttendance(
        token!,
        activeComplex!.id,
        assembly.id,
        aptId,
        isPresent,
      );

      await loadData();
    } catch (error: any) {
      alert(error.message);
      loadAttendance();
    }
  };

  const handleConfirmCheckIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!checkInModalApt) return;

    const aptIdToUpdate = checkInModalApt.apartment_id;

    try {
      setIsCheckingIn(true);
      
      // AHORA SIEMPRE ENVIAMOS EL NOMBRE Y LA CÉDULA
      const attendanceData = { 
        is_proxy: isProxy, // Manda true o false dependiendo del checkbox
        attendee_name: proxyName, 
        attendee_document: proxyId,
        can_vote: true
      };

      // 1. ACTUALIZACIÓN OPTIMISTA
      setAttendanceList((prev) =>
        prev.map((apt) =>
          apt.apartment_id === aptIdToUpdate ? { ...apt, is_present: true } : apt
        )
      );

      // 2. ENVIAMOS A LA API EN SEGUNDO PLANO
      await toggleAttendance(
        token!,
        activeComplex!.id,
        assembly.id,
        aptIdToUpdate,
        false, 
        attendanceData
      );

      // 3. CERRAMOS Y LIMPIAMOS
      setCheckInModalApt(null);
      setIsProxy(false);
      setProxyName("");
      setProxyId("");
      
      // 4. RECARGAMOS LOS DATOS GLOBALES
      await loadData();
      await loadAttendance();

    } catch (error: any) {
      console.error("Fallo el Check-in:", error);
      alert(`Error en el check-in: ${error.message}`);
      loadAttendance();
    } finally {
      setIsCheckingIn(false);
    }
  };

  const closeModal = () => {
    setCheckInModalApt(null);
    setIsProxy(false);
    setProxyName("");
    setProxyId("");
  };

  // ==========================================
  // FUNCIONES DEL EVENTO GENERAL
  // ==========================================
  const advanceAssemblyState = async () => {
    let newStatus: "REGISTRATION_OPEN" | "IN_PROGRESS" | "FINISHED" | null =
      null;

    if (assembly.status === "SCHEDULED") newStatus = "REGISTRATION_OPEN";
    else if (assembly.status === "REGISTRATION_OPEN") newStatus = "IN_PROGRESS";
    else if (assembly.status === "IN_PROGRESS") {
      if (
        !window.confirm(
          "¿Estás seguro de finalizar la asamblea? Ya no se podrán hacer más votaciones ni alterar el orden del día.",
        )
      )
        return;
      newStatus = "FINISHED";
    }

    if (!newStatus) return;

    try {
      setIsProcessing(true);
      await changeAssemblyStatus({
        token: token!,
        complexId: activeComplex!.id,
        payload: { assembly_id: assembly.id, status: newStatus },
      });
      await loadData();
    } catch (error: any) {
      alert(`Error al avanzar la asamblea: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // FUNCIONES DE VOTACIONES
  // ==========================================
  const handleCreatePoll = async (pollData: any) => {
    try {
      setIsProcessing(true);
      await createPoll({
        token: token!,
        complexId: activeComplex!.id,
        payload: { ...pollData, assembly_id: assembly.id },
      });
      alert("Pregunta guardada en borrador.");
      setIsCreatePollOpen(false);
      await loadData();
    } catch (error: any) {
      alert(`Error creando pregunta: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePollStatus = async (
    pollId: string,
    currentStatus: string,
  ) => {
    try {
      const newStatus = currentStatus === "DRAFT" ? "ACTIVE" : "CLOSED";

      if (newStatus === "ACTIVE" && assembly.status !== "IN_PROGRESS") {
        return alert(
          "La asamblea debe estar En Progreso para lanzar una votación.",
        );
      }
      if (
        newStatus === "CLOSED" &&
        !window.confirm(
          "¿Seguro que deseas cerrar la votación? Ya no se recibirán más votos.",
        )
      )
        return;

      await changePollStatus({
        token: token!,
        complexId: activeComplex!.id,
        payload: { poll_id: pollId, status: newStatus },
      });
      await loadData();
    } catch (error: any) {
      alert(`Error cambiando el estado: ${error.message}`);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      if (!window.confirm("¿Estás seguro de eliminar este borrador?")) return;
      await deletePoll({
        token: token!,
        complexId: activeComplex!.id,
        payload: { poll_id: pollId },
      });
      await loadData();
    } catch (error: any) {
      alert(`Error eliminando la pregunta: ${error.message}`);
    }
  };

  // ==========================================
  // FUNCIONES DE AGENDA
  // ==========================================
  const saveAgendaToDB = async (newAgenda: any[]) => {
    setAgenda(newAgenda);
    try {
      await updateAgenda({
        token: token!,
        complexId: activeComplex!.id,
        payload: { assembly_id: assembly.id, agenda: newAgenda },
      });
    } catch (error: any) {
      console.error("Error guardando agenda:", error);
      alert(`Error sincronizando la agenda: ${error.message}`);
      await loadData();
    }
  };

  const handleAddAgendaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgendaItem.trim() || isAgendaLocked) return;

    const textToAdd = newAgendaItem.trim();
    setNewAgendaItem("");

    const newItem = {
      id: Date.now().toString(),
      text: textToAdd,
      status: "PENDING",
    };

    const updatedAgenda = [...agenda, newItem];
    await saveAgendaToDB(updatedAgenda);
  };

  const toggleAgendaItem = async (id: string) => {
    if (assembly.status === "FINISHED") return;
    const updatedAgenda = agenda.map((item) =>
      item.id === id
        ? {
            ...item,
            status: item.status === "COMPLETED" ? "PENDING" : "COMPLETED",
          }
        : item,
    );
    await saveAgendaToDB(updatedAgenda);
  };

  const handleDeleteAgendaItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAgendaLocked) return;
    const updatedAgenda = agenda.filter((item) => item.id !== id);
    await saveAgendaToDB(updatedAgenda);
  };

  // ==========================================
  // FUNCIONES DE BITÁCORA (Logs)
  // ==========================================
  const handleAddLogNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogNote.trim()) return;

    try {
      await addLog({
        token: token!,
        complexId: activeComplex!.id,
        payload: {
          assembly_id: assembly.id,
          event_type: "NOTE",
          description: newLogNote,
        },
      });
      setNewLogNote("");
      await loadData();
    } catch (error: any) {
      alert(`Error guardando nota: ${error.message}`);
    }
  };

  // --- CONFIGURACIÓN VISUAL DEL ESTADO ---
  const statusConfig = {
    SCHEDULED: {
      label: "Programada",
      color: "bg-slate-100 text-slate-700",
      action: "Abrir Registro (Quórum)",
    },
    REGISTRATION_OPEN: {
      label: "Registro Abierto",
      color: "bg-amber-100 text-amber-700",
      action: "Iniciar Asamblea",
    },
    IN_PROGRESS: {
      label: "En Progreso",
      color: "bg-emerald-100 text-emerald-700",
      action: "Finalizar Asamblea",
    },
    FINISHED: {
      label: "Finalizada",
      color: "bg-purple-100 text-purple-700",
      action: "Generar Acta PDF",
    },
  };

  const currentStatusDef =
    statusConfig[assembly.status as keyof typeof statusConfig] ||
    statusConfig.SCHEDULED;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-6">
      {/* --- HEADER DE LA SALA --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/dashboard/assemblies")}
            className="flex items-center gap-2 text-indigo-600 font-bold mb-2 hover:text-indigo-700 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Asambleas
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 leading-tight">
              {assembly.title}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${currentStatusDef.color} border-current/20`}
            >
              {currentStatusDef.label}
            </span>
          </div>
        </div>
      </div>

      {/* --- CONTENEDOR PRINCIPAL (2 COLUMNAS) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA: PANEL DE TABS */}
        <div className="lg:col-span-2 flex flex-col h-full">
          {/* NAVEGACIÓN DE PESTAÑAS */}
          <div className="flex items-center gap-8 border-b border-slate-200 mb-6 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab("POLLS")}
              className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "POLLS" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <BarChart3 className="w-4 h-4" /> Votaciones
            </button>
            <button
              onClick={() => setActiveTab("AGENDA")}
              className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "AGENDA" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <ListTodo className="w-4 h-4" /> Orden del Día
            </button>
            <button
              onClick={() => setActiveTab("LOGS")}
              className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "LOGS" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <History className="w-4 h-4" /> Bitácora / Minuta
            </button>
            <button
              onClick={() => setActiveTab("ATTENDANCE")}
              className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "ATTENDANCE" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <Users className="w-4 h-4" /> Asistencia
            </button>
          </div>

          {/* --- CONTENIDO DE LAS PESTAÑAS --- */}

          {/* 1. PESTAÑA VOTACIONES */}
          {activeTab === "POLLS" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setIsCreatePollOpen(true)}
                  disabled={assembly.status === "FINISHED"}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Nueva Pregunta
                </button>
              </div>

              {polls.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm font-medium border border-dashed border-slate-300 rounded-2xl">
                  Aún no hay preguntas para esta asamblea. Crea la primera.
                </div>
              ) : (
                polls.map((poll) => (
                  <div
                    key={poll.id}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all shadow-sm ${poll.status === "ACTIVE" ? "border-indigo-500 ring-4 ring-indigo-50" : "border-slate-200"}`}
                  >
                    <div
                      className={`p-5 border-b ${poll.status === "ACTIVE" ? "bg-indigo-50/50 border-indigo-100" : "bg-slate-50/50 border-slate-100"}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                poll.status === "ACTIVE"
                                  ? "bg-indigo-600 text-white"
                                  : poll.status === "CLOSED"
                                    ? "bg-slate-200 text-slate-600"
                                    : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {poll.status === "ACTIVE"
                                ? "EN VIVO"
                                : poll.status === "CLOSED"
                                  ? "FINALIZADA"
                                  : "BORRADOR"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Mayoría{" "}
                              {poll.majority_type === "SIMPLE"
                                ? "Simple"
                                : "Calificada"}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 leading-snug">
                            {poll.question}
                          </h3>
                        </div>

                        <div className="flex gap-2">
                          {poll.status === "DRAFT" && (
                            <>
                              <button
                                onClick={() => handleDeletePoll(poll.id)}
                                className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                                title="Eliminar borrador"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleTogglePollStatus(poll.id, poll.status)
                                }
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-sm rounded-xl transition-colors whitespace-nowrap"
                              >
                                <Play className="w-4 h-4 fill-current" /> Lanzar
                              </button>
                            </>
                          )}
                          {poll.status === "ACTIVE" && (
                            <button
                              onClick={() =>
                                handleTogglePollStatus(poll.id, poll.status)
                              }
                              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-sm rounded-xl transition-colors whitespace-nowrap animate-pulse"
                            >
                              <Square className="w-4 h-4 fill-current" /> Cerrar
                              Votación
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {poll.options.map((option: any, idx: number) => (
                        <div key={idx}>
                          <div className="flex justify-between text-sm font-bold text-slate-700 mb-1.5">
                            <span>{option.label}</span>
                            <span>
                              {option.percentage}%{" "}
                              <span className="text-slate-400 font-medium text-xs ml-1">
                                ({option.votes} votos)
                              </span>
                            </span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                poll.status === "ACTIVE"
                                  ? "bg-indigo-500"
                                  : option.percentage >= 50
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                              }`}
                              style={{ width: `${option.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. PESTAÑA ORDEN DEL DÍA */}
          {activeTab === "AGENDA" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
              <div className="p-5 bg-slate-50 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 mb-1">
                  Orden del Día (Agenda)
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {isAgendaLocked
                    ? "La asamblea ya está en progreso o finalizada. Solo puedes marcar puntos como discutidos, pero no puedes agregar ni eliminar."
                    : "Agrega los puntos a tratar en la citación oficial."}
                </p>

                <form onSubmit={handleAddAgendaItem} className="flex gap-3">
                  <input
                    type="text"
                    value={newAgendaItem}
                    onChange={(e) => setNewAgendaItem(e.target.value)}
                    disabled={isAgendaLocked}
                    placeholder={
                      isAgendaLocked
                        ? "Agenda bloqueada por ley"
                        : "Ej: 1. Verificación de quórum..."
                    }
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={!newAgendaItem.trim() || isAgendaLocked}
                    className="px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-200 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" /> Agregar
                  </button>
                </form>
              </div>

              <div className="divide-y divide-slate-100">
                {agenda.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm font-medium">
                    Aún no hay puntos en el orden del día. Escribe uno arriba.
                  </div>
                ) : (
                  agenda.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleAgendaItem(item.id)}
                      className={`p-4 flex items-center gap-4 transition-colors group ${assembly.status !== "FINISHED" ? "hover:bg-slate-50 cursor-pointer" : ""}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${item.status === "COMPLETED" ? "bg-emerald-500 border-emerald-500" : "border-slate-300 group-hover:border-indigo-400"}`}
                      >
                        {item.status === "COMPLETED" && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>

                      <span
                        className={`flex-1 text-sm font-medium transition-all ${item.status === "COMPLETED" ? "text-slate-400 line-through" : "text-slate-700"}`}
                      >
                        {item.text}
                      </span>

                      {item.status !== "COMPLETED" && !isAgendaLocked && (
                        <button
                          onClick={(e) => handleDeleteAgendaItem(item.id, e)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar punto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 3. PESTAÑA BITÁCORA (LOGS) */}
          {activeTab === "LOGS" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px] animate-in fade-in duration-300">
              <div className="p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                <form onSubmit={handleAddLogNote} className="flex gap-3">
                  <input
                    type="text"
                    value={newLogNote}
                    onChange={(e) => setNewLogNote(e.target.value)}
                    placeholder="Escribe una nota manual para el acta (Ej: El apto 101 pide la palabra)..."
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newLogNote.trim()}
                    className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                  >
                    <Send className="w-4 h-4" /> Guardar
                  </button>
                </form>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {logs.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm font-medium py-10">
                    Aún no hay registros en la bitácora.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex gap-4">
                      <div className="w-12 pt-1 flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            log.type === "SYSTEM"
                              ? "bg-blue-100 text-blue-600"
                              : log.type === "POLL"
                                ? "bg-purple-100 text-purple-600"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {log.type === "SYSTEM" && (
                            <Settings className="w-4 h-4" />
                          )}
                          {log.type === "POLL" && (
                            <BarChart3 className="w-4 h-4" />
                          )}
                          {log.type === "NOTE" && (
                            <History className="w-4 h-4" />
                          )}
                        </div>
                        <div className="w-px h-full bg-slate-200 mt-2"></div>
                      </div>

                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {log.time}
                          </span>
                          {log.type === "NOTE" && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Nota Admin
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm ${log.type === "NOTE" ? "text-slate-800 font-medium" : "text-slate-600"}`}
                        >
                          {log.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. PESTAÑA DE ASISTENCIA */}
          {activeTab === "ATTENDANCE" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px] animate-in fade-in duration-300">
              <div className="p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar apartamento (Ej: 101)..."
                    value={searchApt}
                    onChange={(e) => setSearchApt(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {isLoadingAttendance ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                        <th className="p-4 font-bold">Unidad</th>
                        <th className="p-4 font-bold">Coeficiente</th>
                        <th className="p-4 font-bold">Estado</th>
                        <th className="p-4 font-bold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceList
                        .filter(
                          (apt) =>
                            apt.number
                              .toLowerCase()
                              .includes(searchApt.toLowerCase()) ||
                            apt.block
                              ?.toLowerCase()
                              .includes(searchApt.toLowerCase()),
                        )
                        .map((apt) => (
                          <tr
                            key={apt.apartment_id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-4">
                              <p className="font-bold text-slate-900">
                                {apt.block ? `${apt.block} - ` : ""}
                                {apt.number}
                              </p>
                            </td>
                            <td className="p-4 text-sm font-medium text-slate-600">
                              {apt.coefficient}%
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${apt.is_present ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                              >
                                {apt.is_present ? "Presente" : "Ausente"}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {apt.is_present ? (
                                <button
                                  onClick={() =>
                                    handleToggleAttendance(
                                      apt.apartment_id,
                                      true,
                                    )
                                  }
                                  className="px-4 py-2 text-xs font-bold rounded-xl transition-all bg-rose-50 text-rose-600 hover:bg-rose-100"
                                >
                                  Anular
                                </button>
                              ) : (
                                <button
                                  onClick={() => setCheckInModalApt(apt)}
                                  disabled={
                                    assembly.status === "SCHEDULED" ||
                                    assembly.status === "FINISHED"
                                  }
                                  className="px-4 py-2 text-xs font-bold rounded-xl transition-all bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  Registrar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: ESTADO Y QUÓRUM */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-6 z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Quórum en Vivo
            </h3>

            <div className="flex items-end gap-2 mb-2">
              <span
                className={`text-5xl font-black tracking-tight ${assembly.quorum_percentage >= 50 ? "text-emerald-600" : "text-amber-500"}`}
              >
                {assembly.quorum_percentage}%
              </span>
            </div>

            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-3 relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 z-10" />
              <div
                className={`h-full transition-all duration-1000 relative z-0 ${assembly.quorum_percentage >= 50 ? "bg-emerald-500" : "bg-amber-400"}`}
                style={{ width: `${assembly.quorum_percentage}%` }}
              />
            </div>

            <p className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
              {assembly.quorum_percentage >= 50 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Quórum
                  Legal Alcanzado
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-500" /> Esperando
                  quórum (mín. 50%)
                </>
              )}
            </p>

            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Asistentes
                </p>
                <p className="text-xl font-black text-slate-800">
                  {assembly.attendees_count}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("ATTENDANCE")}
                className="text-indigo-600 text-sm font-bold hover:underline"
              >
                Ver lista
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 shadow-lg text-white sticky top-[300px] z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Control del Evento
            </h3>
            <p className="text-sm text-slate-300 mb-6">
              Avanza el estado de la asamblea para permitir el registro o
              habilitar las votaciones.
            </p>
            <button
              onClick={advanceAssemblyState}
              disabled={assembly.status === "FINISHED" || isProcessing}
              className="w-full py-3.5 bg-white text-slate-900 font-black text-sm rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              {currentStatusDef.action}
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALES --- */}
      {isCreatePollOpen && (
        <CreatePollModal
          isOpen={true}
          onClose={() => setIsCreatePollOpen(false)}
          onSubmit={handleCreatePoll}
          isProcessing={isProcessing}
        />
      )}

      {/* --- MODAL DE CHECK-IN CON NOMBRES EN VEZ DE FOTO --- */}
      {checkInModalApt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800">
                Registrar Apto{" "}
                {checkInModalApt.block ? `${checkInModalApt.block}-` : ""}
                {checkInModalApt.number}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckIn} className="space-y-6">
              <div
                className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsProxy(!isProxy)}
              >
                <input
                  type="checkbox"
                  checked={isProxy}
                  readOnly
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                />
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    Asiste un Apoderado
                  </p>
                  <p className="text-xs text-slate-500">
                    Selecciona si la persona trae un poder firmado.
                  </p>
                </div>
              </div>

              <div className="space-y-4 animate-in slide-in-from-top-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">
                    Nombre del Apoderado
                  </label>
                  <input
                    type="text"
                    required
                    value={proxyName}
                    onChange={(e) => setProxyName(e.target.value)}
                    placeholder="Ej: Carlos Pérez"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">
                    Cédula del Apoderado
                  </label>
                  <input
                    type="text"
                    required
                    value={proxyId}
                    onChange={(e) => setProxyId(e.target.value)}
                    placeholder="Ej: 1020304050"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCheckingIn}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isCheckingIn && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
