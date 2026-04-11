"use client";

import { useEffect, useState } from "react";


import { User, Plus, Tag } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { fetchApartments, assignCoefficientPricingToApartment } from "@/services/apartments.service";
import UploadApartmentsModal from "@/components/apartments/UploadApartmentsModal";
import SelectCoefficientModal from "@/components/apartments/SelectCoefficientModal";
import { CoefficientPricing } from "@/app/dashboard/apartments/apartment.types";
import { useRouter } from "next/navigation";

interface Block {
  id: string;
  name: string;
}

interface Apartment {
  id: string;
  number: string;
  floor: string | null;
  block_name: string;
  owner_name: string;
  owner_email: string | null;
}

export default function ApartmentsPage() {
  const token = useAppSelector((state) => state.auth.token);
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const [checkedApartments, setCheckedApartments] = useState<string[]>([]);
  const [coefficientModalOpen, setCoefficientModalOpen] = useState(false);
  const [assigningCoefficient, setAssigningCoefficient] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!token || !activeComplex?.id) return;

    const loadApartments = async () => {
      try {
        setLoading(true);

        const data = await fetchApartments({
          token,
          complexId: activeComplex.id,
        });

        setBlocks(data.blocks);
        setSelectedBlockId(data.current_block_id);
        setApartments(data.apartments);
      } catch (error) {
        console.error("Error fetching apartments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadApartments();
  }, [token, activeComplex?.id]);

  const allChecked =
    apartments.length > 0 &&
    apartments.every((apt) => checkedApartments.includes(apt.id));

  const toggleAll = () => {
    if (allChecked) {
      setCheckedApartments([]);
    } else {
      setCheckedApartments(apartments.map((apt) => apt.id));
    }
  };

  const toggleOne = (id: string) => {
    setCheckedApartments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssignCoefficient = async (coefficient: CoefficientPricing) => {
    if (!token || !activeComplex) return;
    setAssigningCoefficient(true);
    try {
      const BATCH_SIZE = 5;
      for (let i = 0; i < checkedApartments.length; i += BATCH_SIZE) {
        const batch = checkedApartments.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((apartmentId) =>
            assignCoefficientPricingToApartment({
              token: token!,
              complexId: activeComplex.id,
              apartmentId,
              pricingId: coefficient.id,
            })
          )
        );
      }
      setCheckedApartments([]);
    } finally {
      setAssigningCoefficient(false);
    }
  };

  // 🔹 Cuando cambia el bloque
  const handleBlockChange = async (blockId: string) => {
    if (!token || !activeComplex) return;

    try {
      setSelectedBlockId(blockId);
      setLoading(true);

      const data = await fetchApartments({
        token,
        complexId: activeComplex.id,
        blockId,
      });

      setApartments(data.apartments);
    } catch (error) {
      console.error("Error fetching apartments by block:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1️⃣ Header */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Apartamentos</h1>
        <div className="flex gap-2 flex-shrink-0">
          {checkedApartments.length > 0 && (
            <button
              onClick={() => setCoefficientModalOpen(true)}
              disabled={assigningCoefficient}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition whitespace-nowrap disabled:opacity-50"
            >
              <Tag className="w-4 h-4" />
              <span>Asignar coeficiente ({checkedApartments.length})</span>
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Cargar apartments</span>
            <span className="sm:hidden">Cargar</span>
          </button>
        </div>
      </div>

      {/* 2️⃣ Selector de Bloques */}
      <div className="flex gap-2 flex-wrap">
        {blocks.map((block) => (
          <button
            key={block.id}
            onClick={() => handleBlockChange(block.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedBlockId === block.id
                ? "bg-blue-600 text-white"
                : "bg-white border hover:bg-slate-50"
            }`}
          >
            {block.name}
          </button>
        ))}
      </div>

      {/* 4️⃣ Tabla */}
      <div className="bg-white rounded-xl margin-20 shadow-sm border border-slate-100 overflow-visible">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </th>
              <th className="p-4 text-sm font-semibold text-slate-600">
                Bloque
              </th>
              <th className="p-4 text-sm font-semibold text-slate-600">
                Unidad
              </th>
              <th className="p-4 text-sm font-semibold text-slate-600">
                Propietario
              </th>
              <th className="p-4 text-sm font-semibold text-slate-600">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  Cargando apartamentos...
                </td>
              </tr>
            ) : apartments.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  No hay apartamentos en este bloque
                </td>
              </tr>
            ) : (
              [...apartments]
                .sort((a, b) =>
                  a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: "base" })
                )
                .map((apt) => (
                <tr
                  key={apt.id}
                  className={`hover:bg-slate-50 ${
                    checkedApartments.includes(apt.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <td
                    className="p-4 w-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={checkedApartments.includes(apt.id)}
                      onChange={() => toggleOne(apt.id)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </td>
                  <td
                    className="p-4 text-slate-600 cursor-pointer"
                    onClick={() => router.push(`/dashboard/apartments/${apt.id}`)}
                  >
                    {apt.block_name}
                  </td>
                  <td
                    className="p-4 font-medium text-slate-700 cursor-pointer"
                    onClick={() => router.push(`/dashboard/apartments/${apt.id}`)}
                  >
                    {apt.number}
                  </td>
                  <td
                    className="p-4 cursor-pointer"
                    onClick={() => router.push(`/dashboard/apartments/${apt.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-sm text-slate-700">
                        {apt.owner_name}
                      </span>
                    </div>
                  </td>
                  <td
                    className="p-4 cursor-pointer"
                    onClick={() => router.push(`/dashboard/apartments/${apt.id}`)}
                  >
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      —
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UploadApartmentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      {token && activeComplex && (
        <SelectCoefficientModal
          isOpen={coefficientModalOpen}
          onClose={() => setCoefficientModalOpen(false)}
          onSelect={handleAssignCoefficient}
          token={token}
          complexId={activeComplex.id}
        />
      )}
    </div>
  );
}
