export type PackageType = 'BOX' | 'ENVELOPE' | 'FOOD' | 'LAUNDRY' | 'OTHER';
export type PackageStatus = 'PENDING_PICKUP' | 'DELIVERED';
export type AlertType = 'UTILITY_CUT' | 'BILLS_ARRIVED' | 'DELIVERY_WAITING';

export interface IPackage {
  id: string;
  complex_id: string;
  apartment_id: string;
  type: PackageType;
  carrier: string | null;
  notes: string | null;
  status: PackageStatus;
  received_at: string;
  picked_up_at: string | null;
  picked_up_by: string | null;
  apartment_number?: string;
  block_name?: string;
}

export interface IRegisterPackagePayload {
  complex_id: string;
  apartment_id: string;
  type: PackageType;
  carrier?: string;
  notes?: string;
}

export interface IDeliverPackagePayload {
  complex_id: string;
  package_id: string;
  picked_up_by: string;
}

export interface IQuickAlert {
  id: string;
  complex_id: string;
  target_apartment_id: string | null;
  target_block_id: string | null;
  alert_type: AlertType;
  message: string;
  created_at: string;
  target_name?: string;
}

export interface IQuickAlertPayload {
  complex_id: string;
  target_apartment_id?: string | null;
  target_block_id?: string | null;
  alert_type: AlertType;
  message: string;
}

export interface IFetchPackagesResponse {
  packages: IPackage[];
  nextCursor: string | null;
}

export interface IFetchAlertsResponse {
  alerts: IQuickAlert[];
  nextCursor: string | null;
}
