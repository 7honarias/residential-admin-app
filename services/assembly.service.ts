/* eslint-disable @typescript-eslint/no-explicit-any */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ==========================================
// INTERFACES (GET)
// ==========================================
export interface FetchAssembliesParams {
  token: string;
  complexId: string;
  blockId?: string;
}

export interface AssembliesResponse {
  assemblies: {
    id: string;
    title: string;
    status: string;
    scheduled_for: string;
    attendees_count: number;
  }[];
}

export interface FetchAssemblyDetailParams {
  token: string;
  complexId: string;
  assemblyId: string;
}

export interface AssemblyDetailResponse {
  assembly: {
    id: string;
    title: string;
    status: 'SCHEDULED' | 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'FINISHED';
    scheduled_for: string;
    quorum_percentage: number;
    attendees_count: number;
  };
  agenda: any[];
  polls: any[];
  logs: any[];
}

// ==========================================
// INTERFACES (POST - ACCIONES)
// ==========================================
export interface ChangeAssemblyStatusParams {
  token: string;
  complexId: string;
  payload: {
    assembly_id: string;
    status: 'SCHEDULED' | 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'FINISHED';
  };
}

export interface UpdateAgendaParams {
  token: string;
  complexId: string;
  payload: {
    assembly_id: string;
    agenda: any[];
  };
}

export interface AddLogParams {
  token: string;
  complexId: string;
  payload: {
    assembly_id: string;
    event_type: 'SYSTEM' | 'POLL' | 'NOTE';
    description: string;
  };
}

// ==========================================
// FUNCIONES DE LECTURA (GET)
// ==========================================

export const fetchAssemblies = async ({
  token,
  complexId,
}: FetchAssembliesParams): Promise<AssembliesResponse> => {
  const params = new URLSearchParams({ complexId });

  const response = await fetch(
    `${API_URL}/getAssemblyList?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Error 403 del Backend:", data);
    throw new Error(data.error || data.message || "Error desconocido al traer asambleas");
  }

  return data;
};

export const fetchAssemblyDetail = async ({
  token,
  complexId,
  assemblyId,
}: FetchAssemblyDetailParams): Promise<AssemblyDetailResponse> => {
  const params = new URLSearchParams({ complexId, assemblyId });

  // OJO: Asegúrate de que el endpoint coincida con tu API Gateway (getAssemblyDetail o getAssemblyDetails)
  const response = await fetch(
    `${API_URL}/getAssemblyDetails?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Error obteniendo detalle de asamblea:", data);
    throw new Error(data.error || data.message || "Error desconocido al cargar la sala");
  }

  return data;
};

// ==========================================
// FUNCIONES DE ESCRITURA (POST)
// ==========================================

// Función base (Helper) para no repetir el fetch en cada acción de manageAssembly
const executeAssemblyAction = async (
  token: string, 
  complexId: string, 
  action: string, 
  payload: any
) => {
  const params = new URLSearchParams({ complexId });
  const response = await fetch(`${API_URL}/manageAssembly?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, payload }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error(`❌ Error en la acción ${action}:`, data);
    throw new Error(data.error || data.message || `Error ejecutando la acción ${action}`);
  }
  return data;
};

export const createAssembly = async (
  data: { title: string; scheduled_for: string },
  token: string,
  complexId: string,
) => {
  return executeAssemblyAction(token, complexId, "CREATE_ASSEMBLY", data);
};

export const changeAssemblyStatus = async ({
  token,
  complexId,
  payload,
}: ChangeAssemblyStatusParams) => {
  return executeAssemblyAction(token, complexId, "CHANGE_ASSEMBLY_STATUS", payload);
};

export const updateAgenda = async ({
  token,
  complexId,
  payload,
}: UpdateAgendaParams) => {
  return executeAssemblyAction(token, complexId, "UPDATE_AGENDA", payload);
};

export const addLog = async ({
  token,
  complexId,
  payload,
}: AddLogParams) => {
  return executeAssemblyAction(token, complexId, "ADD_LOG", payload);
};
