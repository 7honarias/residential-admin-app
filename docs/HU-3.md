# Story — Implementar módulo de Gestión de Paquetes y Alertas Rápidas (Administrador)

## 1) User Story
**Como** administrador del conjunto residencial,  
**quiero** registrar paquetes llegados, asignarlos a apartamentos, marcarlos como entregados y enviar alertas rápidas a residentes,  
**para** mantener un registro auditable de correspondencia/paquetería, evitar extravíos, y comunicar de forma segmentada situaciones urgentes (cortes de servicios, llegada de cobros, paquetes pendientes).

---

## 2) Alcance

### In Scope - Módulo de Paquetes
- Registro de paquetes: tipo (BOX, ENVELOPE, FOOD, LAUNDRY, OTHER), transportista (opcional), notas (opcional).
- Asignación a apartamento y fecha de recepción (`received_at`).
- Listado paginado (cursor-based) de paquetes pendientes y entregados.
- Filtro por estado: **Pendientes** | **Entregados** (sin estado mezclado).
- Marca de entrega: cambio a estado `DELIVERED` + registro de `picked_up_by` + `picked_up_at`.
- Búsqueda rápida: filtrar por número de apartamento.
- Seguridad: JWT + verificación de rol `ADMIN` para el `complex_id` indicado en la URL.

### In Scope - Alertas Rápidas
- Creación de alertas simples sin formulario completo (no es como Avisos).
- Tipos de alerta: `UTILITY_CUT` (corte de servicios), `BILLS_ARRIVED` (cobros), `DELIVERY_WAITING` (paquete pendiente).
- Segmentación: Global | Por Bloque/Torre | Por Apartamento individual.
- Envío directo (sin preview obligatorio).
- Historial de alertas con timestamp.

### Out of Scope
- Historiales detallados de cambios (audit trail avanzado).
- Fotogramas/evidencia de entrega.
- Firmado digital de recepción.
- Notificaciones push reales (Firebase/OneSignal) en esta fase.
- Búsqueda full-text avanzada.

---

## 3) Reglas / Definition of Done (DoD)

### Paquetes
- El admin **solo** puede: registrar, listar y marcar como entregado paquetes del `complex_id` de la URL.
- Validaciones obligatorias al registrar:
  - `apartment_id` requerido y debe existir en el complejo.
  - `type` requerido, ∈ `BOX | ENVELOPE | FOOD | LAUNDRY | OTHER`.
  - `carrier`, `notes` opcionales.
  - Fecha `received_at` se establece automáticamente al registro (servidor).
- Al marcar entregado:
  - `picked_up_by` (nombre/identificador del residente que lo recoge) obligatorio.
  - `picked_up_at` se establece automáticamente (servidor).
- Listado ordenado por `received_at DESC` (más recientes primero).
- Paginación cursor-based: backend retorna `nextCursor` cuando hay más.
- UX: validación optimista + error con rollback.

### Alertas Rápidas
- El admin puede crear alertas para:
  - `target_apartment_id`: alerta individual.
  - `target_block_id`: alerta a un bloque/torre.
  - Ninguno de ambos: alerta global.
- Validaciones:
  - `alert_type` ∈ `UTILITY_CUT | BILLS_ARRIVED | DELIVERY_WAITING`.
  - `message.trim().length > 0`.
  - Consistencia de `target_*` (si se especifica, debe ser válido en el complejo).
- No hay validación de "solo uno" entre `target_apartment_id` y `target_block_id` (puede ser ambos nulos para global).
- Envío directo sin preview.
- Historial consultable con paginación cursor-based.

---

## 4) Criterios de Aceptación (Acceptance Criteria)

### AC1 — Registro de paquete
**Dado** que el administrador está autenticado y autorizado como `ADMIN` del `complex_id` actual,  
**cuando** abre "Registrar Paquete",  
**entonces** ve un formulario con:
- Tipo de paquete (select): BOX, ENVELOPE, FOOD, LAUNDRY, OTHER.
- Apartamento destino (search/select): lista filtrable por número.
- Transportista (input text, opcional).
- Notas (textarea, opcional).

**Y** al enviar:
- El sistema valida que apartamento existe en el complejo.
- Si todo es válido, registra el paquete con `received_at` = fecha/hora actual (servidor).
- Muestra confirmación y limpia el formulario o cierra el modal.
- El listado se actualiza (optimistic insert o refetch).

---

