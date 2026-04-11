import { supabase } from "@/lib/supabaseClient";

export const addResident = async (
  form: { fullName: string; documentTypeCode: string; documentNumber: string; email: string; phone: string },
  complexId: string,
  apartmentId: string
) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No session");

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/addResident?complexId=${complexId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apartmentId,
        ...form
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error al agregar residente");
  }

  return response.json();
};

export const removeResident = async (
  profileId: string,
  complexId: string,
  apartmentId: string,
  role: string
) => {
  // 1. Obtener la sesión para el token
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("No authenticated session");
  }

  // 2. Definir los params (complexId va en la URL según tu estándar)
  const params = new URLSearchParams({ complexId });

  // 3. Ejecutar la petición
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/deleteApartmentResident?${params.toString()}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        apartmentId,
        profileId,
        role,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al eliminar el residente");
  }

  return data;
};