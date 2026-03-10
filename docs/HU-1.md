# Story — Implementar módulo de administración de PQRS (Peticiones, Quejas, Reclamos y Sugerencias)

## 1) User Story
**Como** administrador del conjunto residencial,  
**quiero** visualizar, filtrar, paginar (cursor) y responder los tickets de PQRS enviados por los residentes,  
**para** gestionar las solicitudes de la comunidad de manera ordenada, formal y auditable, sin depender de mensajes informales (p. ej. WhatsApp).

---

## 2) Alcance

### In Scope
- Listado de PQRS en formato tarjetas.
- Filtro por estado mediante pestañas: **Todos**, **Pendientes**, **En Progreso**, **Resueltos** (sin tab “Rechazados”).
- Orden por fecha **`created_at`** (por defecto: más recientes primero).
- Paginación **cursor-based** (server-side).
- Modal de detalle con información completa del ticket.
- Respuesta obligatoria del administrador para **cualquier cambio de estado**.
- Seguridad: JWT + verificación de rol `ADMIN` **para el `complex_id` indicado en la URL**.
- UX: actualización optimista + manejo de error (rollback o refetch).

### Out of Scope
- Adjuntos/archivos.
- Conversación multi-mensaje (solo `admin_response` única).
- Notificaciones automáticas al residente.
- Búsqueda por texto (asunto/apto) en esta fase.

---

## 3) Reglas / Definition of Done (DoD)
- El admin sólo puede consultar/actualizar PQRS del `complex_id` de la URL y autorizado en su JWT / membresías.
- Todo cambio de estado exige `admin_response` **no vacía** (`trim().length > 0`).
- El listado se ordena por `created_at` **desc**.
- La paginación es cursor-based (no offset).
- El backend entrega `nextCursor` cuando existan más resultados.
- UX: al guardar, actualizar UI optimistamente; si falla, revertir o refetch.

---

## 4) Criterios de Aceptación (Acceptance Criteria)

### AC1 — Visualización en tarjetas
**Dado** que el administrador está autenticado y autorizado como `ADMIN` del `complex_id` actual,  
**cuando** ingresa al módulo de PQRS,  
**entonces** ve un listado (paginado) en formato tarjeta, y cada tarjeta muestra:
- Tipo (PETICION | QUEJA | RECLAMO | SUGERENCIA)
- Estado (PENDING | IN_PROGRESS | RESOLVED | REJECTED)
- Asunto
- Descripción corta (truncada 1–2 líneas)
- Torre/Apartamento (`apartment_info`)
- Fecha de creación (`created_at`)

**Y** si no hay resultados para el filtro actual, se muestra estado vacío (“No hay PQRS para mostrar”).

---

### AC2 — Filtrado por pestañas (Tabs)
**Dado** el listado de PQRS,  
**cuando** el admin selecciona una pestaña,  
**entonces** el listado se filtra por estado:
- **Todos** (sin filtro)
- **Pendientes** => `PENDING`
- **En Progreso** => `IN_PROGRESS`
- **Resueltos** => `RESOLVED`

**Nota:** `REJECTED` sólo se visualiza desde “Todos” (no existe tab específica).

---

### AC3 — Orden por fecha (`created_at`)
**Dado** el listado de PQRS,  
**cuando** se carga la vista por primera vez o cambia el filtro,  
**entonces** los resultados se devuelven por `created_at` **descendente** (más recientes primero).

---

### AC4 — Paginación cursor-based
**Dado** que pueden existir muchos PQRS,  
**cuando** el admin solicita “cargar más” (o navega a la siguiente página),  
**entonces** el frontend envía el `cursor` recibido previamente, y el backend retorna:
- `pqrs` (items)
- `nextCursor` (string|null)

**Y** si `nextCursor` es `null`, se entiende que no hay más resultados.

**Comportamiento al cambiar filtros:**
- al cambiar de tab/estado, el cursor se reinicia (primer “page”).

---

### AC5 — Modal de detalle
**Dado** un ticket en la lista,  
**cuando** el admin hace clic en su tarjeta,  
**entonces** se abre un modal con el detalle completo:
- Asunto completo
- Descripción completa del residente
- Tipo + Estado actuales
- `apartment_info`
- Fecha de creación
- `admin_response` actual (si existe)

---