### AC2 — Listado de paquetes con filtro por estado
**Dado** que existen paquetes registrados,  
**cuando** el admin entra al módulo,  
**entonces** ve dos vistas (pestañas o panels):
- **Pendientes** (estado `PENDING_PICKUP`): lista de paquetes sin recoger.
- **Entregados** (estado `DELIVERED`): lista de paquetes recogidos.

**Y** cada lista muestra:
- Tipo (con icono/color)
- Número de apartamento
- Transportista (si está disponible)
- Fecha recibido (`received_at`)
- Para lista Entregados: quién lo recogió (`picked_up_by`) y fecha (`picked_up_at`)

**Y** si no hay resultados, se muestra estado vacío ("No hay paquetes para mostrar").

---

### AC3 — Paginación cursor-based en listados
**Dado** que pueden existir muchos paquetes,  
**cuando** el admin está en cualquiera de las dos listas (Pendientes/Entregados),  
**entonces** ve un botón "Cargar más" que:
- Envía el `cursor` almacenado.
- Recibe nuevos items y el `nextCursor`.
- Agrega los items al listado existente.
- Si `nextCursor = null`, el botón se desactiva (no hay más).

**Comportamiento importante:**
- Al cambiar de Pendientes a Entregados, el cursor se reinicia (primera carga).

---

### AC4 — Búsqueda rápida por número de apartamento
**Dado** el listado actual,  
**cuando** el admin digita en un campo de búsqueda (search input),  
**entonces** el sistema filtra el listado actual (client-side o server-side) mostrando solo apartamentos cuyo número coincida.

**Y** si no hay coincidencias, se muestra mensaje vacío.

---

### AC5 — Marcar paquete como entregado
**Dado** un paquete en estado `PENDING_PICKUP`,  
**cuando** el admin hace clic en "Marcar como entregado" (en la tarjeta o en un modal de detalle),  
**entonces** se abre un pequeño modal/dialogo que solicita:
- Nombre/identificador de quién lo recoge (`picked_up_by`): input requerido.

**Y** al confirmar:
- El paquete pasa a `DELIVERED`.
- Se registran `picked_up_by` y `picked_up_at` (automático, servidor).
- Se muestra confirmación.
- El paquete desaparece de "Pendientes" y aparece en "Entregados" (optimistic).

**Y** si falla:
- Se revierte o se refetch de la lista actual.

---

### AC6 — Crear alerta rápida (Avisos simples)
**Dado** que el admin necesita alertar a residentes de forma urgente,  
**cuando** abre "Nueva Alerta Rápida",  
**entonces** ve un formulario simple con:
- Tipo de alerta (select): Corte de servicios | Cobros llegaron | Paquete pendiente.
- Mensaje (textarea, requerido).
- Destinatarios (select segmentado):
  - **Global**: para todo el complejo.
  - **Por Bloque/Torre**: select de blocks.
  - **Individual**: select/search de apartamento.

**Y** al enviar:
- El sistema valida `message.trim().length > 0` y destinatarios válidos.
- Registra la alerta en la DB.
- Muestra confirmación ("Alerta enviada").
- Limpia el formulario.

---

### AC7 — Historial de alertas rápidas
**Dado** que se han creado alertas,  
**cuando** el admin entra a "Historial de Alertas" (segunda sección del módulo),  
**entonces** ve un listado paginado por cursor mostrando:
- Tipo (badge con color)
- Mensaje
- Destinatario (calculado: "Todos", "Torre A", "Apto 101", etc.)
- Fecha de envío (`created_at`)

**Y** botón "Cargar más" funciona igual que en paquetes (cursor-based).

---

## 5) Seguridad (obligatorio)
- Lambda valida JWT y verifica rol `ADMIN` para el `complexId` de la URL.
- Debe impedir:
  - registrar/listar paquetes de otro `complexId`.
  - marcar entregado paquetes fuera del `complexId`.
  - crear alertas fuera del `complexId`.
  - usar `apartment_id`, `block_id` que no pertenezcan al `complexId`.
- El backend contrasta `complexId` de la URL contra complejos permitidos del usuario (claims/memberships), no confía sólo en parámetros.

---

## 6) Diseño / UI

