import {
  IGetNoticesResponse,
  ICreateNoticeResponse,
  IAdminNoticesRequestBody,
  INoticesFilterOptions,
  IBlock,
  IApartmentOption,
} from "@/app/dashboard/notices/notices.types";
import { fetchApartments as fetchApartmentsData } from "@/services/apartments.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ==========================================
// INTERFACES
// ==========================================

export interface FetchNoticesParams {
  token: string;
  complexId: string;
  options?: INoticesFilterOptions;
}

export interface CreateNoticeParams {
  token: string;
  complexId: string;
  payload: IAdminNoticesRequestBody;
}

// ==========================================
// FUNCIONES DE LECTURA (GET)
// ==========================================

/**
 * Fetch notices (avisos) with cursor-based pagination
 * @param token - JWT authentication token
 * @param complexId - Complex identifier
 * @param options - Filter options (limit, cursor, order)
 */
export const fetchNotices = async ({
  token,
  complexId,
  options = {},
}: FetchNoticesParams): Promise<IGetNoticesResponse> => {
  try {
    const { limit = 20, cursor, order = "desc" } = options;

    // Build query string
    const params = new URLSearchParams({
      complexId,
      limit: limit.toString(),
      order,
    });

    if (cursor) {
      params.append("cursor", cursor);
    }

    const response = await fetch(
      `${API_URL}/getNoticesList?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        notices: [],
        nextCursor: null,
        error: errorData.error || `Error: ${response.status}`,
      };
    }

    const data: IGetNoticesResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching notices:", error);
    return {
      notices: [],
      nextCursor: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Fetch available blocks for BLOCK scope selection
 * @param token - JWT authentication token
 * @param complexId - Complex identifier
 */
export const fetchBlocks = async (
  token: string,
  complexId: string
): Promise<IBlock[]> => {
  try {
    const response = await fetchApartmentsData({
      token,
      complexId,
    });

    // Extract blocks from the apartments response
    return (
      response.blocks?.map((block: { id: string; name: string }) => ({
        id: block.id,
        complex_id: complexId,
        name: block.name,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching blocks:", error);
    return [];
  }
};

/**
 * Fetch available apartments for UNIT scope selection
 * @param token - JWT authentication token
 * @param complexId - Complex identifier
 */
export const fetchApartmentsForNotices = async (
  token: string,
  complexId: string
): Promise<IApartmentOption[]> => {
  try {
    const response = await fetchApartmentsData({
      token,
      complexId,
    });

    // Transform apartments response to IApartmentOption format
    return (
      response.apartments?.map(
        (apt: {
          id: string;
          number: string;
          block_name: string;
          floor: string | null;
        }) => ({
          id: apt.id,
          number: apt.number,
          block_name: apt.block_name,
          floor: apt.floor ? parseInt(apt.floor, 10) : undefined,
          full_label: `${apt.block_name} - Apto ${apt.number}`,
        })
      ) || []
    );
  } catch (error) {
    console.error("Error fetching apartments:", error);
    return [];
  }
};

// ==========================================
// FUNCIONES DE ESCRITURA (POST)
// ==========================================

/**
 * Create a new notice
 * @param token - JWT authentication token
 * @param complexId - Complex identifier
 * @param payload - Create notice payload
 */
export const createNotice = async ({
  token,
  complexId,
  payload,
}: CreateNoticeParams): Promise<ICreateNoticeResponse> => {
  try {
    const response = await fetch(
      `${API_URL}/manageNotices?complexId=${complexId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        message: errorData.message || "Error creating notice",
        error: errorData.error || `Error: ${response.status}`,
      };
    }

    const data: ICreateNoticeResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating notice:", error);
    return {
      message: "Error creating notice",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
