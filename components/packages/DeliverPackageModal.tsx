'use client';

import { useState } from 'react';
import { IPackage } from '@/app/dashboard/packages/packages.types';
import { deliverPackage } from '@/services/packages.service';

interface DeliverPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPackage: IPackage) => void;
  packageItem: IPackage | null;
  token: string;
  complexId: string;
}

export function DeliverPackageModal({
  isOpen,
  onClose,
  onSuccess,
  packageItem,
  token,
  complexId,
}: DeliverPackageModalProps) {
  const [pickedUpBy, setPickedUpBy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeLabels = {
    BOX: '📦 Caja',
    ENVELOPE: '✉️ Sobre',
    FOOD: '🍔 Comida',
    LAUNDRY: '👕 Lavandería',
    OTHER: '📋 Otro',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pickedUpBy.trim()) {
        setError('El nombre del destinatario es requerido');
      return;
    }

    if (!packageItem) {
        setError('La información del paquete está incompleta');
      return;
    }

    setIsLoading(true);
    try {
      const response = await deliverPackage({
        token,
        complexId,
        payload: {
          complex_id: complexId,
          package_id: packageItem.id,
          picked_up_by: pickedUpBy.trim(),
        },
      });

      onSuccess(response.package);
      setPickedUpBy('');
      onClose();
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al entregar el paquete');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !packageItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Marcar como Entregado</h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4 rounded-md bg-blue-50 p-3">
          <p className="text-sm font-medium text-gray-700">
            <strong>Apartamento:</strong>{' '}
            {packageItem.block_name} - {packageItem.apartment_number}
          </p>
          <p className="text-sm font-medium text-gray-700">
            <strong>Tipo:</strong> {typeLabels[packageItem?.type as keyof typeof typeLabels] || packageItem?.type}
          </p>
          {packageItem.carrier && (
            <p className="text-sm font-medium text-gray-700">
              <strong>Transportista:</strong> {packageItem.carrier}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre de quien recibe *
            </label>
            <input
              type="text"
              placeholder="p.ej., Juan Pérez"
              value={pickedUpBy}
              onChange={(e) => setPickedUpBy(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
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
              {isLoading ? 'Marcando...' : 'Marcar Entregado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
