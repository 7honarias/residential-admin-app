import { Amenity } from "@/app/dashboard/amenities/amenitie.tyes";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchAmenities = async (complexId: string, token: string): Promise<Amenity[]> => {


  const response = await fetch(`${API_URL}/getAmenitiesList?complexId=${complexId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error al cargar las amenities");
  }

  return response.json();
};

export const upsertAmenity = async (
  token: string,
  complexId: string,
  data: Record<string, unknown>,
  amenityId?: string
) => {

  const url = amenityId
    ? `${API_URL}/createUpdateAmenities/${amenityId}?complexId=${complexId}`
    : `${API_URL}/createUpdateAmenities?complexId=${complexId}`;

  const method = amenityId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const responseData = await res.json();
  if (!res.ok) throw new Error(responseData.error || "Error al procesar la solicitud");
  
  return responseData;
};