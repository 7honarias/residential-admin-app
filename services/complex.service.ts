
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchUserComplexes = async (token: string) => {
  

  const response = await fetch(`${API_URL}/getUserComplex`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error fetching complexes");
  }

  return data; // Debe devolver array [{ id, name }]
};
