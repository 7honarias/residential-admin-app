# Patrón de Servicios Frontend → Lambda Backend

Este documento explica cómo el frontend llama a los servicios y cómo debes implementar la Lambda en consecuencia.

---

## 📋 Patrón General

Todos los servicios en este proyecto siguen un patrón consistente:

### 1. **Autenticación con JWT**
```typescript
// El frontend SIEMPRE envía el token en el header Authorization
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
}
```

### 2. **Parámetros en la URL (Query Params)**
```typescript
// complexId SIEMPRE va como parámetro de query
const params = new URLSearchParams({ complexId });
const response = await fetch(`${API_URL}/getPqrsList?${params.toString()}`, {
  // ...
})
```

### 3. **Body para Acciones (POST)**
```typescript
// Estructura: { action, payload }
body: JSON.stringify({ 
  action: "RESPOND_PQRS",  // Nombre de la acción
  payload: {
    pqrs_id: "...",
    status: "...",
    admin_response: "..."
  }
})
```

---

## 🔍 Ejemplo Real: PQRS Service

### Frontend (pqrs.service.ts)

```typescript
// ==================== GET ====================
export const fetchPqrs = async ({
  token,
  complexId,
  options = {},
}: FetchPqrsParams): Promise<IGetPqrsResponse> => {
  const { status, limit = 20, cursor, order = "desc" } = options;

  const params = new URLSearchParams({ complexId });
  if (status && status !== "ALL") params.append("status", status);
  if (limit) params.append("limit", limit.toString());
  if (cursor) params.append("cursor", cursor);
  if (order) params.append("order", order);

  const response = await fetch(
    `${API_URL}/getPqrsList?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error fetching PQRS");
  }
  return data;
};

// ==================== POST ====================
export const respondPqrs = async ({
  token,
  complexId,
  payload,
}: RespondPqrsParams): Promise<IAdminPqrsResponse> => {
  const params = new URLSearchParams({ complexId });
  
  const response = await fetch(
    `${API_URL}/managePqrs?${params.toString()}`,  // 👈 Un endpoint para todas las acciones
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        action: "RESPOND_PQRS",
        payload: {
          pqrs_id: payload.pqrs_id,
          status: payload.status,
          admin_response: payload.admin_response,
        }
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error responding to PQRS");
  }
  return data;
};
```

---

## ⚙️ Cómo Implementar la Lambda

### Estructura Esperada: 2 Endpoints

#### **Endpoint 1: GET `/getPqrsList`**
```
GET https://api.example.com/getPqrsList?complexId=UUID&status=PENDING&limit=20&cursor=...&order=desc
Authorization: Bearer {JWT_TOKEN}
```

**Response esperada:**
```json
{
  "pqrs": [
    {
      "id": "...",
      "complex_id": "...",
      "type": "RECLAMO",
      "subject": "...",
      "status": "PENDING",
      "admin_response": null,
      "apartment_info": "Torre A - 502",
      "created_at": "2026-03-09T10:00:00Z",
      "updated_at": "2026-03-09T10:00:00Z"
    }
  ],
  "nextCursor": "base64_encoded_cursor_or_null"
}
```

---

#### **Endpoint 2: POST `/managePqrs`**
```
POST https://api.example.com/managePqrs?complexId=UUID
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "action": "RESPOND_PQRS",
  "payload": {
    "pqrs_id": "...",
    "status": "IN_PROGRESS",
    "admin_response": "Se está investigando el caso..."
  }
}
```

**Response esperada:**
```json
{
  "success": true,
  "pqrs": {
    "id": "...",
    "status": "IN_PROGRESS",
    "admin_response": "Se está investigando el caso...",
    "updated_at": "2026-03-09T11:00:00Z"
  }
}
```

---

## 📝 Template para Lambda (TypeScript)

```typescript
import { APIGatewayProxyHandler } from "aws-lambda";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Helper para verificar JWT y obtener user info
async function verifyToken(token: string) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Unauthorized");
  }
  return data.user;
}

// ==================== HANDLERS ====================

const handleGetPqrsList = async (
  complexId: string,
  status?: string,
  limit: number = 20,
  cursor?: string,
  order: string = "desc"
) => {
  // 1. Construir query base
  let query = supabase
    .from("pqrs")
    .select("*, apartments!inner(number, blocks!inner(name))")
    .eq("complex_id", complexId);

  // 2. Aplicar filtro de estado
  if (status && status !== "ALL") {
    query = query.eq("status", status);
  }

  // 3. Aplicar cursor si existe
  if (cursor) {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const { created_at, id } = JSON.parse(decoded);
    query = query.or(
      `created_at.lt.${created_at},and(created_at.eq.${created_at},id.lt.${id})`
    );
  }

  // 4. Ordenar y limitar
  const { data, error } = await query
    .order("created_at", { ascending: order === "asc" })
    .order("id", { ascending: order === "asc" })
    .limit(limit + 1);

  if (error) throw error;

  // 5. Preparar respuesta
  const hasMore = data!.length > limit;
  const pqrs = data!.slice(0, limit).map((ticket: any) => ({
    ...ticket,
    apartment_info: `${ticket.apartments.blocks.name} - ${ticket.apartments.number}`,
  }));

  const nextCursor = hasMore
    ? Buffer.from(
        JSON.stringify({
          created_at: pqrs[pqrs.length - 1].created_at,
          id: pqrs[pqrs.length - 1].id,
        })
      ).toString("base64")
    : null;

  return { pqrs, nextCursor };
};

