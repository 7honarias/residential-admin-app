"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ArrowLeft, UserPlus, Users, Home, Mail, Phone } from "lucide-react"; // Iconos para mejor UX

import {
  getApartmentDetail,
  clearApartmentDetail,
} from "@/store/slices/apartmentDetail.slice";
import EditOwnerModal from "@/components/apartments/EditOwnerModal";
import { UpdateOwner } from "@/services/owners.service";
import AddResidentModal from "@/components/apartments/AddResidentModal";
import { Resident } from "../apartment.types";
import { addResident, removeResident } from "@/services/resident.service";
//import { Owner } from "@/app/dashboard/apartments/apartment.types";

export default function ApartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [addResidentModalOpen, setAddResidentModalOpen] = useState(false);

  //const [isUpdating, setIsUpdating] = useState(false);

  const apartmentId = params?.id as string;
  const token = useAppSelector((state) => state.auth.token);
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const {
    data: apartment,
    loading,
    error,
  } = useAppSelector((state) => state.apartmentDetail);

  // Memorizamos la función de carga para re-usarla tras actualizar
  const fetchDetail = useCallback(() => {
    if (!token || !activeComplex?.id || !apartmentId) return;
    dispatch(
      getApartmentDetail({
        token,
        complexId: activeComplex.id,
        apartmentId,
      }),
    );
  }, [token, activeComplex?.id, apartmentId, dispatch]);

  useEffect(() => {
    fetchDetail();
    return () => {
      dispatch(clearApartmentDetail());
    };
  }, [fetchDetail, dispatch]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateOwner = async (ownerForm: any) => {
    if (!activeComplex?.id || !apartmentId) return;

    try {
      await UpdateOwner(ownerForm, activeComplex.id, apartmentId);

      fetchDetail();
      setOwnerModalOpen(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || "Error al actualizar propietario");
    } finally {
    }
  };

  const handleRemoveResident = async (residentId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este residente?"))
      return;

    if (!activeComplex?.id || !apartmentId) return;

    try {
      await removeResident(residentId, activeComplex.id, apartmentId);

      fetchDetail();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || "No se pudo eliminar al residente");
    }
  };

  const handleAddResident = async (residentForm: Resident) => {
    if (!activeComplex?.id || !apartmentId) return;

    try {
      await addResident(residentForm, activeComplex.id, apartmentId);

      fetchDetail();
      setAddResidentModalOpen(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || "Error al actualizar residente");
    } finally {
    }
  };

  if (loading)
    return (
      <div className="p-12 text-center animate-pulse text-slate-500">
        Cargando información...
      </div>
    );
  if (error)
    return (
      <div className="p-6 text-red-500 bg-red-50 rounded-lg m-6 border border-red-200">
        {error}
      </div>
    );
  if (!apartment)
    return <div className="p-6">No se encontró el apartamento.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Home className="w-6 h-6 text-blue-600" />
              Apartamento {apartment.number}
            </h1>
            <p className="text-slate-500 font-medium">
              Bloque: {apartment.block_name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Owner Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Propietario</h2>
            </div>

            {apartment.owner ? (
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-slate-800 font-semibold text-lg">
                    {apartment.owner.fullName}
                  </span>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                    <Mail className="w-4 h-4" />
                    {apartment.owner.email || "Sin correo"}
                  </div>
                  {apartment.owner.phone && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                      <Phone className="w-4 h-4" />
                      {apartment.owner.phone}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setOwnerModalOpen(true)}
                  className="w-full py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  Editar Información
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm mb-4">
                  Sin propietario asignado
                </p>
                <button
                  onClick={() => setOwnerModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                >
                  <UserPlus className="w-4 h-4" /> Asignar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Residents Card */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Residentes ({apartment.residents?.length ?? 0})
              </h2>
              <button
                className="text-sm font-semibold text-green-600 hover:text-green-700"
                onClick={() => setAddResidentModalOpen(true)}
              >
                + Agregar nuevo
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {apartment.residents?.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  No hay residentes registrados en esta unidad.
                </div>
              ) : (
                apartment.residents.map((resident) => (
                  <div
                    key={resident.id}
                    className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-sm">
                        {resident.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {resident.fullName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {resident.email || "Sin email"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveResident(resident.id)}
                      className="text-slate-400 hover:text-red-500 p-2"
                    >
                      Eliminar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <AddResidentModal
        isOpen={addResidentModalOpen}
        onClose={() => setAddResidentModalOpen(false)}
        apartmentId={apartmentId}
        onSave={handleAddResident}
      />

      <EditOwnerModal
        isOpen={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
        apartmentId={apartmentId}
        currentOwner={apartment.owner}
        onSave={handleUpdateOwner}
      />
    </div>
  );
}
