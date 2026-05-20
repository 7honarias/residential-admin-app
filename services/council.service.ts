const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_COUNCIL_API_URL;

export interface CouncilOwner {
  profileId: string;
  apartmentId: string | null;
  apartmentLabel: string;
  fullName: string;
  email: string;
  phone: string;
  documentNumber?: string | null;
  isCouncilMember: boolean;
  grantedAt: string | null;
  createdAt?: string;
}

interface ListCouncilOwnersResponse {
  owners?: CouncilOwner[];
  message?: string;
}

interface CouncilMutationResponse {
  message?: string;
  assignedCount?: number;
  revokedCount?: number;
  assignedProfileIds?: string[];
  revokedProfileIds?: string[];
  skippedProfileIds?: string[];
}

export const fetchCouncilOwners = async (
  token: string,
  complexId: string,
  documentNumber: string,
): Promise<CouncilOwner[]> => {
  const params = new URLSearchParams({ complexId, documentNumber });
  const response = await fetch(`${API_URL}/getCouncilOwners?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = (await response.json().catch(() => null)) as ListCouncilOwnersResponse | null;

  if (!response.ok) {
    throw new Error(data?.message || "No fue posible cargar los propietarios del consejo.");
  }

  return data?.owners || [];
};

export const fetchCurrentCouncilMembers = async (
  token: string,
  complexId: string,
): Promise<CouncilOwner[]> => {
  const params = new URLSearchParams({ complexId });
  const response = await fetch(`${API_URL}/getCouncilOwners?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = (await response.json().catch(() => null)) as ListCouncilOwnersResponse | null;

  if (!response.ok) {
    throw new Error(data?.message || "No fue posible cargar los miembros del consejo.");
  }

  return data?.owners || [];
};

export const assignCouncilMembers = async (
  token: string,
  complexId: string,
  profileIds: string[],
): Promise<CouncilMutationResponse> => {
  const params = new URLSearchParams({ complexId });
  const response = await fetch(`${API_URL}/assignCouncilMembers?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ profileIds }),
  });

  const data = (await response.json().catch(() => null)) as CouncilMutationResponse | null;

  if (!response.ok) {
    throw new Error(data?.message || "No fue posible asignar los miembros del consejo.");
  }

  return data || {};
};

export const revokeCouncilMembers = async (
  token: string,
  complexId: string,
  profileIds: string[],
): Promise<CouncilMutationResponse> => {
  const params = new URLSearchParams({ complexId });
  const response = await fetch(`${API_URL}/revokeCouncilMembers?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ profileIds }),
  });

  const data = (await response.json().catch(() => null)) as CouncilMutationResponse | null;

  if (!response.ok) {
    throw new Error(data?.message || "No fue posible remover los miembros del consejo.");
  }

  return data || {};
};