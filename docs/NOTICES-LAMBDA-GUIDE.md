# Notices Lambda Implementation Guide for Backend Repository

Este documento es una guía **específica para implementar la Lambda en tu repositorio de backend** (lambdaResidential).

---

## 🎯 Objetivo

Implementar 2 endpoints Lambda que el frontend espera:

1. **GET** `/getNoticesList` - Listar avisos con paginación cursor-based
2. **POST** `/manageNotices` - Crear avisos (acción `CREATE_NOTICE`)

---

## 📦 Modelo de Datos (Supabase)

### Tabla `notices`

Crear la siguiente tabla en Supabase PostgreSQL:

```sql
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES residential_complexes(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('GLOBAL', 'BLOCK', 'UNIT')),
  target_id UUID NULL,
  type TEXT NOT NULL CHECK (type IN ('INFO', 'WARNING', 'ALERT')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para cursor-based pagination
CREATE INDEX idx_notices_complex_order 
  ON notices (complex_id, created_at DESC, id DESC);

CREATE INDEX idx_notices_complex_scope_target 
  ON notices (complex_id, scope, target_id, created_at DESC, id DESC);

-- Para integridad referencial si aplica
CREATE INDEX idx_notices_target_id 
  ON notices (target_id);
```

### RLS Policies (Row Level Security)

Por ahora, mantén RLS simple o deshabilitado para este MVP. En producción:

```sql
-- Permitir SELECT/INSERT solo para usuarios ADMIN del complex_id
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage notices" 
  ON notices 
  FOR ALL 
  USING (auth.uid() IN (
    SELECT user_id FROM admin_memberships WHERE complex_id = notices.complex_id
  ));
```

---

## 📡 Contrato API (Frontend → Backend)

### GET `/getNoticesList`

