const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchAttendanceList = async (token: string, complexId: string, assemblyId: string) => {
  const params = new URLSearchParams({ complexId, assemblyId });
  
  // OJO: Asegúrate de que el nombre del endpoint coincida con tu AWS API Gateway
  const response = await fetch(`${API_URL}/manageAttendance?${params.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Error cargando la lista de asistencia");
  return data.attendance_list;
};

export const toggleAttendance = async (
  token: string, 
  complexId: string, 
  assemblyId: string, 
  apartmentId: string, 
  isCurrentlyPresent: boolean,
  // Actualizamos los nombres aquí:
  attendanceData?: { 
    is_proxy: boolean; 
    attendee_name?: string; 
    attendee_document?: string;
    can_vote?: boolean;
  }
) => {
  const params = new URLSearchParams({ complexId });
  const action = isCurrentlyPresent ? "CHECK_OUT" : "CHECK_IN";

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/manageAttendance?${params.toString()}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      action: action,
      payload: { 
        assembly_id: assemblyId, 
        apartment_id: apartmentId,
        ...attendanceData 
      }
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Error actualizando asistencia");
  return data;
};
