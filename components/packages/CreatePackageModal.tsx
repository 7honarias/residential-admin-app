'use client';

import { useState, useEffect } from 'react';
import { IPackage, PackageType } from '@/app/dashboard/packages/packages.types';
import { registerPackage } from '@/services/packages.service';
import { fetchApartments } from '@/services/apartments.service';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPackage: IPackage) => void;
  token: string;
  complexId: string;
  blocks?: Array<{ id: string; name: string }>;
}

export function CreatePackageModal({
  isOpen,
  onClose,
  onSuccess,
  token,
  complexId,
  blocks = [],
}: CreatePackageModalProps) {
  const [type, setType] = useState<PackageType>('BOX');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [apartmentId, setApartmentId] = useState('');
  const [carrier, setCarrier] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredApartments, setFilteredApartments] = useState<Array<{ id: string; number: string; block_name: string; block_id?: string }>>([]);
  const [isLoadingApartments, setIsLoadingApartments] = useState(false);

  const packageTypes: PackageType[] = ['BOX', 'ENVELOPE', 'FOOD', 'LAUNDRY', 'OTHER'];

  const packageTypeLabels = {
    BOX: '📦 Caja',
    ENVELOPE: '✉️ Sobre',
    FOOD: '🍔 Comida',
    LAUNDRY: '👕 Lavandería',
    OTHER: '📋 Otro',
  };

  const resetForm = () => {
    setType('BOX');
    setSelectedBlock('');
    setApartmentId('');
    setCarrier('');
    setNotes('');
    setError(null);
  };

  // Auto-load first block when modal opens
  useEffect(() => {
    if (isOpen && blocks.length > 0) {
      // Set the first block as selected
      setSelectedBlock(blocks[0].id);
      setApartmentId(''); // Reset apartment when opening
      setError(null);
    } else if (!isOpen) {
      // Reset form when modal closes
      resetForm();
    }
  }, [isOpen, blocks]);

  // Fetch apartments for selected block
  useEffect(() => {
    if (!selectedBlock || !token || !complexId) {
      setFilteredApartments([]);
      return;
    }

    const loadApartmentsByBlock = async () => {
      try {
        setIsLoadingApartments(true);
        const response = await fetchApartments({
          token,
          complexId,
          blockId: selectedBlock,
        });

        // Map and filter to only include apartments from this block
        const blockApartments = (response.apartments || [])
          .filter(apt => apt.block_name === blocks.find(b => b.id === selectedBlock)?.name)
          .map((apt) => ({
            id: apt.id,
            number: apt.number,
            block_name: apt.block_name,
            block_id: selectedBlock,
          }));

        setFilteredApartments(blockApartments);
        setApartmentId(''); // Reset apartment selection when block changes
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los apartamentos');
        setFilteredApartments([]);
      } finally {
        setIsLoadingApartments(false);
      }
    };

    loadApartmentsByBlock();
  }, [selectedBlock, token, complexId, blocks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!apartmentId.trim()) {
        setError('El apartamento es requerido');
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerPackage({
        token,
        complexId,
        payload: {
          complex_id: complexId,
          apartment_id: apartmentId,
          type,
          carrier: carrier || undefined,
          notes: notes || undefined,
        },
      });

      onSuccess(response.package);
      resetForm();
      onClose();
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al registrar el paquete');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Registrar Paquete</h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Package Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Paquete *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PackageType)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {packageTypes.map((t) => (
                <option key={t} value={t}>
                  {packageTypeLabels[t as keyof typeof packageTypeLabels]}
                </option>
              ))}
            </select>
          </div>

          {/* Block Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bloque/Torre *
            </label>
            <select
              value={selectedBlock}
              onChange={(e) => {
                setSelectedBlock(e.target.value);
                setApartmentId(''); // Reset apartment when block changes
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Selecciona un bloque...</option>
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.name}
                </option>
              ))}
            </select>
          </div>

          {/* Apartment Selection */}
          {selectedBlock && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Apartamento *
              </label>
              {isLoadingApartments ? (
                <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  Cargando apartamentos...
                </div>
              ) : (
                <select
                  value={apartmentId}
                  onChange={(e) => setApartmentId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Selecciona apartamento...</option>
                  {filteredApartments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      Apt {apt.number}
                    </option>
                  ))}
                </select>
              )}
              {!isLoadingApartments && filteredApartments.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">No hay apartamentos en este bloque</p>
              )}
            </div>
          )}

          {/* Carrier */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Transportista (opcional)
            </label>
            <input
              type="text"
              placeholder="p.ej., FedEx, UPS..."
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
