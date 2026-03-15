export interface Vehicle {
  currentPlate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
}

export interface Apartment {
  apartmentId: string;
  apartmentNumber: string;
  blockName: string;
}

export interface ParkingDetail {
  id: string;
  number: string;
  type: "PRIVATE" | "VISITOR" | "SERVICE" | "DISABLED";
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  apartmentNumber?: string;
  vehicle?: Vehicle;
  apartment?: Apartment;
  coefficientPricing?: import("@/services/settings.service").CoefficientPricing;
}