**Llamada desde Frontend:**
```typescript
// Desde services/notices.service.ts
const response = await fetch(
  `${API_URL}/getNoticesList?complexId=UUID&limit=20&cursor=base64&order=desc`,
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
| `limit` | number | ❌ | `20` (default) |
| `cursor` | string (base64) | ❌ | `eyJjcmVhdGVkX2F0IjoiMjAyNi0wMy...` |
| `order` | string | ❌ | `asc` o `desc` (default `desc`) |

**Response esperada (200 OK):**
```json
{
  "notices": [
    {
      "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "complex_id": "550e8400-e29b-41d4-a716-446655440000",
      "scope": "GLOBAL",
      "target_id": null,
      "type": "INFO",
      "title": "Mantenimiento próximo",
      "message": "Se realizará mantenimiento en las zonas comunes...",
      "created_at": "2026-03-09T10:30:00.000Z",
      "target_name": "Todos"
    },
    {
      "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "complex_id": "550e8400-e29b-41d4-a716-446655440000",
      "scope": "BLOCK",
      "target_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "type": "WARNING",
      "title": "Cuota extraordinaria",
      "message": "Se cobrará una cuota extraordinaria...",
      "created_at": "2026-03-08T14:20:00.000Z",
      "target_name": "Torre A"
    }
  ],
  "nextCursor": "eyJjcmVhdGVkX2F0IjoiMjAyNi0wMy0wOFQxNDoyMD..." | null
}
```

**Error Response (400/401/403):**
```json
{
  "error": "Missing complexId" | "Unauthorized" | "Invalid pagination cursor"
}
```

---

### POST `/manageNotices`

**Llamada desde Frontend:**
```typescript
// Desde services/notices.service.ts - createNotice()
const response = await fetch(
  `${API_URL}/manageNotices?complexId=UUID`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer JWT_TOKEN"
    },
    body: JSON.stringify({
      "action": "CREATE_NOTICE",
      "payload": {
        "scope": "BLOCK",
        "target_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "type": "WARNING",
        "title": "Cuota extraordinaria",
        "message": "Se cobrará una cuota extraordinaria..."
      }
    })
  }
);
```

**Query Parameters:**
| Parámetro | Tipo | Requerido | Ejemplo |
|-----------|------|----------|---------|
| `complexId` | string (UUID) | ✅ | `550e8400-e29b-41d4-a716-446655440000` |

**Request Body:**
```typescript
{
  "action": "CREATE_NOTICE",
  "payload": {
    "scope": "GLOBAL" | "BLOCK" | "UNIT",
    "target_id": null | string (UUID),  // null si GLOBAL; blocks.id si BLOCK; apartment_id si UNIT
    "type": "INFO" | "WARNING" | "ALERT",
    "title": string (max 255 chars),
    "message": string
  }
}
```

**Response esperada (201 Created):**
```json
{
  "message": "Notice created successfully",
  "notice_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Error Response (400/401/403):**
```json
{
  "message": "Error creating notice",
  "error": "Validation failed" | "Unauthorized" | "Block not found in complex"
}
```

---

## 🔧 Implementación Backend (Lambda)

### Estructura de Archivos Recomendada

```
lambdaResidential/
├── src/
│   ├── handlers/
│   │   ├── adminNoticesLambda.ts       (nuevo)
│   │   └── ... (otros handlers)
│   ├── services/
│   │   ├── noticesService.ts           (nuevo)
│   │   └── ... (otros servicios)
│   ├── utils/
│   │   ├── authUtils.ts
│   │   ├── cursorPagination.ts         (nuevo o reutilizar)
│   │   └── ... (otros utils)
│   └── types/
│       ├── notices.types.ts             (nuevo)
│       └── ... (otros tipos)
```

### 1️⃣ Tipos TypeScript (`src/types/notices.types.ts`)

```typescript
export type NoticeScope = 'GLOBAL' | 'BLOCK' | 'UNIT';
export type NoticeType = 'INFO' | 'WARNING' | 'ALERT';

export interface INotice {
  id: string;
  complex_id: string;
  scope: NoticeScope;
  target_id: string | null;
  type: NoticeType;
  title: string;
  message: string;
  created_at: string;
  target_name?: string; // Calculado por backend
}

export interface ICreateNoticePayload {
  scope: NoticeScope;
  target_id: string | null;
  type: NoticeType;
  title: string;
  message: string;
}

export interface ICursorPayload {
  created_at: string;
  id: string;
}

export interface IGetNoticesResponse {
  notices: INotice[];
  nextCursor: string | null;
  error?: string;
}

export interface ICreateNoticeResponse {
  message: string;
  notice_id?: string;
  error?: string;
}
```

### 2️⃣ Servicio (`src/services/noticesService.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';
import {
  INotice,
  ICreateNoticePayload,
  ICursorPayload,
} from '../types/notices.types';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get notices list with cursor-based pagination
 */
export const getNoticesList = async (
  complexId: string,
  limit: number = 20,
  cursor?: string,
  order: 'asc' | 'desc' = 'desc'
): Promise<{ notices: INotice[]; nextCursor: string | null }> => {
  try {
    let query = supabase
      .from('notices')
      .select('*')
      .eq('complex_id', complexId)
      .order('created_at', { ascending: order === 'asc' })
      .order('id', { ascending: order === 'asc' });

    // Apply cursor if provided
    if (cursor) {
      const decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) as ICursorPayload;
      if (order === 'desc') {
        // Para DESC: created_at < cursor.created_at OR (created_at = cursor.created_at AND id < cursor.id)
        query = query
          .or(
            `created_at.lt.${decodedCursor.created_at},and(created_at.eq.${decodedCursor.created_at},id.lt.${decodedCursor.id})`
          );
      } else {
        // Para ASC: created_at > cursor.created_at OR (created_at = cursor.created_at AND id > cursor.id)
        query = query
          .or(
            `created_at.gt.${decodedCursor.created_at},and(created_at.eq.${decodedCursor.created_at},id.gt.${decodedCursor.id})`
          );
      }
    }

    // Fetch limit + 1 para detectar si hay más
    const { data, error } = await query.limit(limit + 1);

    if (error) throw error;

    const hasMore = data.length > limit;
    const notices = data.slice(0, limit);

    // Calculate next cursor
    let nextCursor: string | null = null;
    if (hasMore && notices.length > 0) {
      const lastNotice = notices[notices.length - 1];
      const cursorPayload: ICursorPayload = {
        created_at: lastNotice.created_at,
        id: lastNotice.id,
      };
      nextCursor = Buffer.from(JSON.stringify(cursorPayload)).toString('base64');
    }

    // Enrich notices with target_name
    const enrichedNotices = notices.map((notice) => ({
      ...notice,
      target_name: getTargetName(notice),
    }));

    return { notices: enrichedNotices, nextCursor };
  } catch (error) {
    console.error('Error fetching notices:', error);
    throw error;
  }
};