### Colores por tipo de paquete
- BOX: Marrón/Brown (#8B6F47)
- ENVELOPE: Azul/Blue (#3B82F6)
- FOOD: Verde/Green (#10B981)
- LAUNDRY: Púrpura/Purple (#A855F7)
- OTHER: Gris/Gray (#6B7280)

### Colores por tipo de alerta
- UTILITY_CUT: Rojo/Rose (#DC2626 - urgente)
- BILLS_ARRIVED: Naranja/Amber (#F59E0B - importante)
- DELIVERY_WAITING: Azul/Blue (#3B82F6 - informativo)

---

## 7) Contrato API (propuesta explícita)

### GET — Listar paquetes (cursor-based)
**Endpoint:**
```
GET /getPackagesList?complexId={complexId}&status={status}&limit={limit}&cursor={cursor}
```

**Query Parameters:**
- `complexId` (required): UUID de complejo.
- `status` (required): `PENDING_PICKUP | DELIVERED`.
- `limit` (optional, default=10): cantidad máxima por página.
- `cursor` (optional): cursor opaco para siguiente página.

**Headers:**
```
Authorization: Bearer {JWT}
```

**Response (200 OK):**
```json
{
  "packages": [
    {
      "id": "pkg_123",
      "complex_id": "cx_1",
      "apartment_id": "apt_456",
      "type": "BOX",
      "carrier": "FedEx",
      "notes": "Frágil",
      "status": "PENDING_PICKUP",
      "received_at": "2025-03-09T10:30:00Z",
      "picked_up_at": null,
      "picked_up_by": null,
      "apartment_number": "201",
      "block_name": "Torre A"
    }
  ],
  "nextCursor": "eyJpZCI6ICJwa2dfMTIzIn0="
}
```

**Error (401):**
```json
{ "error": "Unauthorized", "message": "Invalid or expired JWT" }
```

**Error (403):**
```json
{ "error": "Forbidden", "message": "No access to this complex" }
```

---

### POST — Registrar paquete
**Endpoint:**
```
POST /managePackages?complexId={complexId}
```

**Body:**
```json
{
  "action": "REGISTER_PACKAGE",
  "payload": {
    "complex_id": "cx_1",
    "apartment_id": "apt_456",
    "type": "BOX",
    "carrier": "FedEx",
    "notes": "Frágil"
  }
}
```

**Headers:**
```
Authorization: Bearer {JWT}
Content-Type: application/json
```

**Response (201 Created):**
```json
{
  "success": true,
  "package": {
    "id": "pkg_newly_created",
    "complex_id": "cx_1",
    "apartment_id": "apt_456",
    "type": "BOX",
    "carrier": "FedEx",
    "notes": "Frágil",
    "status": "PENDING_PICKUP",
    "received_at": "2025-03-09T10:30:00Z",
    "picked_up_at": null,
    "picked_up_by": null,
    "apartment_number": "201",
    "block_name": "Torre A"
  }
}
```

---

### POST — Marcar paquete como entregado
**Endpoint:**
```
POST /managePackages?complexId={complexId}
```

**Body:**
```json
{
  "action": "DELIVER_PACKAGE",
  "payload": {
    "complex_id": "cx_1",
    "package_id": "pkg_123",
    "picked_up_by": "Juan Pérez"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "package": {
    "id": "pkg_123",
    "complex_id": "cx_1",
    "apartment_id": "apt_456",
    "type": "BOX",
    "carrier": "FedEx",
    "notes": "Frágil",
    "status": "DELIVERED",
    "received_at": "2025-03-09T10:30:00Z",
    "picked_up_at": "2025-03-09T14:45:00Z",
    "picked_up_by": "Juan Pérez",
    "apartment_number": "201",
    "block_name": "Torre A"
  }
}
```

---

### POST — Crear alerta rápida
**Endpoint:**
```
POST /quickAlert?complexId={complexId}
```

**Body:**
```json
{
  "complex_id": "cx_1",
  "target_apartment_id": null,
  "target_block_id": null,
  "alert_type": "DELIVERY_WAITING",
  "message": "Paquete pendiente para torre B"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "alert": {
    "id": "alert_999",
    "complex_id": "cx_1",
    "target_apartment_id": null,
    "target_block_id": null,
    "alert_type": "DELIVERY_WAITING",
    "message": "Paquete pendiente para torre B",
    "created_at": "2025-03-09T10:35:00Z"
  }
}
```

---

### GET — Listar alertas rápidas (cursor-based)
**Endpoint:**
```
GET /getAlertsList?complexId={complexId}&limit={limit}&cursor={cursor}
```

**Response (200 OK):**
```json
{
  "alerts": [
    {
      "id": "alert_999",
      "complex_id": "cx_1",
      "target_apartment_id": null,
      "target_block_id": null,
      "alert_type": "DELIVERY_WAITING",
      "message": "Paquete pendiente para torre B",
      "created_at": "2025-03-09T10:35:00Z",
      "target_name": "Global"
    }
  ],
  "nextCursor": null
}
```

---

## 8) TypeScript Types

```typescript
export type PackageType = 'BOX' | 'ENVELOPE' | 'FOOD' | 'LAUNDRY' | 'OTHER';
export type PackageStatus = 'PENDING_PICKUP' | 'DELIVERED';
export type AlertType = 'UTILITY_CUT' | 'BILLS_ARRIVED' | 'DELIVERY_WAITING';

export interface IPackage {
  id: string;
  complex_id: string;
  apartment_id: string;
  type: PackageType;
  carrier: string | null;
  notes: string | null;
  status: PackageStatus;
  received_at: string;
  picked_up_at: string | null;
  picked_up_by: string | null;
  apartment_number?: string;
  block_name?: string;
}

export interface IRegisterPackagePayload {
  complex_id: string;
  apartment_id: string;
  type: PackageType;
  carrier?: string;
  notes?: string;
}

export interface IDeliverPackagePayload {
  complex_id: string;
  package_id: string;
  picked_up_by: string;
}

export interface IQuickAlert {
  id: string;
  complex_id: string;
  target_apartment_id: string | null;
  target_block_id: string | null;
  alert_type: AlertType;
  message: string;
  created_at: string;
  target_name?: string;
}

export interface IQuickAlertPayload {
  complex_id: string;
  target_apartment_id?: string | null;
  target_block_id?: string | null;
  alert_type: AlertType;
  message: string;
}
```

---

## 9) Implementation Notes

### Frontend Architecture
Same pattern as PQRS and Notices:
1. **Page Component** (`packages/page.tsx`): Tabs for Pending/Delivered.
2. **Service Layer** (`packages.service.ts`): HTTP calls with JWT auth.
3. **Redux Integration**: Token + complexId from global store.
4. **Modals**: Register package, deliver, quick alert (separate or combined).
5. **Components**: Package cards, list view, forms, alerts history.

### Backend Architecture
Same pattern as existing Lambda:
1. **GET /getPackagesList**: Custom query with cursor pagination.
2. **POST /managePackages**: Multi-action handler (REGISTER_PACKAGE, DELIVER_PACKAGE).
3. **POST /quickAlert**: Create quick alert.
4. **GET /getAlertsList**: Cursor-based list of alerts.
5. **Database**: Tables `packages` and `quick_alerts` with proper indexes.
6. **RLS**: Restrict to ADMIN role for complex_id.

---

## 10) SQL Migration Sketch

```sql
-- Packages table
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES complexes(id),
  apartment_id UUID NOT NULL REFERENCES apartments(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('BOX', 'ENVELOPE', 'FOOD', 'LAUNDRY', 'OTHER')),
  carrier VARCHAR(255),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING_PICKUP' CHECK (status IN ('PENDING_PICKUP', 'DELIVERED')),
  received_at TIMESTAMP NOT NULL DEFAULT NOW(),
  picked_up_at TIMESTAMP,
  picked_up_by VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_packages_complex_status ON packages(complex_id, status, received_at DESC);
CREATE INDEX idx_packages_apartment ON packages(apartment_id);

-- Quick Alerts table
CREATE TABLE quick_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES complexes(id),
  target_apartment_id UUID REFERENCES apartments(id),
  target_block_id UUID REFERENCES blocks(id),
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('UTILITY_CUT', 'BILLS_ARRIVED', 'DELIVERY_WAITING')),
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_complex ON quick_alerts(complex_id, created_at DESC);
```

---

## 11) Checklist de Desarrollo

- [ ] Backend: Database migration + RLS policies
- [ ] Backend: Lambda endpoints (GET /getPackagesList, POST /managePackages, POST /quickAlert, GET /getAlertsList)
- [ ] Backend: Input validation + error handling
- [ ] Backend: JWT + authorization checks
- [ ] Frontend: Types file (packages.types.ts)
- [ ] Frontend: Service layer (packages.service.ts)
- [ ] Frontend: Main page (packages/page.tsx) with tabs
- [ ] Frontend: Package card component
- [ ] Frontend: Register package modal/form
- [ ] Frontend: Deliver package modal
- [ ] Frontend: Quick alert modal/form
- [ ] Frontend: Alerts history view
- [ ] Frontend: Sidebar menu item
- [ ] Frontend: Redux integration
- [ ] Testing: E2E with Postman
- [ ] Testing: UI with different roles/permissions
- [ ] Docs: Backend implementation guide (optional, similar to PQRS)
