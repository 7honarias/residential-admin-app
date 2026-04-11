const API_URL = process.env.NEXT_PUBLIC_API_URL;
import { supabase } from "@/lib/supabaseClient";

export type LogCategory = "ROUTINE" | "PACKAGE" | "INCIDENT" | "OTHER" | "CORRECTION";

export interface ShiftInfo {
  shift_id: string;
  started_at: string;
  status: "ACTIVE" | "CLOSED";
}

export interface ShiftSummary {
  shift_id: string;
  started_at: string;
  ended_at?: string | null;
  status: "ACTIVE" | "CLOSED";
}

export interface ShiftLogAttachment {
  file_url: string;
  file_type: "IMAGE";
}

export interface ShiftLogItem {
  id: string;
  shift_id: string;
  category: LogCategory;
  content: string;
  created_at: string;
  reference_log_id?: string | null;
  attachments?: ShiftLogAttachment[];
}

export interface ShiftLogsResponse {
  logs: ShiftLogItem[];
  next_cursor: string | null;
}

export interface ShiftHistoryResponse {
  shifts: ShiftSummary[];
}

const LOGBOOK_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_LOGBOOK_BUCKET || "logbook-images";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FILES_PER_LOG = 4;

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

const buildFilePath = (complexId: string, shiftId: string, fileName: string) => {
  const uniqueId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `gatehouse-logs/${complexId}/${shiftId}/${Date.now()}-${uniqueId}-${sanitizeFileName(fileName)}`;
};

const extractShiftInfo = (data: unknown): ShiftInfo | null => {
  if (!data || typeof data !== "object") return null;

  const direct = data as Partial<ShiftInfo>;
  if (typeof direct.shift_id === "string" && typeof direct.started_at === "string") {
    return {
      shift_id: direct.shift_id,
      started_at: direct.started_at,
      status: direct.status === "CLOSED" ? "CLOSED" : "ACTIVE",
    };
  }

  const nested = (data as { data?: Partial<ShiftInfo> }).data;
  if (nested && typeof nested.shift_id === "string" && typeof nested.started_at === "string") {
    return {
      shift_id: nested.shift_id,
      started_at: nested.started_at,
      status: nested.status === "CLOSED" ? "CLOSED" : "ACTIVE",
    };
  }

  return null;
};

const parseApiResponse = async (response: Response, fallbackMessage: string) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (data as { error?: string; message?: string })?.error ||
      (data as { error?: string; message?: string })?.message ||
      fallbackMessage;
    throw new Error(message);
  }

  return data;
};

