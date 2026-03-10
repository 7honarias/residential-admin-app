# PQRS Lambda Implementation Guide for Backend Repository

Este documento es una guía **específica para implementar la Lambda en tu otro repositorio**.

---

## 🎯 Objetivo

Implementar 2 endpoints Lambda que el frontend espera en una URL específica:

1. **GET** `/getPqrsList` - Listar PQRS con paginación cursor-based
2. **POST** `/managePqrs` - Ejecutar acciones (RESPOND_PQRS)

---

## 📡 Contrato (Frontend → Backend)

### GET `/getPqrsList`

**Llamada desde Frontend:**
```typescript
// Desde pqrs.service.ts
const response = await fetch(
  `${API_URL}/getPqrsList?complexId=UUID&status=PENDING&limit=20&cursor=base64&order=desc`,
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer JWT_TOKEN"
    }
  }
);
```

**Query Parameters:**
| Parámetro | Tipo | Requerido | Ejemplo |
|-----------|------|----------|---------|
| `complexId` | string (UUID) | ✅ | `550e8400-e29b-41d4-a716-446655440000` |
| `status` | string | ❌ | `PENDING`, `IN_PROGRESS`, `RESOLVED` |
| `limit` | number | ❌ | `20` (default) |
| `cursor` | string (base64) | ❌ | `eyJjcmVhdGVkX2F0IjoiMjAyNi0wMy...` |
| `order` | string | ❌ | `asc` o `desc` (default `desc`) |

**Response esperada (200 OK):**
```json
{
  "pqrs": [
    {
      "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "complex_id": "550e8400-e29b-41d4-a716-446655440000",
      "apartment_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "type": "RECLAMO",
      "subject": "Ruido excesivo",
      "description": "Los residentes de arriba hacen mucho ruido...",
      "status": "PENDING",
      "admin_response": null,
      "apartment_info": "Torre A - 502",
      "created_at": "2026-03-09T10:30:00.000Z",
      "updated_at": "2026-03-09T10:30:00.000Z"
    }
  ],
  "nextCursor": "eyJjcmVhdGVkX2F0IjoiMjAyNi0wMy0wOVQxMDozMD..." | null
}
```

**Error Response (400/401/403):**
```json
{
  "error": "Missing complexId" | "Unauthorized" | "PQRS not found"
}
```

---

### POST `/managePqrs`

**Llamada desde Frontend:**
```typescript
// Desde pqrs.service.ts - respondPqrs()
const response = await fetch(
  `${API_URL}/managePqrs?complexId=UUID`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer JWT_TOKEN"
    },
    body: JSON.stringify({
      "action": "RESPOND_PQRS",
      "payload": {
        "pqrs_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "status": "IN_PROGRESS",
        "admin_response": "Se está investigando el caso..."
      }
    })
  }
);
```

**Query Parameters:**
| Parámetro | Tipo | Requerido |
|-----------|------|----------|
| `complexId` | string (UUID) | ✅ |

**Body Structure:**
```typescript
{
  "action": "RESPOND_PQRS",  // Nombre de la acción
  "payload": {
    "pqrs_id": string,        // UUID del PQRS
    "status": string,         // PENDING, IN_PROGRESS, RESOLVED
    "admin_response": string  // Respuesta del admin (trim(), length > 0)
  }
}
```

**Response esperada (200 OK):**
```json
{
  "success": true,
  "pqrs": {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "complex_id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "RECLAMO",
    "subject": "Ruido excesivo",
    "status": "IN_PROGRESS",
    "admin_response": "Se está investigando el caso...",
    "updated_at": "2026-03-09T11:00:00.000Z"
  }
}
```

**Error Response (400/401/403/500):**
```json
{
  "error": "Admin response is required" | "PQRS not found" | "Unauthorized"
}
```

---

## 🔧 Stack Esperado

Basándome en otros endpoints del proyecto, el stack debe ser:

- **Language**: TypeScript
- **Runtime**: AWS Lambda (Node.js 18+)
- **ORM/Client**: Supabase (`@supabase/supabase-js`)
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT (Bearer tokens)

