"use client";

import { useEffect, useState } from "react";
import { User, Plus } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { fetchApartments } from "@/services/apartments.service";
import UploadApartmentsModal from "@/components/apartments/UploadApartmentsModal";
import RowActionsMenu from "@/components/apartments/RowActionsMenu";
import EditOwnerModal from "@/components/apartments/EditOwnerModal";
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(
    null,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
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
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Cargar apartments</span>
          <span className="sm:hidden">Cargar</span>
        </button>
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
              <th className="p-4 text-sm font-semibold text-slate-600">
                Unidad
              </th>
              <th className="p-4 text-sm font-semibold text-slate-600">
                Bloque
              </th>
              <th className="p-4 text-sm font-semibold text-slate-600">
                Propietario
              </th>
              <th className="p-4 text-sm font-semibold text-slate-600">
                Estado
              </th>
              <th className="p-4 text-sm font-semibold text-slate-600">
                Acciones
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
              apartments.map((apt) => (
                <tr
                  key={apt.id}
                  onClick={() => router.push(`/dashboard/apartments/${apt.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="p-4 font-medium text-slate-700">
                    {apt.number}
                  </td>
                  <td className="p-4 text-slate-600">{apt.block_name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-sm text-slate-700">
                        {apt.owner_name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      —
                    </span>
                  </td>
                  <td className="p-4 relative">
                    <RowActionsMenu
                      isOpen={openMenuId === apt.id}
                      onToggle={() =>
                        setOpenMenuId(openMenuId === apt.id ? null : apt.id)
                      }
                      onEditOwner={() => {
                        console.log("CLICK MODIFICAR");
                        setSelectedApartmentId(apt.id);
                        setSelectedOwner(apt ?? null);
                        setOwnerModalOpen(true);
                      }}
                      onEditResident={() => {
                        setSelectedApartmentId(apt.id);
                        setOpenMenuId(null);
                        console.log("Abrir modal residente", apt);
                      }}
                    />
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
      <EditOwnerModal
        isOpen={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
        apartmentId={selectedApartmentId}
        currentOwner={selectedOwner}
        onSave={async (owner) => {
          console.log(owner);
        }}
      />
    </div>
  );
}
