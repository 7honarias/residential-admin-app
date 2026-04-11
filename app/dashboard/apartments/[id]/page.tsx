"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  ArrowLeft,
  UserPlus,
  Users,
  Home,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  FileText,
  TrendingUp,
  ParkingCircle,
} from "lucide-react"; // Iconos para mejor UX

import {
  getApartmentDetail,
  clearApartmentDetail,
} from "@/store/slices/apartmentDetail.slice";
import EditOwnerModal from "@/components/apartments/EditOwnerModal";
import { UpdateOwner, DeleteOwner } from "@/services/owners.service";
import AddResidentModal from "@/components/apartments/AddResidentModal";
import SelectCoefficientModal from "@/components/apartments/SelectCoefficientModal";
import { Resident, CoefficientPricing, Invoice } from "../apartment.types";
import { addResident, removeResident } from "@/services/resident.service";
import {
  assignCoefficientPricingToApartment,
} from "@/services/apartments.service";
//import { Owner } from "@/app/dashboard/apartments/apartment.types";

export default function ApartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [addResidentModalOpen, setAddResidentModalOpen] = useState(false);
  const [selectCoefficientModalOpen, setSelectCoefficientModalOpen] =
    useState(false);

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
    console.log("[handleUpdateOwner] called, ownerForm:", ownerForm, "activeComplex:", activeComplex?.id, "apartmentId:", apartmentId);
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

  const handleDeleteOwner = async (profileId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este propietario?")) return;
    if (!activeComplex?.id || !apartmentId) return;

    try {
      await DeleteOwner(activeComplex.id, apartmentId, profileId, "OWNER");
      fetchDetail();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || "Error al eliminar el propietario");
    }
  };

  const handleRemoveResident = async (residentId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este residente?"))
      return;

    if (!activeComplex?.id || !apartmentId) return;

    try {
      await removeResident(residentId, activeComplex.id, apartmentId, "RESIDENT");

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

  const handleSelectCoefficient = async (coefficient: CoefficientPricing) => {
    if (!token || !activeComplex?.id || !apartmentId) return;

    try {
      await assignCoefficientPricingToApartment({
        token,
        complexId: activeComplex.id,
        apartmentId,
        pricingId: coefficient.id,
      });

      fetchDetail();
      setSelectCoefficientModalOpen(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || "Error al asignar el coeficiente");
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

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    if (status === "OVERDUE")
      return "bg-red-100 text-red-700 border-red-200";
    if (status === "PAID")
      return "bg-green-100 text-green-700 border-green-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  const getStatusLabel = (status: string) => {
    if (status === "OVERDUE") return "Vencido";
    if (status === "PAID") return "Pagado";
    return status;
  };

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
                  onClick={() => handleDeleteOwner(apartment.owner!.id!)}
                  className="w-full py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                >
                  Eliminar Propietario
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

      {/* Coefficient Pricing Section */}
      {!apartment.coefficient_pricing && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Coeficiente de Precio
              </h2>
              <p className="text-sm text-slate-500">
                No hay coeficiente asignado a este apartamento
              </p>
            </div>
            <button
              onClick={() => setSelectCoefficientModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
            >
              Agregar Coeficiente
            </button>
          </div>
        </div>
      )}

      {apartment.coefficient_pricing && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Coeficiente de Precio
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Coeficiente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Metros
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actualizado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                    {apartment.coefficient_pricing.coefficient.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {apartment.coefficient_pricing.meters} m²
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                    {formatCurrency(apartment.coefficient_pricing.price)}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {apartment.coefficient_pricing.updated_at
                      ? new Date(apartment.coefficient_pricing.updated_at).toLocaleDateString(
                          "es-CO"
                        )
                      : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parkings Section */}
      {apartment.parkings && (apartment.parkings.private.length > 0 || apartment.parkings.assigned.length > 0) && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ParkingCircle className="w-5 h-5 text-orange-600" />
              Parqueaderos ({apartment.parkings.private.length + apartment.parkings.assigned.length})
            </h2>
          </div>
          

          {/* Private Parkings */}
          {apartment.parkings.private.length > 0 && (
            <div className="border-b border-slate-100">
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Parqueaderos Privados</p>
              </div>
              <div className="divide-y divide-slate-100">
                {apartment.parkings.private.map((parking) => (
                  <div
                    key={parking.id}
                    className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <ParkingCircle className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{parking.number}</p>
                        <p className="text-xs text-slate-500">Privado</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      Privado
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          
        </div>
      )}

      {/* No Parkings Message */}
      {(!apartment.parkings || (apartment.parkings.private.length === 0 && apartment.parkings.assigned.length === 0)) && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <ParkingCircle className="w-5 h-5 text-slate-300" />
            <p className="text-slate-500 text-sm">No hay parqueaderos registrados en esta unidad.</p>
          </div>
        </div>
      )}


      {/* Last Invoices Section */}
      {apartment.last_invoices && apartment.last_invoices.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Últimas Facturas
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {apartment.last_invoices.map((invoice: Invoice) => (
              <div
                key={invoice.id}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">
                      {invoice.description}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Período: {invoice.period_month}/{invoice.period_year} •
                      Vencimiento: {new Date(invoice.due_date).toLocaleDateString(
                        "es-CO"
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status === "PAID" ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {getStatusLabel(invoice.status)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-sm text-slate-600">
                    Monto: <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Saldo:{" "}
                    <span
                      className={`font-semibold ${
                        invoice.balance_due === 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(invoice.balance_due)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      
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

      <SelectCoefficientModal
        isOpen={selectCoefficientModalOpen}
        onClose={() => setSelectCoefficientModalOpen(false)}
        onSelect={handleSelectCoefficient}
        token={token || ""}
        complexId={activeComplex?.id || ""}
      />
    </div>
  );
}