---

## 📋 Estructura de Base de Datos Esperada

### Tabla: `pqrs`
```sql
CREATE TABLE pqrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES residential_complexes(id),
  apartment_id UUID NOT NULL REFERENCES apartments(id),
  type pqrs_type NOT NULL,  -- ENUM: PETICION, QUEJA, RECLAMO, SUGERENCIA
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status pqrs_status NOT NULL,  -- ENUM: PENDING, IN_PROGRESS, RESOLVED, REJECTED
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Relaciones esperadas:
- `apartments` table con columnas: `id`, `block_id`, `number`
- `blocks` table con columnas: `id`, `name`

### Índices recomendados:
```sql
CREATE INDEX idx_pqrs_complex_status_created_id 
  ON pqrs(complex_id, status, created_at DESC, id DESC);

CREATE INDEX idx_pqrs_complex_created_id 
  ON pqrs(complex_id, created_at DESC, id DESC);
```

---

## 🔐 Seguridad Obligatoria

### 1. JWT Validation
```typescript
const token = event.headers.Authorization?.replace("Bearer ", "");
const user = await supabase.auth.getUser(token);
if (!user) throw new Error("Unauthorized");
```

### 2. ComplexId Validation
```typescript
const complexId = event.queryStringParameters?.complexId;
if (!complexId) throw new Error("Missing complexId");
// Verificar que el usuario tiene acceso a este complex
```

### 3. PQRS Ownership Validation
```typescript
const { data: ticket } = await supabase
  .from("pqrs")
  .select("complex_id")
  .eq("id", pqrs_id)
  .single();

if (ticket.complex_id !== complexId) {
  throw new Error("PQRS does not belong to this complex");
}
```

### 4. Admin Response Validation
```typescript
if (!admin_response || admin_response.trim().length === 0) {
  throw new Error("Admin response is required");
}
```

---

## ⚙️ Implementación Paso a Paso

### 1. Setup (en tu repo de backend)
```bash
npm install @supabase/supabase-js
```

### 2. Handler GET `/getPqrsList`

```typescript
async function handleGetPqrsList(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // 1. Validar token
    const token = event.headers.Authorization?.replace("Bearer ", "");
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    
    const { data: user } = await supabase.auth.getUser(token);
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
    }

    // 2. Obtener parámetros
    const { complexId, status, limit, cursor, order } = event.queryStringParameters || {};
    
    if (!complexId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing complexId" }) };
    }

    const pageLimit = parseInt(limit || "20");
    const pageOrder = order === "asc" ? false : true;

    // 3. Construir query
    let query = supabase
      .from("pqrs")
      .select(`*, apartments!inner(number, blocks!inner(name))`)
      .eq("complex_id", complexId)
      .order("created_at", { ascending: !pageOrder })
      .order("id", { ascending: !pageOrder })
      .limit(pageLimit + 1);

    // 4. Aplicar filtro de status
    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    // 5. Aplicar cursor
    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, "base64").toString());
        query = query.or(
          `created_at.lt.${decoded.created_at},and(created_at.eq.${decoded.created_at},id.lt.${decoded.id})`
        );
      } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid cursor" }) };
      }
    }

    // 6. Ejecutar query
    const { data, error } = await query;

    if (error) throw error;

    // 7. Procesar resultados
    const hasMore = (data || []).length > pageLimit;
    const results = (data || []).slice(0, pageLimit);

    const pqrs = results.map((ticket: any) => ({
      ...ticket,
      apartment_info: `${ticket.apartments.blocks.name} - ${ticket.apartments.number}`,
    }));

    // 8. Generar siguiente cursor
    let nextCursor = null;
    if (hasMore && pqrs.length > 0) {
      const lastItem = pqrs[pqrs.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          created_at: lastItem.created_at,
          id: lastItem.id,
        })
      ).toString("base64");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ pqrs, nextCursor }),
    };
  } catch (error) {
    console.error("Error en GET /getPqrsList:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal error" }),
    };
  }
}
```

### 3. Handler POST `/managePqrs`

```typescript
async function handleManagePqrs(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // 1. Validar token
    const token = event.headers.Authorization?.replace("Bearer ", "");
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    // 2. Validar body
    const body = JSON.parse(event.body || "{}");
    const { action, payload } = body;

    if (!action || !payload) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid body" }) };
    }

    // 3. Obtener complexId
    const complexId = event.queryStringParameters?.complexId;
    if (!complexId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing complexId" }) };
    }

    // 4. Routear acción
    if (action === "RESPOND_PQRS") {
      return await handleRespondPqrs(token, complexId, payload);
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
  } catch (error) {
    console.error("Error en POST /managePqrs:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal error" }),
    };
  }
}

