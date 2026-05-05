import { supabase } from "@/lib/supabaseClient";

export type GuestAuthorizationType = "PEDESTRIAN" | "VEHICLE" | "TECHNICAL_SERVICE";
export type GuestAuthorizationStatus = "PENDING" | "USED" | "EXPIRED" | "CANCELLED";

export interface GuestAuthorization {
  id: string;
  apartmentId: string;
  apartmentNumber: string;
  blockName?: string;
  residentName: string;
  type: GuestAuthorizationType;
  guestName: string;
  company: string | null;
  vehiclePlate: string | null;
  scheduledAt: string;
  validUntil: string;
  status: GuestAuthorizationStatus;
  accessCode: string;
  notes: string | null;
  createdAt: string;
  usedAt: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any, apartmentNumber: string, blockName?: string): GuestAuthorization {
  const isExpired =
    row.status === "PENDING" && new Date(row.valid_until) < new Date();
  return {
    id: row.id,
    apartmentId: row.apartment_id,
    apartmentNumber,
    blockName: blockName ?? undefined,
    residentName: row.resident_name ?? "",
    type: row.type as GuestAuthorizationType,
    guestName: row.guest_name,
    company: row.company ?? null,
    vehiclePlate: row.plate ?? null,
    scheduledAt: row.scheduled_at,
    validUntil: row.valid_until,
    status: isExpired ? "EXPIRED" : (row.status as GuestAuthorizationStatus),
    accessCode: row.access_code,
    notes: row.notes ?? null,
    createdAt: row.created_at,
    usedAt: row.used_at ?? null,
  };
}

const INVITATION_SELECT =
  "id, apartment_id, complex_id, resident_name, type, guest_name, company, plate, scheduled_at, valid_until, status, access_code, notify_on_arrival, notes, created_at, used_at";

export async function searchInvitationsByApartment(params: {
  complexId: string;
  query: string;
}): Promise<GuestAuthorization[]> {
  const { complexId, query } = params;
  const trimmed = query.trim();

  const seenIds = new Set<string>();
  const allApts: Record<string, unknown>[] = [];
  const addApts = (rows: Record<string, unknown>[]) => {
    for (const r of rows) {
      if (!seenIds.has(r.id as string)) {
        seenIds.add(r.id as string);
        allApts.push(r);
      }
    }
  };

  const APT_SELECT = "id, number, blocks!inner(name, complex_id)";

  // Strategy A: apt number contains the full query  (e.g. "601")
  const { data: byNumber } = await supabase
    .from("apartments")
    .select(APT_SELECT)
    .eq("blocks.complex_id", complexId)
    .ilike("number", `%${trimmed}%`)
    .limit(20);
  if (byNumber?.length) addApts(byNumber as Record<string, unknown>[]);

  // Strategy B: block name contains the full query  (e.g. "torre 1")
  const { data: byBlock } = await supabase
    .from("apartments")
    .select(APT_SELECT)
    .eq("blocks.complex_id", complexId)
    .ilike("blocks.name", `%${trimmed}%`)
    .limit(20);
  if (byBlock?.length) addApts(byBlock as Record<string, unknown>[]);

  // Strategy C: multi-word query → "1 601" → block ilike "%1%"  AND  number ilike "%601%"
  const tokens = trimmed.split(/\s+/);
  if (tokens.length >= 2) {
    const blockPart = tokens.slice(0, -1).join(" ");
    const numberPart = tokens[tokens.length - 1];
    const { data: bySplit } = await supabase
      .from("apartments")
      .select(APT_SELECT)
      .eq("blocks.complex_id", complexId)
      .ilike("blocks.name", `%${blockPart}%`)
      .ilike("number", `%${numberPart}%`)
      .limit(20);
    if (bySplit?.length) addApts(bySplit as Record<string, unknown>[]);
  }

  const apartmentIds = allApts.map((a) => a.id as string);

  // Instead of querying OR directly, get the invitations by guest matching name OR apts
  let orCondition = "";
  if (apartmentIds.length > 0) {
    const aptIdsStr = apartmentIds.join(",");
    orCondition = `apartment_id.in.(${aptIdsStr}),guest_name.ilike.%${trimmed}%,resident_name.ilike.%${trimmed}%`;
  } else {
    orCondition = `guest_name.ilike.%${trimmed}%,resident_name.ilike.%${trimmed}%`;
  }

  const { data: invitations, error: invErr } = await supabase
    .from("invitations")
    .select(INVITATION_SELECT)
    .eq("complex_id", complexId)
    .eq("status", "PENDING")
    .or(orCondition)
    .order("scheduled_at", { ascending: true })
    .limit(50);

  if (invErr) throw new Error("Error consultando invitaciones");

  const missingAptIds = new Set<string>();
  const aptMap = new Map(allApts.map((a) => [a.id as string, a]));
  for (const inv of (invitations ?? [])) {
     if (!aptMap.has(inv.apartment_id as string)) {
        missingAptIds.add(inv.apartment_id as string);
     }
  }

  if (missingAptIds.size > 0) {
     const { data: missingApts } = await supabase
       .from("apartments")
       .select(APT_SELECT)
       .in("id", Array.from(missingAptIds));
     if (missingApts) {
        for (const apt of missingApts) {
           aptMap.set(apt.id as string, apt);
        }
     }
  }

  return (invitations ?? []).map((row: Record<string, unknown>) => {
    const apt = aptMap.get(row.apartment_id as string) as Record<string, unknown> | undefined;
    const blocks = apt?.blocks as Record<string, unknown> | undefined;
    return mapRow(row, (apt?.number as string) ?? "", blocks?.name as string | undefined);
  });
}

