'use client';

import { useState } from 'react';
import { IPackage } from '../packages.types';
import { deliverPackage } from '../../../services/packages.service';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pickedUpBy.trim()) {
      setError('Name of recipient is required');
      return;
    }

    if (!packageItem) {
      setError('Package information is missing');
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
      setError(err instanceof Error ? err.message : 'Error delivering package');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !packageItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Mark as Delivered</h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4 rounded-md bg-blue-50 p-3">
          <p className="text-sm font-medium text-gray-700">
            <strong>Apartment:</strong>{' '}
            {packageItem.block_name} - {packageItem.apartment_number}
          </p>
          <p className="text-sm font-medium text-gray-700">
            <strong>Type:</strong> {packageItem.type}
          </p>
          {packageItem.carrier && (
            <p className="text-sm font-medium text-gray-700">
              <strong>Carrier:</strong> {packageItem.carrier}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name of recipient *
            </label>
            <input
              type="text"
              placeholder="e.g., Juan Pérez"
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Delivering...' : 'Confirm Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
