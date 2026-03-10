'use client';

import { IPackage, PackageStatus } from '../packages.types';

interface PackageCardProps {
  package: IPackage;
  onDeliver: (pkg: IPackage) => void;
}

export function PackageCard({ package: pkg, onDeliver }: PackageCardProps) {
  const typeColors = {
    BOX: 'bg-amber-100 text-amber-800',
    ENVELOPE: 'bg-blue-100 text-blue-800',
    FOOD: 'bg-green-100 text-green-800',
    LAUNDRY: 'bg-purple-100 text-purple-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  const statusLabels = {
    PENDING_PICKUP: '⏳ Pending',
    DELIVERED: '✅ Delivered',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex gap-2">
          <span className={`inline-block rounded-md px-3 py-1 text-xs font-semibold ${typeColors[pkg.type]}`}>
            {pkg.type}
          </span>
          <span className={`inline-block rounded-md px-3 py-1 text-xs font-semibold ${
            pkg.status === 'PENDING_PICKUP'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {statusLabels[pkg.status]}
          </span>
        </div>
      </div>

      <div className="mb-3 space-y-1">
        <p className="text-sm font-semibold text-gray-900">
          {pkg.block_name} - Apt {pkg.apartment_number}
        </p>
        {pkg.carrier && (
          <p className="text-xs text-gray-600">
            <strong>Carrier:</strong> {pkg.carrier}
          </p>
        )}
        {pkg.notes && (
          <p className="text-xs text-gray-600">
            <strong>Notes:</strong> {pkg.notes}
          </p>
        )}
      </div>

      <div className="mb-3 border-t pt-3 text-xs text-gray-600">
        <p>
          <strong>Received:</strong> {formatDate(pkg.received_at)}
        </p>
        {pkg.status === 'DELIVERED' && pkg.picked_up_at && pkg.picked_up_by && (
          <>
            <p>
              <strong>Delivered:</strong> {formatDate(pkg.picked_up_at)}
            </p>
            <p>
              <strong>By:</strong> {pkg.picked_up_by}
            </p>
          </>
        )}
      </div>

      {pkg.status === 'PENDING_PICKUP' && (
        <button
          onClick={() => onDeliver(pkg)}
          className="w-full rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          Mark as Delivered
        </button>
      )}
    </div>
  );
}