export async function findInvitationByCode(params: {
  complexId: string;
  accessCode: string;
}): Promise<GuestAuthorization | null> {
  const { complexId, accessCode } = params;

  const { data: rows, error } = await supabase
    .from("invitations")
    .select(INVITATION_SELECT)
    .eq("complex_id", complexId)
    .eq("access_code", accessCode.toUpperCase().trim())
    .eq("status", "PENDING")
    .limit(1);

  if (error) throw new Error("Error verificando código");
  if (!rows?.length) return null;
  
  const row = rows[0] as Record<string, unknown>;

  const { data: apt } = await supabase
    .from("apartments")
    .select("number, blocks(name)")
    .eq("id", row.apartment_id as string)
    .single();

  const blocks = (apt as Record<string, unknown> | null)?.blocks as
    | Record<string, unknown>
    | undefined;
  return mapRow(
    row,
    (apt as Record<string, unknown> | null)?.number as string ?? "",
    blocks?.name as string | undefined,
  );
}

export async function findInvitationById(params: {
  complexId: string;
  invitationId: string;
}): Promise<GuestAuthorization | null> {
  const { complexId, invitationId } = params;

  const { data: rows, error } = await supabase
    .from("invitations")
    .select(INVITATION_SELECT)
    .eq("complex_id", complexId)
    .eq("id", invitationId)
    .eq("status", "PENDING")
    .limit(1);

  if (error) throw new Error("Error verificando invitación");
  if (!rows?.length) return null;

  const row = rows[0] as Record<string, unknown>;

  const { data: apt } = await supabase
    .from("apartments")
    .select("number, blocks(name)")
    .eq("id", row.apartment_id as string)
    .single();

  const blocks = (apt as Record<string, unknown> | null)?.blocks as
    | Record<string, unknown>
    | undefined;
  return mapRow(
    row,
    (apt as Record<string, unknown> | null)?.number as string ?? "",
    blocks?.name as string | undefined,
  );
}

export async function checkInGuest(params: {
  invitationId: string;
  securityUserId: string;
}): Promise<void> {
  const { invitationId, securityUserId } = params;

  const { error } = await supabase
    .from("invitations")
    .update({
      status: "USED",
      used_at: new Date().toISOString(),
      checked_in_by: securityUserId,
    })
    .eq("id", invitationId)
    .eq("status", "PENDING");

  if (error) throw new Error("Error registrando el ingreso");
}
