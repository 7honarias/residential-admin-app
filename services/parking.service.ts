/* eslint-disable @typescript-eslint/no-explicit-any */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

  return res.json();
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
