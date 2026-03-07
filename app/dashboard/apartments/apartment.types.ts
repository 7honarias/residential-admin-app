export interface Owner {
  id?: string;
  fullName: string;
  email: string | null;
  phone: string;
}

export interface OwnerForm {
  id?: string;
  fullName: string;
  email: string;
  confirmEmail: string;
  phone: string;
}

export interface ResidentForm {
  id?: string;
  fullName: string;
  email: string;
  confirmEmail: string;
  phone: string;
}

export interface Resident {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface ApartmentDetail {
  id: string;
  number: string;
  block_name: string;
  owner: Owner | null;
  residents: Resident[];
}
