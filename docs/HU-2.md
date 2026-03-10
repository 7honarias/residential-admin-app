# Story — Implementar módulo de Avisos y Notificaciones Informativas (Administrador)

## 1) User Story
**Como** administrador del conjunto residencial,  
**quiero** crear y enviar avisos/alertas informativas segmentadas (a todo el conjunto, a un bloque/torre específico, o a un apartamento individual),  
**para** mantener a la comunidad informada sobre mantenimientos, normativas, cobros o multas de forma centralizada, trazable/auditable y sin saturar a los residentes con información que no les corresponde.

---

## 2) Alcance

### In Scope
- Creación de avisos vía Modal/Formulario.
- Campos del aviso: `title`, `message`, `type` (prioridad).
- Segmentación **excluyente**: `GLOBAL` | `BLOCK` | `UNIT`.
  - `UNIT` apunta a `apartment_id`.
  - `BLOCK` apunta a `blocks.id` (tabla `blocks` con `id`, `name`).
- Persistencia en DB y listado de historial (bandeja de salida).
- Historial con paginación **cursor-based** (server-side).
- Orden estable por `created_at desc` + tiebreaker `id desc`.
- Previsualización (preview) antes de confirmar envío.
- Seguridad: JWT + verificación de rol `ADMIN` para el `complex_id` indicado en la URL.
- UX: al crear, actualizar historial (optimistic insert o refetch), manejo de error sin duplicados.

### Out of Scope
- Notificaciones automáticas de correspondencia/paquetería.
- Push notifications reales (Firebase/OneSignal) en esta fase (solo “registrar aviso”).
- Confirmaciones de lectura por residentes (read receipts).
- Programación de envío (scheduled).
- Adjuntos/archivos/imágenes.
- Búsqueda por texto en el historial (futura fase).

---

## 3) Reglas / Definition of Done (DoD)
- El admin **solo** puede crear/listar avisos del `complex_id` actual (URL) y autorizado por su JWT/memberships.
- Validaciones obligatorias:
  - `title.trim().length > 0`
  - `message.trim().length > 0`
  - `type` ∈ `INFO | WARNING | ALERT`
  - `scope` ∈ `GLOBAL | BLOCK | UNIT`
  - Consistencia `scope` vs `target_id`:
    - `GLOBAL` => `target_id` **debe ser** `null`
    - `BLOCK` => `target_id` **obligatorio** y corresponde a `blocks.id`
    - `UNIT` => `target_id` **obligatorio** y corresponde a `apartment_id`
- Integridad multi-tenant:
  - Si `scope=BLOCK`, el `blocks.id` debe pertenecer al `complex_id`.
  - Si `scope=UNIT`, el `apartment_id` debe pertenecer al `complex_id`.
- Historial: orden `created_at desc` (primario) y `id desc` (tiebreaker).
- Cursor-based pagination: backend retorna `nextCursor` cuando hay más.
- Preview obligatorio: no se registra el aviso hasta confirmar desde preview.

---

## 4) Criterios de Aceptación (Acceptance Criteria)

### AC1 — Formulario/Modal de creación
**Dado** que el administrador está autenticado y autorizado como `ADMIN` del `complex_id` actual,  
**cuando** abre “Nuevo Aviso”,  
**entonces** ve un formulario con:
- Título (`title`)
- Mensaje (`message`)
- Prioridad (`type`): Informativo (INFO), Importante (WARNING), Alerta/Cobro (ALERT)
- Segmentación (`scope`): Global | Por Bloque/Torre | Individual (Apartamento)

**Y** el sistema valida campos requeridos e impide avanzar si están vacíos.

---

### AC2 — Segmentación excluyente + selección de target
**Dado** el formulario abierto,  
**cuando** el admin selecciona `scope`,  
**entonces**:
- Si `GLOBAL`: no se solicita target y `target_id=null`.
- Si `BLOCK`: aparece un select con `blocks.name` y guarda `target_id=blocks.id`.
- Si `UNIT`: aparece un buscador/selector de apartamentos y guarda `target_id=apartment_id`.

**Y** no se permite enviar si:
- `scope != GLOBAL` y `target_id` está vacío
- `scope = GLOBAL` y `target_id` no es null (backend debe rechazar)

---

### AC3 — Preview obligatorio antes de enviar
**Dado** que el admin diligenció el aviso con datos válidos,  
**cuando** presiona “Previsualizar”,  
**entonces** ve una pantalla/modal de preview que muestra:
- `type` (con badge/color)
- `title`
- `message` (texto completo)
- Destinatario (calculado):
  - GLOBAL => “Todos”
  - BLOCK => `blocks.name`
  - UNIT => etiqueta del apto (p. ej. “Apto 101”) o `apartment_info` disponible

**Y** desde el preview puede:
- **Confirmar envío** (persistir en DB)
- **Volver a editar** sin perder el contenido

---

### AC4 — Confirmación, persistencia y feedback
**Dado** el preview abierto,  
**cuando** el admin confirma “Enviar”,  
**entonces**:
- el backend registra el aviso en `notices`
- se muestra confirmación visual (toast/alert)
- se cierra el modal / se limpia el formulario
- el historial se actualiza (optimistic insert o refetch)

**Y** si el backend falla:
- se muestra error claro
- NO se agrega el aviso al historial
- se mantiene el contenido para reintentar

---

