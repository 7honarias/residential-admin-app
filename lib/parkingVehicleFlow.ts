export type VehicleState = 'IDLE' | 'RESIDENT' | 'RESIDENT_EXIT' | 'VISITOR_NEW' | 'VISITOR_EXITING';

export type PaymentMethod = 'CASH' | 'POS';

export interface PlateVerificationResult {
  state?: string;
  message?: string;
  block?: string;
  invitation_id?: string;
  invitationId?: string;
  parking_id?: string;
  parkingId?: string;
  log_id?: string;
  logId?: string;
  status?: string;
  vehicle_type?: string;
  is_resident?: boolean;
  has_active_entry?: boolean;
  guest_name?: string;
  guestName?: string;
  owner_name?: string;
  apartment_label?: string;
  apartment?: string;
  ownerName?: string;
  destination_apartment?: string;
  entry_time?: string;
  fee_amount?: number;
  parking_number?: string;
  parking_type?: string;
  total_hours?: number;
  vehicle?: {
    brand?: string;
    model?: string;
  };
}

export interface ExitSummary {
  fee_amount?: number;
  total_hours?: number;
  payment_method?: string;
  invoice_id?: string;
  transaction_id?: string;
}

const readString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return undefined;
};

const readNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
};

export const mapVerificationResponse = (response: unknown): PlateVerificationResult => {
  const source = (response ?? {}) as Record<string, unknown>;
  const payload = (source.payload ?? source) as Record<string, unknown>;
  const nestedData =
    payload.data && typeof payload.data === 'object'
      ? (payload.data as Record<string, unknown>)
      : {};

  const nestedParking =
    nestedData.parking && typeof nestedData.parking === 'object'
      ? (nestedData.parking as Record<string, unknown>)
      : {};

  const state = readString(source.state, payload.state, nestedData.state);
  const message = readString(source.message, payload.message, nestedData.message);

  const ownerName = readString(
    nestedData.ownerName,
    nestedData.owner_name,
    payload.owner_name,
    payload.ownerName
  );

  const guestName = readString(
    nestedData.guestName,
    nestedData.guest_name,
    payload.guestName,
    payload.guest_name
  );

  const apartment = readString(
    nestedData.apartment,
    nestedData.apartment_label,
    payload.apartment,
    payload.apartment_label
  );

  const block = readString(nestedData.block, payload.block);

  const vehicleRaw = nestedData.vehicle;
  const vehicle =
    vehicleRaw && typeof vehicleRaw === 'object'
      ? (vehicleRaw as { brand?: string; model?: string })
      : undefined;

  const parkingId = readString(
    nestedData.parking_id,
    nestedData.parkingId,
    nestedData.spot,
    nestedData.target_parking_id,
    nestedParking.id,
    payload.parking_id,
    payload.parkingId,
    payload.spot,
    payload.target_parking_id
  );

  const logId = readString(nestedData.logId, nestedData.log_id, payload.logId, payload.log_id);

  const invitationId = readString(
    nestedData.invitationId,
    nestedData.invitation_id,
    payload.invitationId,
    payload.invitation_id
  );

  const entryTime = readString(
    nestedData.entryTime,
    nestedData.entry_time,
    payload.entryTime,
    payload.entry_time
  );

  const amount = readNumber(nestedData.amount, nestedData.fee_amount, payload.amount, payload.fee_amount);
  const totalHours = readNumber(
    nestedData.totalHours,
    nestedData.total_hours,
    payload.totalHours,
    payload.total_hours
  );

  const parkingType = readString(
    nestedData.parkingType,
    nestedData.parking_type,
    payload.parkingType,
    payload.parking_type
  );

  const apartmentLabel = [block, apartment].filter(Boolean).join(' • ') || apartment;

  return {
    ...(payload as PlateVerificationResult),
    ...(nestedData as PlateVerificationResult),
    state,
    message,
    block,
    invitation_id: invitationId,
    invitationId,
    guest_name: guestName,
    guestName,
    owner_name: ownerName,
    ownerName,
    apartment_label: apartmentLabel,
    apartment,
    parking_id: parkingId,
    parkingId,
    log_id: logId,
    logId,
    entry_time: entryTime,
    fee_amount: amount,
    parking_type: parkingType,
    total_hours: totalHours,
    vehicle,
    is_resident:
      state?.startsWith('RESIDENT') ||
      (payload.is_resident as boolean | undefined) ||
      (nestedData.is_resident as boolean | undefined),
  };
};

export const resolveVehicleState = (result: PlateVerificationResult): VehicleState => {
  switch (result.state) {
    case 'RESIDENT_EXITING':
      return 'RESIDENT_EXIT';
    case 'VISITOR_EXITING':
      return 'VISITOR_EXITING';
    case 'RESIDENT':
      return 'RESIDENT';
    case 'INVITED':
    case 'VISITOR_NEW':
      return 'VISITOR_NEW';
    default: {
      const hasActiveEntry =
        !!result.has_active_entry ||
        result.status === 'INSIDE' ||
        result.state === 'INSIDE' ||
        !!result.log_id;
      const isResident =
        result.state?.startsWith('RESIDENT') ||
        !!result.is_resident ||
        result.vehicle_type === 'RESIDENT';
      return hasActiveEntry ? (isResident ? 'RESIDENT_EXIT' : 'VISITOR_EXITING') : (isResident ? 'RESIDENT' : 'VISITOR_NEW');
    }
  }
};

export const requiresPaymentMethod = (state: VehicleState, result: PlateVerificationResult | null) => {
  if (state !== 'VISITOR_EXITING') return false;
  const amount = result?.fee_amount ?? 0;
  return amount > 0;
};

export const mapExitSummary = (response: unknown): ExitSummary => {
  const source = (response ?? {}) as Record<string, unknown>;
  const payload = (source.payload ?? source) as Record<string, unknown>;
  const nestedData =
    payload.data && typeof payload.data === 'object'
      ? (payload.data as Record<string, unknown>)
      : {};

  return {
    fee_amount: readNumber(nestedData.fee_amount, nestedData.amount, payload.fee_amount, payload.amount),
    total_hours: readNumber(nestedData.total_hours, nestedData.totalHours, payload.total_hours, payload.totalHours),
    payment_method: readString(
      nestedData.payment_method,
      nestedData.paymentMethod,
      payload.payment_method,
      payload.paymentMethod
    ),
    invoice_id: readString(nestedData.invoice_id, nestedData.invoiceId, payload.invoice_id, payload.invoiceId),
    transaction_id: readString(
      nestedData.transaction_id,
      nestedData.transactionId,
      payload.transaction_id,
      payload.transactionId
    ),
  };
};

export const isValidPlate = (value: string) => /^[A-Z]{3}-[0-9]{3}$/.test(value);

export const normalizePlate = (value: string) => {
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (raw.length <= 3) return raw;
  return `${raw.slice(0, 3)}-${raw.slice(3)}`;
};
