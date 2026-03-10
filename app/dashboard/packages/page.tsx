'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  fetchPackages,
  fetchAlerts,
} from '@/services/packages.service';
import { IPackage, IQuickAlert, PackageStatus } from './packages.types';
import { CreatePackageModal } from '@/components/packages/CreatePackageModal';
import { DeliverPackageModal } from '@/components/packages/DeliverPackageModal';
import { CreateQuickAlertModal } from '@/components/packages/CreateQuickAlertModal';
import { PackageCard } from '@/components/packages/PackageCard';
import { AlertItem } from '@/components/packages/AlertItem';

// Mock data - replace with real data from your backend
const MOCK_APARTMENTS = [
  { id: 'apt_1', number: '101', block_name: 'Torre A' },
  { id: 'apt_2', number: '102', block_name: 'Torre A' },
  { id: 'apt_3', number: '201', block_name: 'Torre B' },
  { id: 'apt_4', number: '202', block_name: 'Torre B' },
];

const MOCK_BLOCKS = [
  { id: 'block_1', name: 'Torre A' },
  { id: 'block_2', name: 'Torre B' },
];

export default function PackagesPage() {
  const token = useAppSelector((state) => state.auth.token);
  const complexId = useAppSelector((state) => state.complex.activeComplex?.id);

  // Packages state
  const [packageStatus, setPackageStatus] = useState<PackageStatus>('PENDING_PICKUP');
  const [pendingPackages, setPendingPackages] = useState<IPackage[]>([]);
  const [deliveredPackages, setDeliveredPackages] = useState<IPackage[]>([]);
  const [packageCursor, setPackageCursor] = useState<string | null>(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [packageSearch, setPackageSearch] = useState('');

  // Alerts state
  const [alerts, setAlerts] = useState<IQuickAlert[]>([]);
  const [alertCursor, setAlertCursor] = useState<string | null>(null);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  // Modals state
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [showDeliverPackage, setShowDeliverPackage] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<IPackage | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Load initial packages
  useEffect(() => {
    if (!token || !complexId) return;
    loadPackages();
    loadAlerts();
  }, [token, complexId, packageStatus]);

  const loadPackages = async (cursor?: string) => {
    if (!token || !complexId) return;

    setIsLoadingPackages(true);
    setError(null);

    try {
      const response = await fetchPackages({
        token,
        complexId,
        options: {
          status: packageStatus,
          limit: 10,
          cursor,
        },
      });

      if (cursor) {
        if (packageStatus === 'PENDING_PICKUP') {
          setPendingPackages((prev) => [...prev, ...response.packages]);
        } else {
          setDeliveredPackages((prev) => [...prev, ...response.packages]);
        }
      } else {
        if (packageStatus === 'PENDING_PICKUP') {
          setPendingPackages(response.packages);
        } else {
          setDeliveredPackages(response.packages);
        }
      }

      setPackageCursor(response.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading packages');
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const loadAlerts = async (cursor?: string) => {
    if (!token || !complexId) return;

    setIsLoadingAlerts(true);
    setError(null);

    try {
      const response = await fetchAlerts({
        token,
        complexId,
        options: {
          limit: 10,
          cursor,
        },
      });

      if (cursor) {
        setAlerts((prev) => [...prev, ...response.alerts]);
      } else {
        setAlerts(response.alerts);
      }

      setAlertCursor(response.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading alerts');
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const handleRegisterPackageSuccess = (newPackage: IPackage) => {
    if (newPackage.status === 'PENDING_PICKUP') {
      setPendingPackages((prev) => [newPackage, ...prev]);
    } else {
      setDeliveredPackages((prev) => [newPackage, ...prev]);
    }
  };

  const handleDeliverPackageSuccess = (updatedPackage: IPackage) => {
    setPendingPackages((prev) =>
      prev.filter((pkg) => pkg.id !== updatedPackage.id)
    );
    setDeliveredPackages((prev) => [updatedPackage, ...prev]);
  };

  const handleCreateAlertSuccess = (newAlert: IQuickAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const currentPackages =
    packageStatus === 'PENDING_PICKUP' ? pendingPackages : deliveredPackages;

  const filteredPackages = currentPackages.filter((pkg) =>
    pkg.apartment_number?.toLowerCase().includes(packageSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Packages & Alerts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage package deliveries and send quick alerts to residents
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main Content - Packages Section */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">📦 Packages</h2>
            <button
              onClick={() => setShowCreatePackage(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Register Package
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-8">
            <button
              onClick={() => {
                setPackageStatus('PENDING_PICKUP');
                setPackageCursor(null);
              }}
              className={`border-b-2 px-0 py-4 font-medium text-sm ${
                packageStatus === 'PENDING_PICKUP'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              Pending ({pendingPackages.length})
            </button>
            <button
              onClick={() => {
                setPackageStatus('DELIVERED');
                setPackageCursor(null);
              }}
              className={`border-b-2 px-0 py-4 font-medium text-sm ${
                packageStatus === 'DELIVERED'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              Delivered ({deliveredPackages.length})
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search by apartment number..."
            value={packageSearch}
            onChange={(e) => setPackageSearch(e.target.value)}
            className="w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Packages Grid */}
        <div className="px-6 py-6">
          {filteredPackages.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <p className="text-sm text-gray-600">No packages to show</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  onDeliver={(pkg) => {
                    setSelectedPackage(pkg);
                    setShowDeliverPackage(true);
                  }}
                />
              ))}
            </div>
          )}

          {packageCursor && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => loadPackages(packageCursor)}
                disabled={isLoadingPackages}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoadingPackages ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">🔔 Quick Alerts</h2>
            <button
              onClick={() => setShowCreateAlert(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Send Alert
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="px-6 py-6">
          {alerts.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <p className="text-sm text-gray-600">No alerts sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          )}

          {alertCursor && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => loadAlerts(alertCursor)}
                disabled={isLoadingAlerts}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoadingAlerts ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreatePackageModal
        isOpen={showCreatePackage}
        onClose={() => setShowCreatePackage(false)}
        onSuccess={handleRegisterPackageSuccess}
        token={token!}
        complexId={complexId!}
        apartments={MOCK_APARTMENTS}
      />

      <DeliverPackageModal
        isOpen={showDeliverPackage}
        onClose={() => {
          setShowDeliverPackage(false);
          setSelectedPackage(null);
        }}
        onSuccess={handleDeliverPackageSuccess}
        packageItem={selectedPackage}
        token={token!}
        complexId={complexId!}
      />

      <CreateQuickAlertModal
        isOpen={showCreateAlert}
        onClose={() => setShowCreateAlert(false)}
        onSuccess={handleCreateAlertSuccess}
        token={token!}
        complexId={complexId!}
        blocks={MOCK_BLOCKS}
        apartments={MOCK_APARTMENTS}
      />
    </div>
  );
}
