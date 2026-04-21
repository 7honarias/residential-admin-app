export type ListingType = "SALE" | "RENT";

export type PublicComplex = {
  id: string;
  name: string;
  address: string | null;
};

export type PublicListing = {
  id: string;
  apartmentId: string;
  listingType: ListingType;
  price: number;
  currency: string;
  title: string;
  description: string;
  areaM2: number | null;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  phone: string | null;
  whatsapp: string | null;
  createdAt: string;
  apartment: {
    id: string;
    number: string;
    floor: number | null;
    blockName: string;
    complex: {
      id: string;
      name: string;
      address: string | null;
    };
  };
  photoUrls: string[];
};

export type PublicListingsResponse = {
  complexes: PublicComplex[];
  listings: PublicListing[];
  total: number;
};

export type RelatedPublicListing = {
  id: string;
  listingType: "SALE" | "RENT";
  price: number;
  title: string;
  apartment: {
    number: string;
    blockName: string;
    complex: {
      id: string;
      name: string;
      address: string | null;
    };
  };
  coverUrl: string | null;
};

export type PublicListingDetailResponse = {
  listing: PublicListing;
  related: RelatedPublicListing[];
};

export type PublicListingsQuery = {
  complexId?: string;
  listingType?: ListingType;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  minBedrooms?: string;
  minBathrooms?: string;
};

const PUBLIC_LISTINGS_API_URL =
  process.env.NEXT_PUBLIC_MOBILE_APP_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL;

export async function getPublicListings(
  query: PublicListingsQuery,
  signal?: AbortSignal,
): Promise<PublicListingsResponse> {
  const params = new URLSearchParams();
  if (query.complexId) params.set("complexId", query.complexId);
  if (query.listingType) params.set("listingType", query.listingType);
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.minPrice?.trim()) params.set("minPrice", query.minPrice.trim());
  if (query.maxPrice?.trim()) params.set("maxPrice", query.maxPrice.trim());
  if (query.minBedrooms?.trim()) params.set("minBedrooms", query.minBedrooms.trim());
  if (query.minBathrooms?.trim()) params.set("minBathrooms", query.minBathrooms.trim());

  const baseUrl = getApiBaseUrl();
  const queryString = params.toString();
  const url = queryString
    ? `${baseUrl}/publicListings?${queryString}`
    : `${baseUrl}/publicListings`;

  const response = await fetch(url, {
    signal,
    cache: "no-store",
  });

  const data = (await response.json()) as PublicListingsResponse & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message ?? "No fue posible cargar los clasificados");
  }

  return data;
}

export async function getPublicListingDetail(
  listingId: string,
  signal?: AbortSignal,
): Promise<PublicListingDetailResponse> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/publicListings/${listingId}`, {
    signal,
    cache: "no-store",
  });

  const data = (await response.json()) as PublicListingDetailResponse & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message ?? "No se pudo cargar el detalle del inmueble");
  }

  return data;
}

function getApiBaseUrl(): string {
  if (!PUBLIC_LISTINGS_API_URL) {
    throw new Error(
      "Falta configurar NEXT_PUBLIC_MOBILE_APP_BACKEND_URL o NEXT_PUBLIC_API_URL",
    );
  }
  return PUBLIC_LISTINGS_API_URL.replace(/\/$/, "");
}