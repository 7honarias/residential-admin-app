import { supabase } from "@/lib/supabaseClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const bulkUploadApartments = async (base64File: string, complexId: string) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("No authenticated session");
  }

  const response = await fetch(
    `${API_URL}/bulkLoadAptBlock?complexId=${complexId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ file: base64File }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error uploading file");
  }

  return data;
};


export interface ApartmentsResponse {
  current_block_id: string;
  blocks: {
    id: string;
    name: string;
  }[];
  apartments: {
    id: string;
    number: string;
    floor: string | null;
    block_name: string;
    owner_name: string;
    owner_email: string | null;
  }[];
}

interface FetchApartmentsParams {
  token: string;
  complexId: string;
  blockId?: string;
}

export const fetchApartments = async ({
  token,
  complexId,
  blockId,
}: FetchApartmentsParams): Promise<ApartmentsResponse> => {
  // 🔥 Construir query params dinámicamente
  const params = new URLSearchParams({
    complexId,
  });

  if (blockId) {
    params.append("blockId", blockId);
  }

  const response = await fetch(
    `${API_URL}/getApartmentList?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error fetching apartments");
  }

  return data;
};

export const fetchApartmentDetail = async ({
  token,
  complexId,
  apartmentId,
}: {
  token: string;
  complexId: string;
  apartmentId: string;
}) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/getApartmentDetail?complexId=${complexId}&apartmentId=${apartmentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Error fetching apartment detail");
  }

  return res.json();
};

export interface AssignCoefficientPricingParams {
  token: string;
  complexId: string;
  apartmentId: string;
  pricingId: string;
}

/**
 * Assign a coefficient pricing to an apartment
 */
export const assignCoefficientPricingToApartment = async (
  params: AssignCoefficientPricingParams
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_URL}/assignCoefficientPricing?complexId=${params.complexId}&apartmentId=${params.apartmentId}&pricingId=${params.pricingId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Error assigning coefficient pricing to apartment"
      );
    }
  } catch (error) {
    console.error("Error assigning coefficient pricing:", error);
    throw error;
  }
};