/**
 * Create a new notice
 */
export const createNotice = async (
  complexId: string,
  payload: ICreateNoticePayload
): Promise<{ id: string }> => {
  try {
    // Validations
    if (!payload.title.trim()) throw new Error('Title is required');
    if (!payload.message.trim()) throw new Error('Message is required');
    if (!['INFO', 'WARNING', 'ALERT'].includes(payload.type)) {
      throw new Error('Invalid notice type');
    }
    if (!['GLOBAL', 'BLOCK', 'UNIT'].includes(payload.scope)) {
      throw new Error('Invalid scope');
    }

    // Check target_id consistency
    if (payload.scope !== 'GLOBAL' && !payload.target_id) {
      throw new Error('target_id is required for BLOCK and UNIT scopes');
    }
    if (payload.scope === 'GLOBAL' && payload.target_id) {
      throw new Error('target_id must be null for GLOBAL scope');
    }

    // Validate target belongs to complex
    if (payload.scope === 'BLOCK') {
      const { data: block } = await supabase
        .from('blocks')
        .select('id')
        .eq('id', payload.target_id)
        .eq('complex_id', complexId)
        .single();

      if (!block) throw new Error('Block not found in complex');
    }

    if (payload.scope === 'UNIT') {
      const { data: apartment } = await supabase
        .from('apartments')
        .select('id')
        .eq('id', payload.target_id)
        .eq('complex_id', complexId) // Assuming apartments have complex_id
        .single();

      if (!apartment) throw new Error('Apartment not found in complex');
    }

    // Insert notice
    const { data, error } = await supabase
      .from('notices')
      .insert({
        complex_id: complexId,
        scope: payload.scope,
        target_id: payload.target_id,
        type: payload.type,
        title: payload.title,
        message: payload.message,
      })
      .select('id')
      .single();

    if (error) throw error;

    return { id: data.id };
  } catch (error) {
    console.error('Error creating notice:', error);
    throw error;
  }
};

/**
 * Helper: Get readable target name
 */
function getTargetName(notice: INotice): string {
  if (notice.scope === 'GLOBAL') {
    return 'Todos';
  }
  // Para BLOCK y UNIT, se recomienda hacer un JOIN en la query anterior
  // Para este MVP, puede retornar el target_id como fallback
  return notice.target_id || 'Desconocido';
}
```

### 3️⃣ Handler Lambda (`src/handlers/adminNoticesLambda.ts`)

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { getNoticesList, createNotice } from '../services/noticesService';
import { ICreateNoticePayload } from '../types/notices.types';
import { validateJWT, getUserComplexMemberships } from '../utils/authUtils';

export const handleGetNoticesList: APIGatewayProxyHandler = async (event) => {
  try {
    const { complexId, limit = '20', cursor, order = 'desc' } = event.queryStringParameters || {};

    if (!complexId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing complexId' }),
      };
    }

    const token = event.headers?.Authorization?.replace('Bearer ', '') || '';
    const user = validateJWT(token);

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Verify user has access to complex
    const memberships = await getUserComplexMemberships(user.id);
    if (!memberships.includes(complexId)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Forbidden' }),
      };
    }

    const { notices, nextCursor } = await getNoticesList(
      complexId,
      parseInt(limit),
      cursor,
      order as 'asc' | 'desc'
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ notices, nextCursor }),
    };
  } catch (error) {
    console.error('Error in handleGetNoticesList:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export const handleManageNotices: APIGatewayProxyHandler = async (event) => {
  try {
    const { complexId } = event.queryStringParameters || {};

    if (!complexId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing complexId' }),
      };
    }

    const token = event.headers?.Authorization?.replace('Bearer ', '') || '';
    const user = validateJWT(token);

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Verify user has ADMIN role for complex
    const memberships = await getUserComplexMemberships(user.id);
    if (!memberships.includes(complexId)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Forbidden' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { action, payload } = body;

    if (action === 'CREATE_NOTICE') {
      const noticePayload = payload as ICreateNoticePayload;

      const result = await createNotice(complexId, noticePayload);

      return {
        statusCode: 201,
        body: JSON.stringify({
          message: 'Notice created successfully',
          notice_id: result.id,
        }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid action' }),
    };
  } catch (error) {
    console.error('Error in handleManageNotices:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Error creating notice', error: message }),
    };
  }
};
```

