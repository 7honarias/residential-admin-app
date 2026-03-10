'use client';

import { IQuickAlert } from '../packages.types';

interface AlertItemProps {
  alert: IQuickAlert;
}

export function AlertItem({ alert }: AlertItemProps) {
  const alertColors = {
    UTILITY_CUT: 'border-l-4 border-red-500 bg-red-50',
    BILLS_ARRIVED: 'border-l-4 border-amber-500 bg-amber-50',
    DELIVERY_WAITING: 'border-l-4 border-blue-500 bg-blue-50',
  };

  const alertLabels = {
    UTILITY_CUT: '🔴 Service Cut',
    BILLS_ARRIVED: '🟠 Bills Arrived',
    DELIVERY_WAITING: '🔵 Delivery Waiting',
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

  const getRecipientLabel = () => {
    if (alert.target_name) return alert.target_name;
    if (alert.target_apartment_id) return 'Individual Apartment';
    if (alert.target_block_id) return 'Block';
    return 'Global';
  };

  return (
    <div className={`rounded-lg p-4 ${alertColors[alert.alert_type]}`}>
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-semibold text-gray-900">{alertLabels[alert.alert_type]}</h3>
        <span className="text-xs text-gray-600">{formatDate(alert.created_at)}</span>
      </div>
      <p className="mb-2 text-sm text-gray-700">{alert.message}</p>
      <p className="text-xs text-gray-600">
        <strong>Recipients:</strong> {getRecipientLabel()}
      </p>
    </div>
  );
}
