import { OwnerForm } from "@/app/dashboard/apartments/apartment.types";
import { supabase } from "@/lib/supabaseClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const UpdateOwner = async (
  form: OwnerForm,
  complexId: string,
  apartmentId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("No authenticated session");
  }

  const params = new URLSearchParams({ complexId });

  const response = await fetch(
    `${API_URL}/assignApartmentOwner?${params.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apartmentId,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al asignar el propietario");
  }

  return data;
};
