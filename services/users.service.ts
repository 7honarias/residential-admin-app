const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type StaffRole = 'SECURITY' | 'STAFF';

export interface ComplexUser {
  profileId: string;
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  createdAt?: string;
}

export interface CreateComplexUserInput {
  fullName: string;
  email: string;
  phone: string;
  documentTypeCode: string;
  documentNumber: string;
  role: StaffRole;
}

interface MassOnboardingResponse {
  message?: string;
  success?: unknown[];
  errors?: Array<{ error?: string; email?: string }>;
}

interface ListUsersResponse {
  users?: ComplexUser[];
  message?: string;
}

export const createComplexUser = async (
  token: string,
  complexId: string,
  payload: CreateComplexUserInput,
): Promise<{ message: string; raw: MassOnboardingResponse | null }> => {
  const params = new URLSearchParams({ complexId });

  const response = await fetch(
    `${API_URL}/createComplexUser?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  const data = (await response.json().catch(() => null)) as MassOnboardingResponse | null;

  if (!response.ok) {
    const backendError = data?.message ?? data?.errors?.[0]?.error;
    throw new Error(backendError || 'No fue posible crear el usuario.');
  }

  return {
    message: data?.message || 'Usuario creado correctamente.',
    raw: data,
  };
};

export const fetchComplexUsers = async (
  token: string,
  complexId: string,
): Promise<ComplexUser[]> => {
  const params = new URLSearchParams({ complexId });

  const response = await fetch(`${API_URL}/getComplexUsers?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = (await response.json().catch(() => null)) as ListUsersResponse | ComplexUser[] | null;

  if (!response.ok) {
    throw new Error((data as ListUsersResponse | null)?.message || 'No fue posible cargar la lista de usuarios.');
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data?.users ?? [];
};

export const deactivateComplexUser = async (
  token: string,
  complexId: string,
  profileId: string,
  role: StaffRole,
): Promise<{ message: string }> => {
  const params = new URLSearchParams({ complexId });

  const response = await fetch(`${API_URL}/deactivateComplexUser?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profileId, role }),
  });

  const data = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    throw new Error(data?.message || 'No fue posible desactivar el usuario.');
  }

  return { message: data?.message || 'Usuario desactivado correctamente.' };
};