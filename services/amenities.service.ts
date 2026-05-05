import { Amenity } from "@/app/dashboard/amenities/amenitie.tyes";
import { supabase } from "@/lib/supabaseClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const AMENITY_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_AMENITIES_BUCKET || "amenities-images";

const MAX_AMENITY_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const AMENITY_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const sanitizeFileName = (name: string): string => {
  const base = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "");
  return base || "amenity-image";
};

const extractStoragePathFromPublicUrl = (
  publicUrl: string,
  bucket: string,
): string | null => {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const encodedPath = url.pathname.slice(markerIndex + marker.length);
    return decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
};

export const uploadAmenityImage = async ({
  file,
  complexId,
  amenityId,
}: {
  file: File;
  complexId: string;
  amenityId?: string;
}): Promise<{ imageUrl: string; storagePath: string }> => {
  if (!complexId) {
    throw new Error("complexId es requerido para subir la imagen");
  }

  if (!AMENITY_ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WebP.");
  }

  if (file.size > MAX_AMENITY_IMAGE_SIZE_BYTES) {
    throw new Error("La imagen supera el límite de 5 MB.");
  }

  const safeName = sanitizeFileName(file.name);
  const uniquePart = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entityPart = amenityId ? `${amenityId}/` : "";
  const storagePath = `${complexId}/${entityPart}${uniquePart}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(AMENITY_IMAGES_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`No fue posible cargar la imagen: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from(AMENITY_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  if (!data?.publicUrl) {
    throw new Error("No fue posible generar la URL pública de la imagen.");
  }

  return {
    imageUrl: data.publicUrl,
    storagePath,
  };
};

export const deleteAmenityImageByUrl = async (
  imageUrl?: string | null,
): Promise<void> => {
  if (!imageUrl) return;

  const storagePath = extractStoragePathFromPublicUrl(
    imageUrl,
    AMENITY_IMAGES_BUCKET,
  );

  if (!storagePath) return;

  const { error } = await supabase.storage
    .from(AMENITY_IMAGES_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new Error(`No fue posible eliminar la imagen anterior: ${error.message}`);
  }
};

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