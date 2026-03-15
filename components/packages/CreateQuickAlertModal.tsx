'use client';

import { useState } from 'react';
import { AlertType, IQuickAlert } from '@/app/dashboard/packages/packages.types';
import { createQuickAlert } from '@/services/packages.service';

interface CreateQuickAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (alert: IQuickAlert) => void;
  token: string;
  complexId: string;
  blocks: Array<{ id: string; name: string }>;
  apartments?: Array<{ id: string; number: string; block_name: string }>;
}

export function CreateQuickAlertModal({
  isOpen,
  onClose,
  onSuccess,
  token,
  complexId,
  blocks,
}: CreateQuickAlertModalProps) {
  const [alertType, setAlertType] = useState<AlertType>('DELIVERY_WAITING');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'GLOBAL' | 'BLOCK'>('GLOBAL');
  const [targetBlockId, setTargetBlockId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alertTypes: AlertType[] = ['UTILITY_CUT', 'BILLS_ARRIVED', 'DELIVERY_WAITING'];
  const alertLabels = {
    UTILITY_CUT: '🔴 Corte de Servicio',
    BILLS_ARRIVED: '🟠 Facturas Llegaron',
    DELIVERY_WAITING: '🔵 Entrega Espera',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    if (targetType === 'BLOCK' && !targetBlockId) {
      setError('El bloque es requerido');
      return;
    }

    setIsLoading(true);
    try {
      const response = await createQuickAlert({
        token,
        complexId,
        payload: {
          complex_id: complexId,
          target_apartment_id: null,
          target_block_id: targetType === 'BLOCK' ? targetBlockId : null,
          alert_type: alertType,
          message: message.trim(),
        },
      });

      onSuccess(response.alert);
      resetForm();
      onClose();
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear la alerta');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAlertType('DELIVERY_WAITING');
    setMessage('');
    setTargetType('GLOBAL');
    setTargetBlockId('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Enviar Alerta Rápida</h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alert Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Alerta *
            </label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as AlertType)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {alertTypes.map((t) => (
                <option key={t} value={t}>
                  {alertLabels[t as keyof typeof alertLabels]}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mensaje *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ingresa el mensaje de alerta..."
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Destinatarios *
            </label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="targetType"
                  value="GLOBAL"
                  checked={targetType === 'GLOBAL'}
                  onChange={(e) => setTargetType(e.target.value as 'GLOBAL' | 'BLOCK')}
                  disabled={isLoading}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Todos (Global)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="targetType"
                  value="BLOCK"
                  checked={targetType === 'BLOCK'}
                  onChange={(e) => setTargetType(e.target.value as 'GLOBAL' | 'BLOCK')}
                  disabled={isLoading}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Por Bloque/Torre</span>
              </label>
            </div>
          </div>

          {/* Block Select */}
          {targetType === 'BLOCK' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Selecciona Bloque *
              </label>
              <select
                value={targetBlockId}
                onChange={(e) => setTargetBlockId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={isLoading}
              >
                <option value="">Elige un bloque...</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {isLoading ? 'Enviando...' : 'Enviar Alerta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