### 4️⃣ Registrar en API Gateway

En tu archivo de rutas (ej: `src/index.ts`, `routes.ts`, o en CDK):

```typescript
// Agregar al router
router.get('/getNoticesList', handleGetNoticesList);
router.post('/manageNotices', handleManageNotices);

// O en CDK:
const getNoticesFunction = new Function(this, 'GetNoticesFunction', {
  runtime: Runtime.NODEJS_20_X,
  code: Code.fromAsset('src/handlers'),
  handler: 'adminNoticesLambda.handleGetNoticesList',
  environment: {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
});

const manageNoticesFunction = new Function(this, 'ManageNoticesFunction', {
  runtime: Runtime.NODEJS_20_X,
  code: Code.fromAsset('src/handlers'),
  handler: 'adminNoticesLambda.handleManageNotices',
  environment: {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
});

api.addRoute('GET', '/getNoticesList', getNoticesFunction);
api.addRoute('POST', '/manageNotices', manageNoticesFunction);
```

---

## 🔐 Consideraciones de Seguridad

1. **JWT Validation**: Siempre valida el JWT antes de procesar.
2. **Complex Scoping**: Verifica que el usuario tenga acceso al `complexId` especificado.
3. **Target Validation**: Si `scope` es BLOCK o UNIT, valida que el `target_id` pertenezca al `complex_id`.
4. **Input Sanitization**: Valida `title`, `message`, etc.
5. **Rate Limiting**: Considera implementar rate limiting en Lambda.

---

## ✅ Checklist de Implementación

- [ ] Crear tabla `notices` en Supabase con índices
- [ ] Crear tipos en `src/types/notices.types.ts`
- [ ] Implementar servicio en `src/services/noticesService.ts`
- [ ] Implementar handlers en `src/handlers/adminNoticesLambda.ts`
- [ ] Registrar endpoints en API Gateway / CDK
- [ ] Testear GET `/getNoticesList`
- [ ] Testear POST `/manageNotices` con `CREATE_NOTICE`
- [ ] Validar cursor-based pagination
- [ ] Validar security (JWT, complex access, target validation)
- [ ] Deployar Lambda
- [ ] Actualizar frontend `.env` con nueva URL si es necesario

---

## 🧪 Testing

### Test GET `/getNoticesList`

```bash
curl -X GET "http://localhost:3001/getNoticesList?complexId=<UUID>&limit=20&order=desc" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Test POST `/manageNotices`

```bash
curl -X POST "http://localhost:3001/manageNotices?complexId=<UUID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "action": "CREATE_NOTICE",
    "payload": {
      "scope": "GLOBAL",
      "target_id": null,
      "type": "INFO",
      "title": "Test Notice",
      "message": "This is a test notice."
    }
  }'
```

---

## 📝 Próximos Pasos (Futura Fase)

- Confirmaciones de lectura (read receipts)
- Notificaciones automáticas (Firebase/OneSignal)
- Búsqueda por texto en historial
- Programación de envío (scheduled)
- Adjuntos/imágenes