const handleRespondPqrs = async (
  complexId: string,
  pqrs_id: string,
  status: string,
  admin_response: string
) => {
  // 1. Validar respuesta
  if (!admin_response || admin_response.trim().length === 0) {
    throw new Error("Admin response is required");
  }

  // 2. Verificar que el PQRS pertenece al complex
  const { data: ticket, error: fetchError } = await supabase
    .from("pqrs")
    .select("complex_id")
    .eq("id", pqrs_id)
    .single();

  if (fetchError || !ticket) {
    throw new Error("PQRS not found");
  }

  if (ticket.complex_id !== complexId) {
    throw new Error("PQRS does not belong to this complex");
  }

  // 3. Actualizar el PQRS
  const { data: updated, error: updateError } = await supabase
    .from("pqrs")
    .update({
      status,
      admin_response: admin_response.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", pqrs_id)
    .select()
    .single();

  if (updateError || !updated) {
    throw new Error("Failed to update PQRS");
  }

  return { success: true, pqrs: updated };
};

// ==================== MAIN HANDLER ====================

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // 1. Validar token
    const token = event.headers.Authorization?.replace("Bearer ", "");
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Missing authorization token" }),
      };
    }

    await verifyToken(token);

    // 2. Obtener complexId de query params
    const complexId = event.queryStringParameters?.complexId;
    if (!complexId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing complexId" }),
      };
    }

    // 3. Routear según path y método
    const path = event.path;

    if (path.includes("/getPqrsList") && event.httpMethod === "GET") {
      const result = await handleGetPqrsList(
        complexId,
        event.queryStringParameters?.status,
        parseInt(event.queryStringParameters?.limit || "20"),
        event.queryStringParameters?.cursor,
        event.queryStringParameters?.order
      );
      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    }

    if (path.includes("/managePqrs") && event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { action, payload } = body;

      if (action === "RESPOND_PQRS") {
        const result = await handleRespondPqrs(
          complexId,
          payload.pqrs_id,
          payload.status,
          payload.admin_response
        );
        return {
          statusCode: 200,
          body: JSON.stringify(result),
        };
      }

      throw new Error("Unknown action");
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (error) {
    console.error("Lambda error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
    };
  }
};
```

---

## 📊 Comparación con Otros Servicios

### Assembly Service (Referencia)
```typescript
// GET
const response = await fetch(
  `${API_URL}/getAssemblyList?${new URLSearchParams({ complexId })}`,
  { method: "GET", headers: { Authorization: `Bearer ${token}` } }
);

// POST - Con helper para todas las acciones
const executeAssemblyAction = (token, complexId, action, payload) => {
  return fetch(`${API_URL}/manageAssembly?${new URLSearchParams({ complexId })}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, payload }),
  });
};
```

### Parking Service (Referencia)
```typescript
// GET
const response = await fetch(
  `${API_URL}/getParkingList?complexId=${complexId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

// POST - Acciones
const response = await fetch(
  `${API_URL}/manageParkingSlot?complexId=${complexId}&parkingId=${parkingId}`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, payload }),
  }
);
```

---

## ✅ Checklist para la Lambda

- [ ] JWT validation con `getUser()`
- [ ] Verificar `complexId` en query params
- [ ] Ruta GET `/getPqrsList` implementada
- [ ] Ruta POST `/managePqrs` implementada
- [ ] Validar que el PQRS pertenece al complex
- [ ] Validar que `admin_response` no esté vacío
- [ ] Cursor encoding/decoding con base64
- [ ] RLS policies en Supabase habilitadas
- [ ] CORS configurado en API Gateway
- [ ] Error handling consistente
- [ ] Índices de base de datos creados

---

## 🔑 Key Differences from Frontend

| Aspecto | Frontend | Backend |
|--------|----------|---------|
| **Token** | Del Auth Context (Redux) | Recibido en Authorization header |
| **ComplexId** | Del store (Redux) | Query param de la request |
| **Autenticación** | Integrada en Supabase | JWT validation manual |
| **Database** | Supabase JS client | Supabase Service Role client |
| **Errores** | Thrown y catcheados | JSON response con statusCode |

---

## 🚀 Deployment

1. Deploy a AWS Lambda
2. Crear API Gateway:
   - `GET /getPqrsList`
   - `POST /managePqrs`
3. Configurar CORS
4. Agregar a `.env.local` del frontend:
   ```env
   NEXT_PUBLIC_API_URL=https://your-api-gateway-url
   ```
5. Ejecutar migrations SQL en Supabase
6. Testear ambas rutas

---

## 📝 Notas Importantes

- El frontend **NUNCA** accede directamente a Supabase desde servicios HTTP
- El backend es la única fuente de validación
- El JWT token debe ser validado en cada request
- El `complexId` es crítico para la seguridad (validar servidor-side)
- Usar Supabase Service Role en Lambda (nunca anon)
- Implementar RLS en Supabase las políticas adicionales

---

**Referencia completa**: Ver servicios existentes en `/services`