export const startShift = async ({
  token,
  complexId,
}: {
  token: string;
  complexId: string;
}): Promise<ShiftInfo> => {
  if (!token) throw new Error("Token is required");
  if (!complexId) throw new Error("ComplexId is required");

  const response = await fetch(`${API_URL}/api/shifts/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      complex_id: complexId,
    }),
  });

  const data = await response.json().catch(() => ({}));
  const shiftInfo = extractShiftInfo(data);
  if (shiftInfo && (response.ok || shiftInfo.status === "ACTIVE")) {
    return shiftInfo;
  }

  if (!response.ok) {
    const message =
      (data as { error?: string; message?: string })?.error ||
      (data as { error?: string; message?: string })?.message ||
      "No fue posible abrir el turno";
    throw new Error(message);
  }

  throw new Error("No fue posible abrir el turno");
};

export const closeShift = async ({
  token,
  shiftId,
  closingObservations,
}: {
  token: string;
  shiftId: string;
  closingObservations: string;
}) => {
  if (!token) throw new Error("Token is required");
  if (!shiftId) throw new Error("ShiftId is required");

  const response = await fetch(`${API_URL}/api/shifts/close`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shift_id: shiftId,
      closing_observations: closingObservations,
    }),
  });

  return parseApiResponse(response, "No fue posible cerrar el turno");
};

export const createShiftLog = async ({
  token,
  payload,
}: {
  token: string;
  payload: {
    shift_id: string;
    category: LogCategory;
    content: string;
    reference_log_id?: string | null;
    attachments?: ShiftLogAttachment[];
  };
}) => {
  if (!token) throw new Error("Token is required");
  if (!payload.shift_id) throw new Error("shift_id is required");
  if (!payload.content.trim()) throw new Error("content is required");

  const response = await fetch(`${API_URL}/api/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse(response, "No fue posible crear el registro");
};

export const fetchShiftLogs = async ({
  token,
  shiftId,
  cursor,
  limit = 15,
}: {
  token: string;
  shiftId: string;
  cursor?: string | null;
  limit?: number;
}): Promise<ShiftLogsResponse> => {
  if (!token) throw new Error("Token is required");
  if (!shiftId) throw new Error("shiftId is required");

  const params = new URLSearchParams({
    shift_id: shiftId,
    limit: String(limit),
  });

  if (cursor) {
    params.append("cursor", cursor);
  }

  const response = await fetch(`${API_URL}/api/logs?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseApiResponse(response, "No fue posible cargar la bitácora");
  const list =
    (data as { logs?: ShiftLogItem[] }).logs ||
    (data as { items?: ShiftLogItem[] }).items ||
    [];
  const nextCursor =
    (data as { next_cursor?: string | null }).next_cursor ??
    (data as { nextCursor?: string | null }).nextCursor ??
    null;

  return {
    logs: list,
    next_cursor: nextCursor,
  };
};

export const fetchClosedShifts = async ({
  token,
  complexId,
  limit = 20,
}: {
  token: string;
  complexId: string;
  limit?: number;
}): Promise<ShiftHistoryResponse> => {
  if (!token) throw new Error("Token is required");
  if (!complexId) throw new Error("complexId is required");

  const params = new URLSearchParams({
    complex_id: complexId,
    status: "CLOSED",
    limit: String(limit),
  });

  const response = await fetch(`${API_URL}/api/shifts?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseApiResponse(response, "No fue posible cargar minutas anteriores");
  const rawList =
    (data as { shifts?: unknown[] }).shifts ||
    (data as { items?: unknown[] }).items ||
    (data as { data?: unknown[] }).data ||
    [];

  const shifts = rawList
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as {
        shift_id?: string;
        id?: string;
        started_at?: string;
        startedAt?: string;
        ended_at?: string | null;
        endedAt?: string | null;
        status?: "ACTIVE" | "CLOSED";
      };

      const shiftId = row.shift_id || row.id;
      const startedAt = row.started_at || row.startedAt;

      if (!shiftId || !startedAt) return null;

      return {
        shift_id: shiftId,
        started_at: startedAt,
        ended_at: row.ended_at ?? row.endedAt ?? null,
        status: row.status === "ACTIVE" ? "ACTIVE" : "CLOSED",
      } as ShiftSummary;
    })
    .filter((item): item is ShiftSummary => Boolean(item));

  return { shifts };
};

export const uploadLogImages = async ({
  files,
  complexId,
  shiftId,
}: {
  files: File[];
  complexId: string;
  shiftId: string;
}): Promise<ShiftLogAttachment[]> => {
  if (!files.length) return [];
  if (!complexId) throw new Error("complexId is required");
  if (!shiftId) throw new Error("shiftId is required");

  if (files.length > MAX_FILES_PER_LOG) {
    throw new Error(`Máximo ${MAX_FILES_PER_LOG} imágenes por registro`);
  }

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error(`Tipo de archivo no permitido: ${file.type}. Solo se aceptan JPEG, PNG y WebP.`);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`La imagen '${file.name}' supera el límite de 5 MB.`);
    }
  }

  const uploads = await Promise.all(
    files.map(async (file) => {
      const filePath = buildFilePath(complexId, shiftId, file.name);
      const { error: uploadError } = await supabase.storage.from(LOGBOOK_BUCKET).upload(filePath, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

      if (uploadError) {
        throw new Error(`No fue posible cargar imagen '${file.name}': ${uploadError.message}`);
      }

      // Bucket is private — generate a signed URL valid for 1 year (31536000 s)
      const { data: signedData, error: signedError } = await supabase.storage
        .from(LOGBOOK_BUCKET)
        .createSignedUrl(filePath, 31536000);

      if (signedError || !signedData?.signedUrl) {
        throw new Error(`No fue posible generar URL de acceso para '${file.name}'`);
      }

      return {
        file_url: signedData.signedUrl,
        file_type: "IMAGE" as const,
      };
    })
  );

  return uploads;
};
