
export interface Amenity {
  id: string;
  name: string;
  description: string;
  capacity: number;
  booking_mode: "TIME_SLOT" | "FULL_DAY";
  pricing_type: "PER_HOUR" | "FREE";
  price: number;
  requires_approval: boolean;
  slot_duration?: number;
  max_slots_per_reservation?: number;
  is_active: boolean;
  amenity_schedules: Schedule[];
}

export type BookingMode = "TIME_SLOT" | "FULL_DAY" | "MULTI_USER";
export type PricingType = "FREE" | "PER_HOUR" | "PER_DAY";

export interface Schedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface AmenityFormData {
  name: string;
  description: string;
  capacity: number;
  booking_mode: BookingMode;
  pricing_type: PricingType;
  max_slots_per_reservation?: number;
  price: number;
  slot_duration?: number;
  requires_approval: boolean;
  is_active: boolean;
}

// Interfaz para las Props del componente
export interface AmenityFormProps {
  complexId: string;
  token: string;
  amenityId?: string;
  defaultValues?: AmenityFormData & { schedules?: Schedule[] };
  onFinished?: () => void;
  onSuccess?: () => void;
}