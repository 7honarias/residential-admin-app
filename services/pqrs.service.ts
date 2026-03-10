import {
  IGetPqrsResponse,
  IAdminPqrsResponse,
  IPqrsFilterOptions,
} from "@/app/dashboard/pqrs/pqrs.types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ==========================================
// INTERFACES
// ==========================================

export interface FetchPqrsParams {
  token: string;
  complexId: string;
  options?: IPqrsFilterOptions;
}

export interface RespondPqrsParams {
  token: string;
  complexId: string;
  payload: {
    pqrs_id: string;
    status: string;
    admin_response: string;
  };
}

// ==========================================
// FUNCIONES DE LECTURA (GET)
// ==========================================

/**
 * Fetch PQRS tickets with cursor-based pagination
 * @param token - JWT authentication token
 * @param complexId - Complex identifier
 * @param options - Filter options (status, limit, cursor, order)
 */
export const fetchPqrs = async ({
  token,
  complexId,
  options = {},
}: FetchPqrsParams): Promise<IGetPqrsResponse> => {
  try {
    const { status, limit = 20, cursor, order = "desc" } = options;

    // Build query string
    const params = new URLSearchParams({
      complexId,
    });
    if (status && status !== "ALL") params.append("status", status);
    if (limit) params.append("limit", limit.toString());
    if (cursor) params.append("cursor", cursor);
    if (order) params.append("order", order);

    const response = await fetch(
      `${API_URL}/getPqrsList?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Error fetching PQRS:", data);
      throw new Error(data.error || data.message || "Error fetching PQRS");
    }

    return data as IGetPqrsResponse;
  } catch (error) {
    console.error("Error en fetchPqrs:", error);
    throw error;
  }
};

// ==========================================
// FUNCIONES DE ESCRITURA (POST) - HELPER
// ==========================================

/**
 * Helper function to execute PQRS actions
 * Routes different actions through a single endpoint
 */
const executePqrsAction = async (
  token: string,
  complexId: string,
  action: string,
  payload: any
) => {
  try {
    const params = new URLSearchParams({ complexId });
    const response = await fetch(
      `${API_URL}/managePqrs?${params.toString()}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, payload }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error(`❌ Error en la acción ${action}:`, data);
      throw new Error(
        data.error || data.message || `Error ejecutando la acción ${action}`
      );
    }
    return data;
  } catch (error) {
    console.error(`Error en executePqrsAction (${action}):`, error);
    throw error;
  }
};

// ==========================================
// ACCIONES ESPECÍFICAS DE PQRS
// ==========================================

/**
 * Respond to a PQRS ticket (change status + add admin response)
 * @param token - JWT authentication token
 * @param complexId - Complex identifier
 * @param payload - PQRS ID, new status, and admin response
 */
export const respondPqrs = async ({
  token,
  complexId,
  payload,
}: RespondPqrsParams): Promise<IAdminPqrsResponse> => {
  // Validate admin response
  if (
    !payload.admin_response ||
    payload.admin_response.trim().length === 0
  ) {
    throw new Error("Admin response is required");
  }

  return executePqrsAction(token, complexId, "RESPOND_PQRS", {
    ...payload,
    admin_response: payload.admin_response.trim(),
  });
};