async function handleRespondPqrs(
  token: string,
  complexId: string,
  payload: { pqrs_id: string; status: string; admin_response: string }
): Promise<APIGatewayProxyResult> {
  try {
    // 1. Validar payload
    const { pqrs_id, status, admin_response } = payload;

    if (!pqrs_id || !status) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing pqrs_id or status" }) };
    }

    if (!admin_response || admin_response.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Admin response is required" }) };
    }

    // 2. Verificar que el PQRS pertenece al complex
    const { data: ticket, error: fetchError } = await supabase
      .from("pqrs")
      .select("complex_id")
      .eq("id", pqrs_id)
      .single();

    if (fetchError || !ticket) {
      return { statusCode: 404, body: JSON.stringify({ error: "PQRS not found" }) };
    }

    if (ticket.complex_id !== complexId) {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }

    // 3. Actualizar PQRS
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
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to update" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, pqrs: updated }),
    };
  } catch (error) {
    console.error("Error en handleRespondPqrs:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal error" }),
    };
  }
}
```

### 4. Main Handler

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const path = event.path;
  const method = event.httpMethod;

  // Rutas
  if (path.includes("/getPqrsList") && method === "GET") {
    return await handleGetPqrsList(event);
  }

  if (path.includes("/managePqrs") && method === "POST") {
    return await handleManagePqrs(event);
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ error: "Not found" }),
  };
};
```

---

## ✅ Checklist de Implementación

- [ ] Crear Lambda function en AWS
- [ ] Instalar dependencias (`supabase-js`)
- [ ] Implementar GET `/getPqrsList`
- [ ] Implementar POST `/managePqrs` con action RESPOND_PQRS
- [ ] Validar JWT token
- [ ] Validar complexId (query param)
- [ ] Validar pertenencia de PQRS al complex
- [ ] Validar admin_response no vacío
- [ ] Cursor encoding/decoding con base64
- [ ] Crear índices en BD
- [ ] Configurar RLS en Supabase
- [ ] Crear API Gateway endpoints:
  - `GET /getPqrsList`
  - `POST /managePqrs`
- [ ] Configurar CORS en API Gateway
- [ ] Agregar NEXT_PUBLIC_API_URL en frontend `.env.local`
- [ ] Testear ambos endpoints con Postman/Insomnia
- [ ] Testear desde frontend

---

## 🧪 Testing con Postman/Insomnia

### GET `/getPqrsList`

```
GET https://your-api.example.com/getPqrsList?complexId=550e8400-e29b-41d4-a716-446655440000&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Response esperada:**
```json
{
  "pqrs": [...],
  "nextCursor": "..."
}
```

### POST `/managePqrs`

```
POST https://your-api.example.com/managePqrs?complexId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "action": "RESPOND_PQRS",
  "payload": {
    "pqrs_id": "...",
    "status": "IN_PROGRESS",
    "admin_response": "Se está investigando..."
  }
}
```

---

## 📚 Referencias

- Frontend service: `/services/pqrs.service.ts`
- Frontend types: `/app/dashboard/pqrs/pqrs.types.ts`
- Pattern reference: `/docs/PATRON-SERVICIOS.md`
- Database migration: `/docs/pqrs-migration.sql`

---

**Status**: Este documento es lo que necesitas para implementar la Lambda en tu repositorio backend.
