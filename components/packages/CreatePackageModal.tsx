'use client';

import { useState } from 'react';
import { IPackage, PackageType } from '@/app/dashboard/packages/packages.types';
import { registerPackage } from '@/services/packages.service';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPackage: IPackage) => void;
  token: string;
  complexId: string;
  apartments: Array<{ id: string; number: string; block_name: string }>;
}

export function CreatePackageModal({
  isOpen,
  onClose,
  onSuccess,
  token,
  complexId,
  apartments,
}: CreatePackageModalProps) {
  const [type, setType] = useState<PackageType>('BOX');
  const [apartmentId, setApartmentId] = useState('');
  const [carrier, setCarrier] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const packageTypes: PackageType[] = ['BOX', 'ENVELOPE', 'FOOD', 'LAUNDRY', 'OTHER'];

  const filteredApartments = apartments.filter(
    (apt) =>
      apt.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.block_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!apartmentId.trim()) {
      setError('Apartment is required');
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
      setError(err instanceof Error ? err.message : 'Error registering package');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setType('BOX');
    setApartmentId('');
    setCarrier('');
    setNotes('');
    setSearchTerm('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Register Package</h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Package Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Package Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PackageType)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {packageTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Apartment */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Apartment *
            </label>
            <input
              type="text"
              placeholder="Search apartment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {filteredApartments.length > 0 && (
              <select
                value={apartmentId}
                onChange={(e) => setApartmentId(e.target.value)}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select apartment...</option>
                {filteredApartments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    {apt.block_name} - {apt.number}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Carrier */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Carrier (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., FedEx, UPS..."
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