### AC5 — Historial / Bandeja de salida (cursor-based)
**Dado** que existen avisos,  
**cuando** el admin entra al módulo,  
**entonces** ve una lista/tabla paginada por cursor, ordenada por `created_at desc`, mostrando:
- Prioridad (`type`)
- Título (`title`)
- Destinatario/alcance (`target_name` o derivado)
- Fecha de envío (`created_at`)

**Y** si no hay avisos, se muestra estado vacío (“No hay avisos para mostrar”).

**Y** al presionar “Cargar más”, se envía el `cursor` actual y el backend retorna `nextCursor` (o `null` si no hay más).

---

### AC6 — Fuera de alcance explícito
**Dado** este módulo,  
**cuando** se revise el alcance del ticket,  
**entonces** se confirma que NO incluye notificaciones automáticas de correspondencia/paquetería ni push real.

---

## 5) Seguridad (obligatorio)
- La Lambda valida el JWT y verifica rol `ADMIN` para el `complexId` de la URL.
- Debe impedir:
  - listar/crear avisos en otro `complexId`
  - usar `target_id` de un block/apartment que no pertenezca al `complexId`
- El backend no confía sólo en el `complexId` de la URL: contrasta contra complejos permitidos del usuario (claims/memberships).

---

## 6) Contrato API (propuesta explícita)

### GET — Listar historial de avisos (cursor-based)
**Endpoint (ejemplo):**
- `GET /admin/complexes/{complexId}/notices?limit=20&cursor=...&order=desc`

**Query params:**
- `limit` (opcional, default 20; recomendado max 50)
- `cursor` (opcional): string opaca emitida por backend
- `order` (opcional, default `desc`) — orden por `created_at`

**Orden estable (para cursor):**
- `created_at desc`
- `id desc`

**Respuesta (propuesta):**
```ts
export interface IGetNoticesResponse {
  notices: INotice[];
  nextCursor: string | null;
  error?: string;
}
```

---

### POST — Crear aviso (confirmado desde preview)
**Endpoint (ejemplo):**
- `POST /admin/complexes/{complexId}/notices`

Body:
```ts
export interface IAdminNoticesRequestBody {
  action: 'CREATE_NOTICE';
  payload: {
    scope: NoticeScope;
    target_id: string | null; // null si GLOBAL; blocks.id si BLOCK; apartment_id si UNIT
    type: NoticeType;
    title: string;
    message: string;
  };
}
```

**Validaciones backend (mínimo):**
- `title.trim().length > 0`
- `message.trim().length > 0`
- consistencia `scope`/`target_id`
- pertenencia de `target_id` al `complexId` (BLOCK/UNIT)

**Respuesta (propuesta):**
```ts
export interface ICreateNoticeResponse {
  message: string;
  notice_id?: string;
  error?: string;
}
```

---

## 7) Modelo de datos (DB — Supabase)

### Tabla `notices`
Campos:
- `id` (uuid, pk)
- `complex_id` (uuid, fk)
- `scope` (`GLOBAL | BLOCK | UNIT`)
- `target_id` (uuid, nullable)
- `type` (`INFO | WARNING | ALERT`)
- `title` (text/varchar)
- `message` (text)
- `created_at` (timestamptz, default now())

Índices recomendados:
- `(complex_id, created_at desc, id desc)`
- `(complex_id, scope, created_at desc, id desc)`
- `(complex_id, target_id, created_at desc, id desc)` (útil para auditoría/consultas)

RLS:
- Permitir `SELECT/INSERT` a `ADMIN` por `complex_id`.

---

## 8) Tareas Técnicas (Sub-tasks recomendadas)

### [ ] DB — Supabase
- Crear `notices` con campos e índices.
- Políticas RLS para `ADMIN` por `complex_id`.

### [ ] Backend — Lambda `adminNoticesLambda.ts`
- `GET`:
  - `complexId` scoping + cursor-based + orden estable
  - JOIN para `target_name`:
    - `scope=BLOCK` => `blocks.name`
    - `scope=UNIT` => campo legible del apto (p. ej. `apartments.number` / `unit_label` / `apartment_info`)
    - `scope=GLOBAL` => “Todos”
- `POST (CREATE_NOTICE)`:
  - validar rol y pertenencia de targets al `complexId`
  - insertar registro
  - retornar `notice_id`

### [ ] Frontend — Types
- Crear `src/types/notices.types.ts` (contratos y entidades).

### [ ] Frontend — UI `NoticesPage.tsx`
- Tabla/lista de historial con “Cargar más” usando `nextCursor`.
- Botón “Nuevo Aviso”.

### [ ] Frontend — Modal creación + preview
- Paso 1: Formulario (edición)
- Paso 2: Preview (confirmación)
- Validaciones y manejo de error (sin duplicar en historial).

---

## 9) Tipos (TypeScript) — Anexo
```ts
export type NoticeScope = 'GLOBAL' | 'BLOCK' | 'UNIT';
export type NoticeType = 'INFO' | 'WARNING' | 'ALERT';

export interface INotice {
  id: string;
  complex_id: string;
  scope: NoticeScope;
  target_id: string | null; // null si GLOBAL; blocks.id si BLOCK; apartment_id si UNIT
  type: NoticeType;
  title: string;
  message: string;
  created_at: string;

  // Calculado por backend (JOIN)
  target_name?: string; // "Todos" | "Torre A" | "Apto 101"
}

export interface ICreateNoticePayload {
  scope: NoticeScope;
  target_id: string | null;
  type: NoticeType;
  title: string;
  message: string;
}

export interface IAdminNoticesRequestBody {
  action: 'CREATE_NOTICE';
  payload: ICreateNoticePayload;
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