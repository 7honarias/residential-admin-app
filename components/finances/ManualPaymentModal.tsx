'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  fetchBlocks,
  fetchApartmentsByBlock,
  registerManualPayment,
} from '@/services/invoices.service';
import { PaymentMethod } from '@/app/dashboard/finances/invoices.types';
import { X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  blockId: string;
  apartmentId: string;
  amount: number | '';
  payment_date: string;
  payment_method: PaymentMethod | '';
  reference: string;
  notes: string;
}

interface FormErrors {
  blockId?: string;
  apartmentId?: string;
  amount?: string;
  payment_date?: string;
  payment_method?: string;
}

const PAYMENT_METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: 'Efectivo', value: 'CASH' },
  { label: 'Transferencia Bancaria', value: 'TRANSFER' },
  { label: 'Consignación', value: 'DEPOSIT' },
  { label: 'Otro', value: 'OTHER' },
];

export default function ManualPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const token = useAppSelector((state) => state.auth.token);
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);

  const [formData, setFormData] = useState<FormData>({
    blockId: '',
    apartmentId: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference: '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [blocks, setBlocks] = useState<Array<{ id: string; name: string }>>([]);
  const [filteredApartments, setFilteredApartments] = useState<
    Array<{ id: string; number: string; block_name: string }>
  >([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [isLoadingApartments, setIsLoadingApartments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load blocks on modal open
  useEffect(() => {
    if (!isOpen || !token || !activeComplex?.id) return;

    const loadBlocks = async () => {
      setIsLoadingBlocks(true);
      try {
        const blockList = await fetchBlocks({
          token,
          complexId: activeComplex.id,
        });
        setBlocks(blockList);
      } catch (err) {
        console.error('Error loading blocks:', err);
        setBlocks([]);
      } finally {
        setIsLoadingBlocks(false);
      }
    };

    loadBlocks();
  }, [isOpen, token, activeComplex?.id]);

  // Load apartments when block changes
  useEffect(() => {
    if (!formData.blockId || !token || !activeComplex?.id) {
      setFilteredApartments([]);
      return;
    }

    const loadApartments = async () => {
      setIsLoadingApartments(true);
      try {
        const apartments = await fetchApartmentsByBlock({
          token,
          complexId: activeComplex.id,
          blockId: formData.blockId,
        });
        setFilteredApartments(apartments);
        // Reset apartment selection when block changes
        setFormData((prev) => ({ ...prev, apartmentId: '' }));
      } catch (err) {
        console.error('Error loading apartments:', err);
        setFilteredApartments([]);
      } finally {
        setIsLoadingApartments(false);
      }
    };

    loadApartments();
  }, [formData.blockId, token, activeComplex?.id]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.blockId) {
      newErrors.blockId = 'Selecciona una torre/bloque';
    }

    if (!formData.apartmentId) {
      newErrors.apartmentId = 'Selecciona un apartamento';
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (Number(formData.amount) > 999999.99) {
      newErrors.amount = 'Monto muy alto';
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'Selecciona una fecha';
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Selecciona un medio de pago';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token || !activeComplex?.id) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await registerManualPayment({
        token,
        complexId: activeComplex.id,
        payload: {
          apartment_id: formData.apartmentId,
          amount: Number(formData.amount),
          payment_date: formData.payment_date,
          payment_method: formData.payment_method as PaymentMethod,
          reference: formData.reference || undefined,
          notes: formData.notes || undefined,
        },
      });

      // Success
      setFormData({
        blockId: '',
        apartmentId: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        reference: '',
        notes: '',
      });
      setErrors({});
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Error registrando pago'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.blockId &&
    formData.apartmentId &&
    formData.amount &&
    Number(formData.amount) > 0 &&
    formData.payment_date &&
    formData.payment_method;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">
            Registrar Pago Manual
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {submitError}
            </div>
          )}

          {/* Block Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Torre/Bloque *
            </label>
            {isLoadingBlocks ? (
              <div className="flex items-center justify-center p-3 bg-slate-50 rounded-lg">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin mr-2" />
                <span className="text-sm text-slate-600">Cargando...</span>
              </div>
            ) : (
              <select
                value={formData.blockId}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    blockId: e.target.value,
                  }));
                }}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.blockId
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300'
                }`}
              >
                <option value="">Selecciona una torre</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
              </select>
            )}
            {errors.blockId && (
              <p className="text-xs text-red-600 mt-1">{errors.blockId}</p>
            )}
          </div>

          {/* Apartment Selector */}
          {formData.blockId && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Apartamento *
              </label>
              {isLoadingApartments ? (
                <div className="flex items-center justify-center p-3 bg-slate-50 rounded-lg">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin mr-2" />
                  <span className="text-sm text-slate-600">
                    Cargando apartamentos...
                  </span>
                </div>
              ) : (
                <select
                  value={formData.apartmentId}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      apartmentId: e.target.value,
                    }));
                  }}
                  disabled={isSubmitting || filteredApartments.length === 0}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.apartmentId
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-slate-300'
                  }`}
                >
                  <option value="">
                    {filteredApartments.length === 0
                      ? 'No hay apartamentos'
                      : 'Selecciona un apartamento'}
                  </option>
                  {filteredApartments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      Apto {apt.number}
                    </option>
                  ))}
                </select>
              )}
              {errors.apartmentId && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.apartmentId}
                </p>
              )}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Monto Pagado *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="999999.99"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    amount: e.target.value ? Number(e.target.value) : '',
                  }));
                }}
                disabled={isSubmitting}
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.amount
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-600 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Fecha del Pago *
            </label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  payment_date: e.target.value,
                }));
              }}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.payment_date
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300'
              }`}
            />
            {errors.payment_date && (
              <p className="text-xs text-red-600 mt-1">
                {errors.payment_date}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Medio de Pago *
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  payment_method: e.target.value as PaymentMethod,
                }));
              }}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none ${
                errors.payment_method
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300'
              }`}
            >
              <option value="">Selecciona un medio de pago</option>
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.payment_method && (
              <p className="text-xs text-red-600 mt-1">
                {errors.payment_method}
              </p>
            )}
          </div>

          {/* Reference (optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Referencia
            </label>
            <input
              type="text"
              placeholder="Ej: TRX-123456"
              maxLength={100}
              value={formData.reference}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  reference: e.target.value,
                }));
              }}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <p className="text-xs text-slate-600 mt-1">
              Para transacciones, déjalo vacío si es efectivo
            </p>
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Notas
            </label>
            <textarea
              placeholder="Notas adicionales..."
              maxLength={500}
              rows={3}
              value={formData.notes}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }));
              }}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
            <p className="text-xs text-slate-600 mt-1">
              No se muestra al residente
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar Pago
          </button>
        </div>
      </div>
    </div>
  );
}
