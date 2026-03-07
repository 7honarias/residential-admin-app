const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchAmenityBookings = async (
  amenityId: string,
  token: string,
  complexId: string,
) => {
  const res = await fetch(
    `${API_URL}/getAmenityDetails?amenityId=${amenityId}&complexId=${complexId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error("Error al cargar reservas");
  return res.json();
};

export const updateBookingStatus = async (
  bookingId: string,
  newStatus: string,
  token: string,
  complexId: string,
) => {
  fetch(`${API_URL}/getAmenityDetails?complexId=${complexId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingId, status: newStatus }),
  });
};
