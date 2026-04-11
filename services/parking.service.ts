/* eslint-disable @typescript-eslint/no-explicit-any */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const parseApiResponse = async (response: Response, fallbackMessage: string) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || fallbackMessage);
  }

  return data;
};

export const bulkLoadParkings = async (complexId: string, rows: any[], token: string) => {
  try {
    const response = await fetch(`${API_URL}/bulkCreateAssignParkingVehicle?complexId=${complexId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // Tu token JWT para el withAuth
      },
      body: JSON.stringify({ rows }) // Enviamos el JSON limpio que armó el modal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al procesar la carga masiva");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en bulkLoadParkings:", error);
    throw error;
  }
};

export const getListParkings = async (complexId: string, token: string) => {
  try {
    const response = await fetch(`${API_URL}/getParkingList?complexId=${complexId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // Tu token JWT para el withAuth
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al obtener la lista de parqueaderos");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en getListParkings:", error);
    throw error;
  }
};

export const fetchParkingDetail = async ({
  token,
  complexId,
  parkingId,
}: {
  token: string;
  complexId: string;
  parkingId: string;
}) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/getParkingDetail?complexId=${complexId}&parkingId=${parkingId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Error fetching parking detail");
  }

  const data = await res.json();

  // Normalise snake_case field from the API to the camelCase shape expected by ParkingDetail
  if (data.coefficient_pricing) {
    data.coefficientPricing = data.coefficient_pricing;
    delete data.coefficient_pricing;
  }

  return data;
};

export const manageParkingAction = async (
  complexId: string, 
  parkingId: string, 
  action: string, // "ASSIGN_APARTMENT", "UPSERT_VEHICLE", "REMOVE_VEHICLE", "EDIT_PARKING"
  payload: any,   // Los datos específicos de la acción
  token: string
) => {
  // Construimos la URL enviando siempre el complexId y el parkingId
  const url = `${API_URL}/manageParkingSlot?complexId=${complexId}&parkingId=${parkingId}`;

  const response = await fetch(url, {
    method: "POST", // Siempre POST porque la Lambda enruta internamente
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ action, payload })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error procesando la acción");
  }

  return await response.json();
};

export type VehicleAccessAction = "ENTRY" | "EXIT";

export interface VerifyVehiclePlateParams {
  token: string;
  complexId: string;
  plate: string;
}

export interface VehicleEntryPayload {
  parking_id?: string;
  plate: string;
  observations?: string;
  payment_method?: "CASH" | "POS";
}

export interface VehicleExitPayload extends VehicleEntryPayload {
  log_id?: string;
}

const normalizePlateForApi = (value: string) => {
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (raw.length <= 3) return raw;
  return `${raw.slice(0, 3)}-${raw.slice(3)}`;
};

export const verifyVehiclePlate = async ({
  token,
  complexId,
  plate,
}: VerifyVehiclePlateParams) => {
  if (!token) throw new Error("Token is required");
  if (!complexId) throw new Error("ComplexId is required");
  if (!plate) throw new Error("Plate is required");

  const params = new URLSearchParams({ complexId, plate: normalizePlateForApi(plate) });
  const response = await fetch(`${API_URL}/verifyVehicle?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseApiResponse(response, "Error verifying vehicle plate");
};

export const registerVehicleAccess = async ({
  token,
  complexId,
  action,
  payload,
}: {
  token: string;
  complexId: string;
  action: VehicleAccessAction;
  payload: VehicleEntryPayload | VehicleExitPayload;
}) => {
  if (!token) throw new Error("Token is required");
  if (!complexId) throw new Error("ComplexId is required");
  if (!payload?.plate) throw new Error("plate is required");
  if (action === "EXIT" && !payload?.parking_id) {
    throw new Error("parking_id is required for EXIT");
  }

  const params = new URLSearchParams({ complexId });
  const normalizedPayload = {
    ...payload,
    plate: normalizePlateForApi(payload.plate),
  };
  const response = await fetch(`${API_URL}/registerParkingMovement?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action,
      payload: normalizedPayload,
    }),
  });

  return parseApiResponse(response, `Error executing ${action}`);
};