### AC6 — Cambio de estado con respuesta obligatoria
**Dado** el modal abierto,  
**cuando** el admin selecciona un nuevo estado,  
**entonces** debe escribir una respuesta oficial obligatoria (`admin_response`) para poder guardar.

**Validación:**
- `admin_response.trim().length > 0`
- Si está vacío: mostrar error inline y bloquear Guardar.

---

### AC7 — Actualización optimista (UX)
**Dado** que el admin guarda la actualización,  
**cuando** el backend responde OK,  
**entonces**:
- el modal se cierra
- la tarjeta se actualiza de inmediato mostrando el nuevo estado
- se muestra confirmación visual (toast/alert)

**Y** si el backend falla:
- se muestra error claro
- se revierte el cambio en UI o se ejecuta refetch de la página actual para consistencia

---

## 5) Seguridad (obligatorio)
- La Lambda valida el JWT y verifica que el usuario tenga rol `ADMIN` para el `complexId` de la URL.
- Debe impedir:
  - leer PQRS de otro `complexId`
  - actualizar tickets fuera del `complexId`
- El backend **no confía** únicamente en el `complexId` de la URL: lo contrasta contra los complejos permitidos del usuario (claims/memberships).

---

## 6) Diseño / UI
### Colores por tipo
- RECLAMO: Rojo/Rose
- QUEJA: Naranja/Amber
- PETICION: Azul
- SUGERENCIA: Verde/Teal

---

## 7) Contrato API (propuesta explícita)

### GET — Listar PQRS (cursor-based)
**Endpoint (ejemplo):**
- `GET /admin/complexes/{complexId}/pqrs?status=...&limit=20&cursor=...&order=desc`

**Query params:**
- `status` (opcional): `PENDING | IN_PROGRESS | RESOLVED | REJECTED`
- `limit` (opcional, default 20; max recomendado 50)
- `cursor` (opcional): string opaca emitida por backend
- `order` (opcional, default `desc`) — orden por `created_at`

**Respuesta (propuesta):**
```ts
export interface IGetPqrsResponse {
  pqrs: IPqrsTicket[];
  nextCursor: string | null;
  error?: string;
}
```

**Regla de orden estable (importante para cursor):**
- Orden primario: `created_at desc`
- Tiebreaker: `id desc` (para evitar duplicados cuando hay misma fecha)

---

### POST — Responder / cambiar estado
**Endpoint (ejemplo):**
- `POST /admin/complexes/{complexId}/pqrs`

Body:
```ts
export interface IAdminPqrsRequestBody {
  action: 'RESPOND_PQRS';
  payload: {
    pqrs_id: string;
    status: PqrsStatus;
    admin_response: string; // obligatorio (no vacío)
  };
}
```

**Validaciones backend:**
- `admin_response.trim().length > 0`
- `pqrs_id` pertenece al `complexId` de la URL

---

## 8) Tareas Técnicas (Sub-tasks)

### [ ] DB — Supabase
- Tabla `pqrs`:
  - `complex_id`, `apartment_id`, `type`, `subject`, `description`, `status`, `admin_response`, `created_at`, `updated_at`
- Índices recomendados:
  - `(complex_id, created_at desc, id desc)`
  - `(complex_id, status, created_at desc, id desc)`
- RLS para ADMIN por `complex_id`.

### [ ] Backend — Lambda `adminPqrsLambda.ts`
- `GET`:
  - soportar `status`, `limit`, `cursor`, `order`
  - JOIN con `apartments` + `blocks` para `apartment_info`
  - implementar cursor opaco (por ejemplo, base64 de `{ created_at, id }`)
- `POST` (`RESPOND_PQRS`):
  - validar respuesta obligatoria
  - actualizar `status`, `admin_response`, `updated_at`

### [ ] Frontend — `pqrs.service.ts`
- `fetchPqrs({ complexId, status?, limit, cursor?, order? })`
- `respondPqrs({ complexId, pqrs_id, status, admin_response })`

### [ ] Frontend — `PqrsPage.tsx`
- Tabs por estado
- “Cargar más” (o paginador) basado en `nextCursor`
- Modal con validación de respuesta obligatoria
- Optimistic update + rollback/refetch

---

## 9) Tipos (Entidades)
```ts
export type PqrsType = 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA';
export type PqrsStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface IPqrsTicket {
  id: string;
  type: PqrsType;
  subject: string;
  description: string;
  status: PqrsStatus;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  apartment_info: string;
}
```