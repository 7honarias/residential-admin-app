/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useParams } from "next/navigation";
import {
  Car,
  ArrowLeft,
  MapPin,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useCallback, useEffect, useState } from "react";
import {
  clearParkingDetail,
  getParkingDetail,
} from "@/store/slices/parkingDetail.slice";
import AssignApartmentModal from "@/components/parkings/AssignApartmentModal";
import VehicleModal from "@/components/parkings/VehicleModal";
import { manageParkingAction } from "@/services/parking.service";
import ChangeTypeModal from "@/components/parkings/ChangeTypeModal";

export default function ParkingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const parkingId = params?.id as string;
  const token = useAppSelector((state) => state.auth.token);
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);

  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const { data: parking, loading } = useAppSelector(
    (state) => state.parkingDetail,
  );

  const handleChangeType = async (newType: string) => {
    await handleAction("EDIT_TYPE", newType);
    setIsTypeModalOpen(false);
  };

  const activeComplexId = activeComplex?.id;

  const fetchDetail = useCallback(() => {
    if (!token || !activeComplexId || !parkingId) return;
    dispatch(
      getParkingDetail({
        token,
        complexId: activeComplexId,
        parkingId,
      }),
    );
  }, [token, activeComplexId, parkingId, dispatch]);

  useEffect(() => {
    fetchDetail();
    return () => {
      dispatch(clearParkingDetail());
    };
  }, [fetchDetail, dispatch]);

  // ==========================================
  // MANEJADOR UNIVERSAL DE ACCIONES (FALTABA ESTE BLOQUE)
  // ==========================================
  const handleAction = async (actionType: string, payload: any = {}) => {
    if (!activeComplexId || !token || !parkingId) return;

    try {
      setIsProcessing(true);

      // Llamamos a la API (Asegúrate de tener este servicio creado)
      await manageParkingAction(
        activeComplexId,
        parkingId,
        actionType,
        payload,
        token,
      );

      // Recargamos los datos al terminar
      fetchDetail();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Funciones específicas
  const openAssignAptModal = () => setIsAptModalOpen(true);

  const openVehicleModal = (isEdit = false) => {
    setIsEditingVehicle(isEdit);
    setIsVehicleModalOpen(true);
  };

  const handleAssignApartment = async (selectedAptId: string) => {
    await handleAction("ASSIGN_APARTMENT", { apartment_id: selectedAptId });
    setIsAptModalOpen(false);
  };

  const handleSaveVehicle = async (vehicleData: any) => {
    await handleAction("UPSERT_VEHICLE", vehicleData);
    setIsVehicleModalOpen(false);
  };

  const handleRemoveVehicle = () => {
    if (
      window.confirm("¿Estás seguro de que deseas desvincular este vehículo?")
    ) {
      handleAction("REMOVE_VEHICLE", { plate: parking?.vehicle?.currentPlate });
    }
  };

  // ==========================================
  // RENDERIZADOS CONDICIONALES
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse">
          Cargando información...
        </p>
      </div>
    );
  }

  if (!parking) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-indigo-600 font-bold mb-4 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="text-center mt-10">
          <p className="text-slate-500">Parqueadero no encontrado</p>
        </div>
      </div>
    );
  }

  // Estilos de los Badges
  const statusColor = {
    AVAILABLE: "bg-emerald-50 text-emerald-600 border-emerald-100",
    OCCUPIED: "bg-blue-50 text-blue-600 border-blue-100",
    MAINTENANCE: "bg-slate-50 text-slate-600 border-slate-100",
  };

  const typeLabel = {
    RESIDENT: "Residente",
    VISITOR: "Visitante",
    SERVICE: "Servicio",
    DISABLED: "Discapacitado",
  };

  const typeColor = {
    RESIDENT: "bg-indigo-50 text-indigo-600",
    VISITOR: "bg-amber-50 text-amber-600",
    SERVICE: "bg-purple-50 text-purple-600",
    DISABLED: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-8">
      {/* Header con botón volver */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex gap-2">
          {/* Botón para eliminar el parqueadero entero (Aún no tiene lógica) */}
          <button
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 font-bold text-sm hover:bg-rose-100 transition-all shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Eliminar Espacio
          </button>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel central - Información principal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">
                  Espacio #{parking.number}
                </h1>
                <p className="text-slate-500 font-medium">
                  {parking.type === "VISITOR" ? "Visitante" : "Residente"}
                </p>
              </div>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold ${statusColor[parking.status]}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    parking.status === "AVAILABLE"
                      ? "bg-emerald-400"
                      : parking.status === "OCCUPIED"
                        ? "bg-blue-600"
                        : "bg-slate-400"
                  }`}
                />
                {parking.status === "AVAILABLE" && "Disponible"}
                {parking.status === "OCCUPIED" && "Ocupado"}
                {parking.status === "MAINTENANCE" && "Mantenimiento"}
              </div>
            </div>

            {/* --- DETALLES Y GESTIÓN DEL VEHÍCULO --- */}
            {parking.vehicle?.currentPlate ? (
              // ESTADO 1: TIENE VEHÍCULO
              <div
                className={`bg-slate-50 rounded-xl p-6 space-y-4 relative group transition-all border ${isProcessing ? "opacity-50 pointer-events-none" : "border-transparent hover:border-slate-200"}`}
              >
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openVehicleModal(true)} // Pasa true para indicar edición
                    className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-200 transition-colors"
                    title="Editar datos del vehículo"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRemoveVehicle} // Llama a la función que valida y borra
                    className="p-2 bg-white text-slate-400 hover:text-rose-600 rounded-lg shadow-sm border border-slate-200 transition-colors"
                    title="Remover vehículo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center shadow-inner">
                    <Car className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">
                      Placa Registrada
                    </p>
                    <p className="text-2xl font-black text-slate-900 font-mono tracking-wider">
                      {parking.vehicle.currentPlate}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200/60">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">
                      Marca
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {parking.vehicle.vehicleBrand || "---"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">
                      Modelo
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {parking.vehicle.vehicleModel || "---"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">
                      Color
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {parking.vehicle.vehicleColor || "---"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // ESTADOS 2 y 3: NO TIENE VEHÍCULO (Empty State)
              <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 border-dashed p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm">
                  <Car className="w-6 h-6 text-slate-300" />
                </div>

                {parking.apartment?.apartmentNumber ? (
                  // ESTADO 2: Listo para asignar (Tiene Apto)
                  <>
                    <div>
                      <h3 className="text-sm font-bold text-slate-700">
                        Sin vehículo asignado
                      </h3>
                      <p className="text-[11px] font-medium text-slate-500 mt-1 max-w-[250px]">
                        El apartamento está configurado. Ya puedes registrar la
                        placa autorizada para este espacio.
                      </p>
                    </div>
                    <button
                      onClick={() => openVehicleModal(false)}
                      disabled={isProcessing}
                      className="mt-2 flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" /> Asignar Vehículo
                    </button>
                  </>
                ) : (
                  // ESTADO 3: Bloqueado (Falta Apto)
                  <>
                    <div>
                      <h3 className="text-sm font-bold text-slate-700">
                        Registro Bloqueado
                      </h3>
                      <p className="text-[11px] font-medium text-rose-500 mt-1 flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Primero debes asignar un apartamento
                      </p>
                    </div>
                    <button
                      disabled
                      className="mt-2 flex items-center gap-2 px-6 py-2.5 bg-slate-200 text-slate-400 font-bold text-sm rounded-xl cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" /> Asignar Vehículo
                    </button>
                  </>
                )}
              </div>
            )}
            {/* --- FIN DETALLES VEHÍCULO --- */}
          </div>
        </div>

        {/* Panel lateral - Información del propietario/apartamento */}
        <div className="space-y-6">
          {/* LÓGICA DE APARTAMENTO: Asignado vs No Asignado */}
          {parking.apartment?.apartmentNumber ? (
            <div
              className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm ${isProcessing ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Apartamento
                  </h3>
                </div>
                {/* Botón Modificar Apto */}
                <button
                  onClick={openAssignAptModal}
                  disabled={isProcessing}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold disabled:opacity-50"
                  title="Cambiar apartamento"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <p className="text-2xl font-black text-indigo-600">
                {parking.apartment.apartmentNumber}
                {parking.apartment.blockName && (
                  <span className="text-sm font-bold text-slate-400 ml-2">
                    ({parking.apartment.blockName})
                  </span>
                )}
              </p>
            </div>
          ) : (
            /* Caso 2: NO tiene apartamento pero es tipo RESIDENTE */
            parking.type === "RESIDENT" && (
              <div
                className={`bg-slate-50 rounded-2xl border-2 border-slate-200 border-dashed p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-3 ${isProcessing ? "opacity-50" : ""}`}
              >
                <div className="w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700">
                    Parqueadero Libre
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-1 max-w-[200px]">
                    Este espacio de residente no tiene un apartamento vinculado.
                  </p>
                </div>
                <button
                  onClick={openAssignAptModal}
                  disabled={isProcessing}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Asignar Apto
                </button>
              </div>
            )
          )}

          <div
            className={`rounded-2xl border p-6 shadow-sm ${typeColor[parking.type]} ${isProcessing ? "opacity-50" : ""}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm mb-2 opacity-80">
                  Tipo de Parqueadero
                </h3>
                <p className="text-2xl font-black">{typeLabel[parking.type]}</p>
              </div>
              <button
                onClick={() => setIsTypeModalOpen(true)}
                disabled={isProcessing}
                className="p-2 bg-white/40 text-slate-600 hover:bg-white hover:text-indigo-600 rounded-lg transition-colors flex items-center shadow-sm disabled:opacity-50"
                title="Cambiar tipo de parqueadero"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALES CONDICIONALES --- */}
      {isAptModalOpen && (
        <AssignApartmentModal
          onClose={() => setIsAptModalOpen(false)}
          onAssign={handleAssignApartment}
          isProcessing={isProcessing}
          // Pásale estas dos variables que ya tienes en el componente principal
          token={token!}
          complexId={activeComplexId!}
        />
      )}

      {isVehicleModalOpen && (
        <VehicleModal
          onClose={() => setIsVehicleModalOpen(false)}
          onSave={handleSaveVehicle}
          isProcessing={isProcessing}
          initialData={isEditingVehicle ? parking.vehicle : null}
        />
      )}

      {isTypeModalOpen && (
        <ChangeTypeModal
          onClose={() => setIsTypeModalOpen(false)}
          onSave={handleChangeType}
          isProcessing={isProcessing}
          currentType={parking.type}
        />
      )}
    </div>
  );
}
