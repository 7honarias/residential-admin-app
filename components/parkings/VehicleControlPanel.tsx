'use client'

import { useCallback, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  getListParkings,
  registerVehicleAccess,
  verifyVehiclePlate,
} from '@/services/parking.service';
import {
  isValidPlate,
  mapExitSummary,
  mapVerificationResponse,
  normalizePlate,
  PlateVerificationResult,
  requiresPaymentMethod,
  resolveVehicleState,
  VehicleState,
} from '@/lib/parkingVehicleFlow';

interface VisitorParkingSlot {
  id: string;
  number: string;
  type?: string;
  status?: string;
}

const toApiPlate = (value: string) => normalizePlate(value);

export default function VehicleControlPanel() {
  const token = useAppSelector((state) => state.auth.token);
  const complexId = useAppSelector((state) => state.complex.activeComplex?.id);

  const [plate, setPlate] = useState('');
  const [vehicleState, setVehicleState] = useState<VehicleState>('IDLE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [observations, setObservations] = useState('');
  const [visitorSlots, setVisitorSlots] = useState<VisitorParkingSlot[]>([]);
  const [visitorSlotsLoaded, setVisitorSlotsLoaded] = useState(false);
  const [verificationResult, setVerificationResult] = useState<PlateVerificationResult | null>(null);

  // Estados para cuando es un visitante nuevo
  const [selectedSpot, setSelectedSpot] = useState('');
  const [destinationApt, setDestinationApt] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'POS' | ''>('');
  const [exitSummary, setExitSummary] = useState<{
    fee_amount?: number;
    total_hours?: number;
    payment_method?: string;
    invoice_id?: string;
    transaction_id?: string;
  } | null>(null);

  const normalizedPlate = useMemo(() => normalizePlate(plate), [plate]);
  const apiPlate = useMemo(() => toApiPlate(normalizedPlate), [normalizedPlate]);

  const loadVisitorSlots = useCallback(
    async (forceRefresh = false) => {
      if (!token || !complexId) return;
      if (!forceRefresh && visitorSlotsLoaded) return;

      try {
        const response = await getListParkings(complexId, token);
        const parkings = Array.isArray(response?.parkings) ? response.parkings : [];
        const availableVisitorSlots = parkings.filter(
          (slot: VisitorParkingSlot) => slot.type === 'VISITOR' && slot.status === 'AVAILABLE'
        );
        setVisitorSlots(availableVisitorSlots);
      } catch {
        setVisitorSlots([]);
      } finally {
        setVisitorSlotsLoaded(true);
      }
    },
    [token, complexId, visitorSlotsLoaded]
  );

  // 🔍 1. Lógica de Validación (El cruce de datos)
  const handleSearchPlate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !complexId) {
      setErrorMessage('No hay sesión activa o complejo seleccionado.');
      return;
    }

    if (!isValidPlate(normalizedPlate)) return;

    setErrorMessage('');
    setSuccessMessage('');
    setExitSummary(null);
    setIsProcessing(true);

    try {
      const response = await verifyVehiclePlate({
        token,
        complexId,
        plate: apiPlate,
      });

      const result = mapVerificationResponse(response);
      setVerificationResult(result);
      const nextVehicleState = resolveVehicleState(result);

      if (nextVehicleState === 'VISITOR_NEW') {
        await loadVisitorSlots();
      }

      if (result.state === 'INVITED') {
        const suggestedApartment = result.apartment || result.apartment_label || '';
        setDestinationApt((currentValue) => currentValue || suggestedApartment);
      }

      setVehicleState(nextVehicleState);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error verificando la placa');
      setVehicleState('IDLE');
      setVerificationResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // 📝 2. Lógica de Ingreso (Nuevo Visitante)
  const handleRegisterEntry = async () => {
    if (!token || !complexId) {
      setErrorMessage('No hay sesión activa o complejo seleccionado.');
      return;
    }

    if (!selectedSpot) {
      setErrorMessage('Debe seleccionar un cupo de parqueadero.');
      return;
    }

    if (!isValidPlate(normalizedPlate)) {
      setErrorMessage('La placa no tiene un formato válido (ABC-123).');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsProcessing(true);

    try {
      const entryObservations = [
        destinationApt.trim() ? `Destino: ${destinationApt.trim()}` : '',
        observations.trim(),
      ]
        .filter(Boolean)
        .join(' | ');

      await registerVehicleAccess({
        token,
        complexId,
        action: 'ENTRY',
        payload: {
          parking_id: selectedSpot,
          plate: apiPlate,
          observations: entryObservations || undefined,
        },
      });

      setSuccessMessage('Ingreso registrado exitosamente.');
      setVisitorSlotsLoaded(false);
      resetPanel();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible registrar el ingreso');
    } finally {
      setIsProcessing(false);
    }
  };

  // 💰 3. Lógica de Cobro y Salida
  const handleCheckoutAndPay = async () => {
    if (!token || !complexId) {
      setErrorMessage('No hay sesión activa o complejo seleccionado.');
      return;
    }

    const parkingId = verificationResult?.parking_id || verificationResult?.parkingId || selectedSpot;
    if (!parkingId) {
      setErrorMessage('No se encontró parking_id para registrar la salida.');
      return;
    }

    if (!isValidPlate(normalizedPlate)) {
      setErrorMessage('La placa no tiene un formato válido (ABC-123).');
      return;
    }

    const shouldRequestPayment = requiresPaymentMethod(vehicleState, verificationResult);
    if (shouldRequestPayment && !paymentMethod) {
      setErrorMessage('Debe seleccionar un método de pago para registrar la salida.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsProcessing(true);

    try {
      const response = await registerVehicleAccess({
        token,
        complexId,
        action: 'EXIT',
        payload: {
          parking_id: parkingId,
          plate: apiPlate,
          log_id: verificationResult?.log_id,
          observations: observations.trim() || undefined,
          ...(shouldRequestPayment && paymentMethod ? { payment_method: paymentMethod } : {}),
        },
      });

      setExitSummary(mapExitSummary(response));
      setSuccessMessage('Salida registrada.');
      setVisitorSlotsLoaded(false);
      resetPanel();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible registrar la salida');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResidentEntry = async () => {
    if (!token || !complexId) {
      setErrorMessage('No hay sesión activa o complejo seleccionado.');
      return;
    }

    const parkingId = verificationResult?.parking_id || verificationResult?.parkingId;

    setErrorMessage('');
    setSuccessMessage('');
    setExitSummary(null);
    setIsProcessing(true);

    try {
      await registerVehicleAccess({
        token,
        complexId,
        action: 'ENTRY',
        payload: {
          plate: apiPlate,
          observations: observations.trim() || undefined,
          ...(parkingId ? { parking_id: parkingId } : {}),
        },
      });

      setSuccessMessage('Ingreso de residente registrado exitosamente.');
      resetPanel();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible registrar el ingreso');
    } finally {
      setIsProcessing(false);
    }
  };

  // 🚗 4. Salida de Residente
  const handleResidentExit = async () => {
    if (!token || !complexId) {
      setErrorMessage('No hay sesión activa o complejo seleccionado.');
      return;
    }

    const parkingId = verificationResult?.parking_id || verificationResult?.parkingId;
    if (!parkingId) {
      setErrorMessage('No se encontró parking_id para registrar la salida.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsProcessing(true);

    try {
      await registerVehicleAccess({
        token,
        complexId,
        action: 'EXIT',
        payload: {
          parking_id: parkingId,
          plate: apiPlate,
          log_id: verificationResult?.log_id,
          observations: observations.trim() || undefined,
        },
      });

      setSuccessMessage('Salida de residente registrada exitosamente.');
      resetPanel();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible registrar la salida');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPanel = () => {
    setVehicleState('IDLE');
    setPlate('');
    setSelectedSpot('');
    setDestinationApt('');
    setObservations('');
    setPaymentMethod('');
    setVerificationResult(null);
  };

  const isInvitedVisitor = verificationResult?.state === 'INVITED';
  const shouldRequestPayment = requiresPaymentMethod(vehicleState, verificationResult);

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span>🚘</span> Control de Acceso Vehicular
      </h2>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Buscador a la izquierda */}
        <div className="md:w-1/2 w-full">
          <form onSubmit={handleSearchPlate} className="mb-0">
            <label className="text-sm font-semibold text-slate-700 block mb-2">Ingrese Placa del Vehículo</label>
            <input 
              type="text" 
              placeholder="Ej: ABC-123" 
              className="w-full text-center uppercase font-mono text-4xl px-4 py-4 rounded-xl border-2 border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/20 outline-none transition disabled:opacity-50 tracking-widest mb-4"
              value={plate}
              onChange={(e) => {
                setPlate(normalizePlate(e.target.value));
              }}
              maxLength={7}
              disabled={vehicleState !== 'IDLE'}
              pattern="[A-Z]{3}-[0-9]{3}"
              inputMode="text"
              autoComplete="off"
            />
            {errorMessage && (
              <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMessage}
              </p>
            )}
            {vehicleState === 'IDLE' ? (
              <button 
                type="submit" 
                disabled={!isValidPlate(normalizedPlate) || isProcessing}
                className="w-full px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {isProcessing ? 'Buscando...' : 'Verificar'}
              </button>
            ) : (
              <button 
                type="button" 
                onClick={resetPanel}
                className="w-full px-8 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition"
              >
                Limpiar
              </button>
            )}
          </form>
        </div>
        {/* Resultado a la derecha */}
        <div className="md:w-1/2 w-full">
          <div className="min-h-[340px] flex flex-col justify-center">
            {/* ESTADO A1: RESIDENTE INGRESANDO */}
            {vehicleState === 'RESIDENT' && (
              <div className="animate-fade-in bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-8 shadow-md text-center flex flex-col items-center gap-2">
                <div className="w-20 h-20 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center text-4xl mb-3 shadow-sm border-4 border-white">✅</div>
                <h3 className="text-2xl font-extrabold text-emerald-900 mb-1 tracking-tight">Vehículo Autorizado</h3>
                <p className="text-emerald-700 mb-6 text-base font-medium">
                  Propietario: <span className="font-semibold">{verificationResult?.owner_name || 'Residente'}</span>{' '}•{' '}
                  {verificationResult?.apartment_label || 'Apartamento registrado'}
                </p>
                {verificationResult?.vehicle && (
                  <p className="text-emerald-700 mb-4 text-sm font-medium">
                    Vehículo:{' '}
                    <span className="font-semibold">
                      {verificationResult.vehicle.brand || 'Marca'} {verificationResult.vehicle.model || 'Modelo'}
                    </span>
                  </p>
                )}
                {verificationResult?.message && (
                  <p className="mb-4 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-800">
                    {verificationResult.message}
                  </p>
                )}
                <textarea
                  placeholder="Observaciones (opcional)"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full mb-4 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
                  rows={2}
                />
                <button onClick={handleResidentEntry} disabled={isProcessing} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30 text-lg disabled:opacity-50">
                  {isProcessing ? 'Registrando...' : 'Registrar Ingreso y Abrir Talanquera'}
                </button>
              </div>
            )}
            {/* ESTADO A2: RESIDENTE SALIENDO */}
            {vehicleState === 'RESIDENT_EXIT' && (
              <div className="animate-fade-in bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200 rounded-2xl p-8 shadow-md text-center flex flex-col items-center gap-2">
                <div className="w-20 h-20 bg-sky-200 text-sky-700 rounded-full flex items-center justify-center text-4xl mb-3 shadow-sm border-4 border-white">🚗</div>
                <h3 className="text-2xl font-extrabold text-sky-900 mb-1 tracking-tight">Residente — Salida</h3>
                <p className="text-sky-700 mb-1 text-base font-medium">
                  Propietario: <span className="font-semibold">{verificationResult?.owner_name || 'Residente'}</span>{' '}•{' '}
                  {verificationResult?.apartment_label || 'Apartamento registrado'}
                </p>
                {verificationResult?.message && (
                  <p className="mb-1 rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-sky-800">
                    {verificationResult.message}
                  </p>
                )}
                {(verificationResult?.total_hours != null || verificationResult?.parking_type) && (
                  <p className="text-sm text-sky-700 mb-1">
                    {verificationResult?.total_hours != null && (
                      <span className="font-semibold">Tiempo: {verificationResult.total_hours} h</span>
                    )}
                    {verificationResult?.total_hours != null && verificationResult?.parking_type ? ' • ' : ''}
                    {verificationResult?.parking_type && (
                      <span className="font-semibold">Tipo: {verificationResult.parking_type}</span>
                    )}
                  </p>
                )}
                {verificationResult?.entry_time && (
                  <p className="text-sm text-sky-600 mb-4">
                    Ingresó:{' '}
                    <span className="font-semibold">
                      {new Date(verificationResult.entry_time).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </p>
                )}
                {verificationResult?.fee_amount != null && (
                  <p className="mb-4 text-sm font-semibold text-sky-700">
                    Valor:{' '}
                    <span className="text-sky-900">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        maximumFractionDigits: 0,
                      }).format(verificationResult.fee_amount)}
                    </span>
                  </p>
                )}
                <textarea
                  placeholder="Observaciones (opcional)"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full mb-4 rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
                  rows={2}
                />
                <button onClick={handleResidentExit} disabled={isProcessing} className="w-full py-4 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition shadow-lg shadow-sky-600/30 text-lg disabled:opacity-50">
                  {isProcessing ? 'Registrando...' : 'Registrar Salida y Abrir Talanquera'}
                </button>
              </div>
            )}
            {/* ESTADO B: NUEVO VISITANTE (Asignar y Empezar a Cobrar) */}
            {vehicleState === 'VISITOR_NEW' && (
              <div className="animate-fade-in bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-8 shadow-md">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center text-2xl shadow border-4 border-white">⚠️</div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                      {isInvitedVisitor ? 'Visitante Pre-autorizado' : 'Vehículo No Registrado'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {isInvitedVisitor
                        ? 'Asigne un cupo y registre el ingreso del invitado'
                        : 'Proceda a registrarlo como visitante'}
                    </p>
                  </div>
                </div>
                {verificationResult?.message && (
                  <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {verificationResult.message}
                  </p>
                )}
                {isInvitedVisitor && (
                  <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
                    <p>
                      Invitado:{' '}
                      <span className="font-semibold text-slate-900">
                        {verificationResult?.guest_name || verificationResult?.guestName || 'Invitado autorizado'}
                      </span>
                    </p>
                    <p>
                      Apartamento:{' '}
                      <span className="font-semibold text-slate-900">
                        {verificationResult?.apartment_label || verificationResult?.apartment || 'Sin apartamento'}
                      </span>
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Se dirige al Apartamento:</label>
                    <input 
                      type="text" 
                      placeholder="Ej: T1-204" 
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none bg-white text-base"
                      value={destinationApt}
                      onChange={(e) => setDestinationApt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Asignar Cupo (Parqueadero):</label>
                    <select 
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none bg-white text-base"
                      value={selectedSpot}
                      onChange={(e) => setSelectedSpot(e.target.value)}
                    >
                      <option value="">Seleccione cupo libre...</option>
                      {visitorSlots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <textarea
                  placeholder="Observaciones (opcional)"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full mb-4 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
                  rows={2}
                />
                <button 
                  onClick={handleRegisterEntry}
                  disabled={!selectedSpot || !destinationApt || isProcessing}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 text-lg shadow"
                >
                  {isProcessing
                    ? 'Registrando...'
                    : isInvitedVisitor
                      ? 'Registrar Ingreso y Abrir Talanquera'
                      : 'Registrar Ingreso (Iniciar Reloj)'}
                </button>
              </div>
            )}
            {/* ESTADO C: VISITANTE SALIENDO (Módulo de Cobro) */}
            {vehicleState === 'VISITOR_EXITING' && (
              <div className="animate-fade-in bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-2xl p-8 shadow-md">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-extrabold text-rose-900 mb-1 tracking-tight">Liquidación de Parqueadero</h3>
                    <p className="text-rose-700 text-base font-medium">Cupo ocupado: <span className="font-semibold">Visitante 05</span> • Destino: T1-204</p>
                  </div>
                  <div className="bg-rose-100 text-rose-800 px-4 py-1 rounded-full text-base font-bold border border-rose-200 shadow-sm">
                    Saliendo
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-rose-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">
                      Hora de Ingreso:{' '}
                      <span className="font-semibold text-slate-700">
                        {verificationResult?.entry_time
                          ? new Date(verificationResult.entry_time).toLocaleString('es-CO', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'Según registro activo'}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Cupo:{' '}
                      <span className="font-bold text-slate-800">
                        {verificationResult?.parking_number || 'Visitante'}
                      </span>
                    </p>
                    {verificationResult?.destination_apartment && (
                      <p className="text-sm text-slate-500">
                        Destino:{' '}
                        <span className="font-bold text-slate-800">{verificationResult.destination_apartment}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Total a Pagar</p>
                    {verificationResult?.fee_amount != null ? (
                      <p className="text-4xl font-black text-rose-600">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0,
                        }).format(verificationResult.fee_amount)}
                      </p>
                    ) : (
                      <p className="text-2xl font-black text-slate-400">Calculando...</p>
                    )}
                  </div>
                </div>
                <textarea
                  placeholder="Observaciones (opcional)"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full mb-4 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-rose-500"
                  rows={2}
                />
                {shouldRequestPayment && (
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Método de pago</label>
                    <select
                      className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-rose-500"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'POS')}
                      disabled={isProcessing}
                    >
                      <option value="">Seleccione método...</option>
                      <option value="CASH">Efectivo</option>
                      <option value="POS">POS</option>
                    </select>
                  </div>
                )}
                <div className="flex gap-4">
                  <button 
                    onClick={handleCheckoutAndPay}
                    disabled={isProcessing || (shouldRequestPayment && !paymentMethod)}
                    className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
                  >
                    {isProcessing ? 'Registrando...' : 'Pagar & Salir'}
                  </button>
                </div>
              </div>
            )}
            {vehicleState === 'IDLE' && exitSummary && (
              <div className="animate-fade-in rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <h3 className="mb-3 text-xl font-bold text-emerald-900">Salida registrada</h3>
                <div className="space-y-1 text-sm text-emerald-900">
                  <p>
                    Valor:{' '}
                    <span className="font-semibold">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        maximumFractionDigits: 0,
                      }).format(exitSummary.fee_amount ?? 0)}
                    </span>
                  </p>
                  <p>
                    Total horas:{' '}
                    <span className="font-semibold">{exitSummary.total_hours ?? 0}</span>
                  </p>
                  {exitSummary.payment_method && (
                    <p>
                      Método de pago:{' '}
                      <span className="font-semibold">{exitSummary.payment_method}</span>
                    </p>
                  )}
                  {exitSummary.invoice_id && (
                    <p>
                      Invoice ID:{' '}
                      <span className="font-semibold">{exitSummary.invoice_id}</span>
                    </p>
                  )}
                  {exitSummary.transaction_id && (
                    <p>
                      Transaction ID:{' '}
                      <span className="font-semibold">{exitSummary.transaction_id}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
