/* eslint-disable @typescript-eslint/no-explicit-any */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ==========================================
// INTERFACES
// ==========================================
interface BasePollParams {
  token: string;
  complexId: string;
}

export interface CreatePollParams extends BasePollParams {
  payload: {
    assembly_id: string;
    question: string;
    options: string[];
    majority_type: string; // 'SIMPLE' | 'QUALIFIED'
  };
}

export interface ChangePollStatusParams extends BasePollParams {
  payload: {
    poll_id: string;
    status: 'ACTIVE' | 'CLOSED';
  };
}

export interface DeletePollParams extends BasePollParams {
  payload: {
    poll_id: string;
  };
}

// ==========================================
// FUNCIÓN BASE (Privada, no se exporta)
// ==========================================
const executePollAction = async (
  token: string, 
  complexId: string, 
  action: string, 
  payload: any
) => {
  const params = new URLSearchParams({ complexId });
  
  // Asegúrate de que el endpoint coincida con tu API Gateway (ej. /manageVoting)
  const response = await fetch(`${API_URL}/manageVoting?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

// ==========================================
// FUNCIONES PÚBLICAS (Las que usas en la UI)
// ==========================================

export const createPoll = async ({ token, complexId, payload }: CreatePollParams) => {
  return executePollAction(token, complexId, "CREATE_POLL", payload);
};

export const changePollStatus = async ({ token, complexId, payload }: ChangePollStatusParams) => {
  return executePollAction(token, complexId, "CHANGE_POLL_STATUS", payload);
};

export const deletePoll = async ({ token, complexId, payload }: DeletePollParams) => {
  return executePollAction(token, complexId, "DELETE_POLL", payload);
};