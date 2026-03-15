# HU-4 Refinement Review 📋✅

**Fecha**: March 10, 2026  
**Status**: Análisis & Recomendaciones  
**Basado en**: Patrones existentes (PQRS, Notices, Packages)  

---

## 📊 Resumen Ejecutivo

La HU-4 está **bien definida conceptualmente**, pero necesita **refinamientos en especificidad técnica** para alinearse con los patrones ya implementados en el proyecto (PQRS, Notices). Este documento identifica gaps y propone mejoras.

### Cambios Principales Recomendados:
1. ✅ **Especificar estructura de tipos** (Invoices, Payments, Payment Methods)
2. ✅ **Definir patrón de servicio** consistente (como PQRS/Notices)
3. ✅ **Aclarar paginación** (cursor-based vs offset)
4. ✅ **Especificar permisos/RLS** en Supabase
5. ✅ **Definir manejo de errores** y estados vacíos
6. ✅ **Agregar definiciones de tablas** de base de datos
7. ✅ **Especificar endpoints** exactos con contratos

---

## 🔍 Análisis Detallado

### 1. STACK & DEPENDENCIAS ✅

**Estado actual**: Verificado en `package.json`

```json
{
  "next": "16.1.6",
  "react": "19.2.3",
  "react-hook-form": "^7.71.1",
  "@reduxjs/toolkit": "^2.11.2",
  "@supabase/supabase-js": "^2.95.3",
  "tailwindcss": "^4"
}
```

**Recomendación**: ✅ Stack está OK para la HU-4
- No requiere dependencias adicionales (ya existen todas)
- react-hook-form para formularios (OK)
- Redux para estado global (OK)
- SWR no es usado, pero React Query tampoco → **Usar patrón manual de fetch** (como PQRS/Notices)

---

### 2. ARQUITECTURA DE CARPETAS 📁

**Propuesta de estructura nuevas:**

```
app/dashboard/
  └── finances/                    (NUEVA sección)
      ├── layout.tsx
      ├── page.tsx                 (Listado de facturas)
      ├── invoices.types.ts        (Tipos de datos)
      └── [id]/                    (Opcional: detalle de factura)

components/
  └── finances/                    (NUEVA sección)
      ├── InvoicesTable.tsx        (Tabla con paginación)
      ├── InvoiceFilters.tsx       (Filtros + búsqueda)
      ├── InvoiceDetail.tsx        (Modal/drawer con historial)
      └── ManualPaymentModal.tsx   (Modal de pago manual)

services/
  └── invoices.service.ts          (NUEVO servicio)
```

**Notas:**
- Seguir naming de secciones existentes (notices, packages, etc.)
- Cada módulo tiene su propia carpeta `types.ts`
- Componentes reutilizables en `/components/finances/`

---

### 3. TIPOS DE DATOS (TypeScript) 📐

**AGREGAR A** `app/dashboard/finances/invoices.types.ts`:

```typescript
// ==================== ENUMS ====================

export type InvoiceType = 'ADMIN' | 'INTEREST' | 'PENALTY' | 'EXTRAORDINARY';
export type InvoiceStatus = 'PENDING' | 'OVERDUE' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'DEPOSIT' | 'OTHER';
export type PaymentOrigin = 'GATEWAY' | 'MANUAL';

// ==================== MAIN INTERFACES ====================

/**
 * IInvoice - Factura individual
 */
export interface IInvoice {
  id: string;
  complex_id: string;
  apartment_id: string;
  apartment_number: string;        // Denormalizado del JOIN
  type: InvoiceType;
  description: string;              // Ej: "Cuota Administrativa Marzo"
  amount: number;                    // Monto original
  balance_due: number;               // Saldo pendiente actual
  status: InvoiceStatus;
  due_date: string;                  // ISO 8601 date
  created_at: string;                // ISO 8601 timestamp
  updated_at: string;
}

/**
 * IPaymentRecord - Registro de abono a una factura
 */
export interface IPaymentRecord {
  id: string;
  invoice_id: string;
  amount_applied: number;            // Monto pagado
  origin: PaymentOrigin;             // GATEWAY o MANUAL
  payment_method?: PaymentMethod;    // Solo si origin = MANUAL
  reference?: string;                // Ej: número de transacción
  notes?: string;                    // Observación
  created_at: string;
}

/**
 * IInvoiceDetail - Factura con historial de pagos
 */
export interface IInvoiceDetail extends IInvoice {
  payments: IPaymentRecord[];        // Ordenado por created_at DESC
}

/**
 * IManualPaymentPayload - Payload para registrar pago manual
 */
export interface IManualPaymentPayload {
  apartment_id: string;
  amount: number;
  payment_date: string;              // ISO 8601 date
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
}

/**
 * IManualPaymentResponse - Respuesta del backend al registrar pago
 */
export interface IManualPaymentResponse {
  success: boolean;
  payment_id?: string;
  message?: string;
  error?: string;
  applied_to_invoices?: {             // Opcional: detalle de aplicación
    invoice_id: string;
    amount_applied: number;
  }[];
}

/**
 * IInvoicesListResponse - Respuesta del GET invoices list
 */
export interface IInvoicesListResponse {
  invoices: IInvoice[];
  nextCursor: string | null;
  totalCount?: number;                // Opcional: para mostrar "X de 50"
  error?: string;
}

/**
 * IInvoicesFilterOptions - Opciones de filtrado (para servicio)
 */
export interface IInvoicesFilterOptions {
  status?: InvoiceStatus | 'ALL';    // Filtro de estado
  apartmentSearch?: string;           // Búsqueda por número de apartamento
  limit?: number;                     // Paginación
  cursor?: string | null;             // Cursor para siguiente página
  order?: 'asc' | 'desc';             // Orden por due_date
}

/**
 * IApartmentForAutocomplete - Opciones para autocomplete de apartamentos
 */
export interface IApartmentForAutocomplete {
  id: string;
  number: string;
  block_name?: string;                // Ej: "Torre A"
  full_label?: string;                // Ej: "Torre A - Apto 101"
}
```

**Consideraciones:**
- `IPaymentRecord` es para el historial (histórico)
- `IManualPaymentPayload` es para el formulario (futuro)
- Mantener consistent naming con notices/pqrs
- Todos los timestamps en ISO 8601

---

### 4. SERVICIO (Service Layer) 🔌

**CREAR** `services/invoices.service.ts`:

Basado en patrón de `pqrs.service.ts` y `notices.service.ts`:

```typescript
import {
  IInvoicesListResponse,
  IInvoiceDetail,
  IManualPaymentPayload,
  IManualPaymentResponse,
  IInvoicesFilterOptions,
  IApartmentForAutocomplete,
} from "@/app/dashboard/finances/invoices.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== INTERFACES ====================

export interface FetchInvoicesParams {
  token: string;
  complexId: string;
  options?: IInvoicesFilterOptions;
}

export interface FetchInvoiceDetailParams {
  token: string;
  complexId: string;
  invoiceId: string;
}

export interface FetchApartmentsForAutocompleteParams {
  token: string;
  complexId: string;
  search: string;
}

export interface RegisterManualPaymentParams {
  token: string;
  complexId: string;
  payload: IManualPaymentPayload;
}

// ==================== GET: List Invoices ====================

/**
 * Fetch invoices with cursor-based pagination and filters
 * Pattern: GET /getInvoicesList?complexId=UUID&status=PENDING&limit=20&cursor=...
 */
export const fetchInvoices = async ({
  token,
  complexId,
  options = {},
}: FetchInvoicesParams): Promise<IInvoicesListResponse> => {
  try {
    const {
      status = 'PENDING',
      apartmentSearch,
      limit = 20,
      cursor,
      order = 'asc',
    } = options;

    const params = new URLSearchParams({ complexId });
    if (status && status !== 'ALL') params.append('status', status);
    if (apartmentSearch) params.append('apartmentSearch', apartmentSearch);
    if (limit) params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);
    if (order) params.append('order', order);

    const response = await fetch(
      `${API_URL}/getInvoicesList?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error fetching invoices:', data);
      throw new Error(data.error || 'Error fetching invoices');
    }

    return data as IInvoicesListResponse;
  } catch (error) {
    console.error('Error en fetchInvoices:', error);
    throw error;
  }
};

// ==================== GET: Invoice Detail ====================

/**
 * Fetch single invoice with payment history
 * Pattern: GET /getInvoiceDetail?complexId=UUID&invoiceId=UUID
 */
export const fetchInvoiceDetail = async ({
  token,
  complexId,
  invoiceId,
}: FetchInvoiceDetailParams): Promise<IInvoiceDetail> => {
  try {
    const params = new URLSearchParams({
      complexId,
      invoiceId,
    });

    const response = await fetch(
      `${API_URL}/getInvoiceDetail?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error fetching invoice detail');
    }

    return data as IInvoiceDetail;
  } catch (error) {
    console.error('Error en fetchInvoiceDetail:', error);
    throw error;
  }
};

// ==================== GET: Autocomplete Apartments ====================

/**
 * Fetch apartments for manual payment selector autocomplete
 * Pattern: GET /getApartmentsAutocomplete?complexId=UUID&search=101
 */
export const fetchApartmentsAutocomplete = async ({
  token,
  complexId,
  search,
}: FetchApartmentsForAutocompleteParams): Promise<IApartmentForAutocomplete[]> => {
  try {
    const params = new URLSearchParams({
      complexId,
      search,
    });

    const response = await fetch(
      `${API_URL}/getApartmentsAutocomplete?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error fetching apartments:', data);
      return [];  // Retornar array vacío en error de autocomplete
    }

    return data.apartments as IApartmentForAutocomplete[];
  } catch (error) {
    console.error('Error en fetchApartmentsAutocomplete:', error);
    return [];
  }
};

// ==================== POST: Manual Payment ====================

/**
 * Register manual payment for an apartment
 * Pattern: POST /registerManualPayment
 * Body: { action: "REGISTER_PAYMENT", payload: { ... } }
 */
export const registerManualPayment = async ({
  token,
  complexId,
  payload,
}: RegisterManualPaymentParams): Promise<IManualPaymentResponse> => {
  try {
    const params = new URLSearchParams({ complexId });

    const response = await fetch(
      `${API_URL}/registerManualPayment?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'REGISTER_PAYMENT',
          payload,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error registering payment:', data);
      throw new Error(data.error || 'Error registering payment');
    }

    return data as IManualPaymentResponse;
  } catch (error) {
    console.error('Error en registerManualPayment:', error);
    throw error;
  }
};
```

**Patrones clave:**
- Sigue exactamente el patrón de PQRS/Notices
- `token` + `complexId` en cada llamada
- POST con estructura `{ action, payload }`
- Manejo de errores consistente
- TypeScript types importados

---

### 5. ENDPOINTS DE BACKEND 🔗

**Agregar a Lambda (Backend):**

| Method | Path | Parámetros | Acción | Retorno |
|--------|------|-----------|--------|---------|
| GET | `/getInvoicesList` | `complexId`, `status`, `apartmentSearch`, `limit`, `cursor`, `order` | Listar facturas paginadas | `IInvoicesListResponse` |
| GET | `/getInvoiceDetail` | `complexId`, `invoiceId` | Obtener detalle + historial | `IInvoiceDetail` |
| GET | `/getApartmentsAutocomplete` | `complexId`, `search` | Listar apartments para autocomplete | `{ apartments: IApartmentForAutocomplete[] }` |
| POST | `/registerManualPayment` | `complexId`, body: action + payload | Registrar pago manual | `IManualPaymentResponse` |

**Validaciones esperadas del backend:**
- JWT token válido → si no, 401
- `complexId` pertenece al admin autenticado → 403 si no
- Pago manual: `amount > 0` → 400 si no
- Pago manual: `apartment_id` pertenece al `complex_id` → 403 si no
- Pago manual: aplicar automáticamente a deudas con regla definida

---

### 6. PERMISOS & SECURITY (RLS) 🔐

**Propuesta de políticas RLS en Supabase:**

```sql
-- Table: invoices
-- RLS Policy: Admins can view invoices for their complexes only
CREATE POLICY "Admin view own complex invoices" ON invoices FOR SELECT
  USING (
    complex_id IN (
      SELECT complex_id FROM admin_users WHERE auth_id = auth.uid()
    )
  );

-- Table: invoice_payments
-- RLS Policy: Admins can view/create payments for their invoices only
CREATE POLICY "Admin manage own complex payments" ON invoice_payments FOR ALL
  USING (
    invoice_id IN (
      SELECT i.id FROM invoices i 
      WHERE i.complex_id IN (
        SELECT complex_id FROM admin_users WHERE auth_id = auth.uid()
      )
    )
  );
```

**Nota:** RLS debe validarse en AMBOS lados:
- Backend: verificar JWT pertenece a admin de complex_id
- Supabase: RLS previene acceso directo a datos no autorizados

---

### 7. PAGINACIÓN 📄

**Decisión: Cursor-based (como PQRS/Notices)**

```typescript
// Cursor estructura
interface CursorPayload {
  due_date: string;      // Campo ordenamiento primario
  id: string;            // Desempate
}

// Encoding → "due_date|id" en base64
// Ejemplo: "2026-03-10|550e8400..." → base64

// Query SQL para siguiente página:
SELECT * FROM invoices
WHERE (due_date, id) > (cursor_due_date, cursor_id)
ORDER BY due_date ASC, id ASC
LIMIT 21;  // Fetch +1 para detectar si hay más
```

**Ventajas:**
- ✅ Funciona con datos dinámicos (cambios de estado)
- ✅ No requiere COUNT(*) (rendimiento)
- ✅ Coherente con PQRS/Notices

---

### 8. MANEJO DE ESTADOS (UI/UX) 🎨

**Estados a implementar:**

| Estado | Cuándo | Componente | Acción |
|--------|--------|-----------|--------|
| `loading` | Fetch inicial de facturas | Tabla → Skeleton rows | Desabilitar filtros |
| `error` | API error | Toast/Alert rojo | Mostrar mensaje, mantener datos previos |
| `empty` | Sin resultados tras filtros | Empty state | "No se encontraron facturas" |
| `idle` | Datos listados | Tabla normal | Permitir interacción |
| `submitting` | Enviando pago manual | Modal → disable submit btn | Mostrar spinner en botón |
| `success` | Pago registrado | Toast verde | Cerrar modal, refrescar listado |

**Ejemplos propuestos:**
```typescript
// En page.tsx
const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');

// Skeltons para tabla (mientras carga)
{status === 'loading' && <InvoicesTableSkeleton rows={20} />}

// Empty state
{status === 'idle' && invoices.length === 0 && (
  <EmptyState 
    title="No hay facturas" 
    icon={<DollarSign />} 
  />
)}
```

---

### 9. FILTROS & BÚSQUEDA 🔍

**Cambio propuesto: Default status**

```typescript
// ORIGINAL:
// "Filtrar por estado: PENDING, OVERDUE, PAID (opcional)"

// PROPUESTA MEJORADA:
// DEFAULT: status = 'PENDING'  (lo más útil para admin)
// Opciones: ALL, PENDING, OVERDUE, PARTIALLY_PAID, PAID, CANCELLED

const statusOptions = [
  { label: 'Todos', value: 'ALL', color: 'gray' },
  { label: 'Pendientes', value: 'PENDING', color: 'yellow', default: true },
  { label: 'Vencidas', value: 'OVERDUE', color: 'red' },
  { label: 'Pago Parcial', value: 'PARTIALLY_PAID', color: 'orange' },
  { label: 'Pagadas', value: 'PAID', color: 'green' },
  { label: 'Canceladas', value: 'CANCELLED', color: 'gray' },
];
```

**Búsqueda por apartamento:**
- Debounce: 300ms
- Actualizar al escribir (no al blur)
- Resettear a página 1

---

### 10. VALIDACIONES DE FORMULARIO 📝

**Pago Manual - Validaciones:**

```typescript
// form.tsx (usando react-hook-form)

const schema = z.object({
  apartment_id: z
    .string()
    .min(1, "Selecciona un apartamento"),      // Autocomplete
  
  amount: z
    .number("Debe ser un número")
    .positive("El monto debe ser mayor a 0")
    .max(999999, "Monto muy alto"),            // Límite razonable
  
  payment_date: z
    .string()
    .min(1, "Selecciona fecha"),               // Date picker
  
  payment_method: z
    .enum(['CASH', 'TRANSFER', 'DEPOSIT', 'OTHER'], {
      errorMap: () => ({ message: "Selecciona medio de pago" }),
    }),
  
  reference: z
    .string()
    .max(100, "Máximo 100 caracteres")
    .optional(),                                // Opcional
  
  notes: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional(),                                // Opcional
});
```

---

### 11. CAMBIOS A HU-4 ORIGINAL 🔄

| Aspecto | Original | Refinado | Razón |
|---------|----------|----------|-------|
| **Paginación** | No especificado | Cursor-based (como PQRS) | Coherencia + rendimiento |
| **Default status** | Ambiguo | PENDING (por defecto) | UX mejor |
| **Tipos de datos** | No definidos | Especificados en tipos.ts | Implementación más clara |
| **Endpoints** | GET /api/admin/* | GET /getInvoicesList, etc | Patrón backend existente |
| **Errors handling** | Menciona "mostrar error" | Especificado por estado | Completitud |
| **Empty states** | Menciona "estado sin resultados" | Definido en tabla | Claridad |
| **Refetch após pago** | "Refrescar automáticamente" | Refetch via service call | Implementación clara |
| **RLS Supabase** | No mencionado | Políticas SQL definidas | Security |

---

### 12. DEFINICIÓN DE TABLAS (SQL) 🗄️

**Propuesta de tablas en Supabase:**

```sql
-- Table: invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complex_id UUID NOT NULL REFERENCES residential_complexes(id),
  apartment_id UUID NOT NULL REFERENCES apartments(id),
  
  type VARCHAR(50) NOT NULL CHECK (type IN ('ADMIN', 'INTEREST', 'PENALTY', 'EXTRAORDINARY')),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_due DECIMAL(10, 2) NOT NULL DEFAULT amount,  -- Se actualiza con pagos
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'OVERDUE', 'PARTIALLY_PAID', 'PAID', 'CANCELLED')),
  
  due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices para paginación
  UNIQUE(complex_id, apartment_id, type, due_date),  -- Sin duplicados
  INDEX idx_invoices_complex_status (complex_id, status),
  INDEX idx_invoices_apartment (apartment_id),
  INDEX idx_invoices_due_date (due_date),
  INDEX idx_invoices_cursor (complex_id, due_date, id)
);

-- Table: invoice_payments
CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  
  amount_applied DECIMAL(10, 2) NOT NULL,
  origin VARCHAR(50) NOT NULL CHECK (origin IN ('GATEWAY', 'MANUAL')),
  payment_method VARCHAR(50) CHECK (payment_method IN ('CASH', 'TRANSFER', 'DEPOSIT', 'OTHER')),
  
  reference VARCHAR(255),  -- Número de transacción, etc.
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_payments_invoice (invoice_id),
  INDEX idx_payments_created_at (created_at DESC)
);

-- Trigger: Update invoices.updated_at
CREATE TRIGGER trigger_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP;

CREATE TRIGGER trigger_payments_updated_at
BEFORE UPDATE ON invoice_payments
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP;
```

---

### 13. CHECKLIST DE IMPLEMENTACIÓN ✅

**Frontend (HU-4):**
- [ ] Crear `app/dashboard/finances/` (layout, page, types)
- [ ] Crear `services/invoices.service.ts` con 4 funciones
- [ ] Crear `components/finances/` (tabla, filtros, modal, etc)
- [ ] Integrar Redux si es necesario (para estado global)
- [ ] Agregar ruta en Sidebar navegación
- [ ] Definir colores + diseño Tailwind (según brand)
- [ ] Pruebas manuales de flujo completo
- [ ] E2E test opcional (Playwright/Cypress)

**Backend (Lambda):**
- [ ] Crear 4 endpoints (GET list, GET detail, GET autocomplete, POST payment)
- [ ] Implementar validaciones (JWT, complex access, etc)
- [ ] Lógica de aplicación de pago (order: INTEREST → PENALTY → ADMIN → EXTRAORDINARY)
- [ ] Tests unitarios para lógica de pago
- [ ] Ejecutar migraciones SQL (tablas + RLS)
- [ ] Deployment a producción

**QA/Testing:**
- [ ] Prueba: Listar facturas sin filtro
- [ ] Prueba: Filtrar por estado
- [ ] Prueba: Paginación (cargar más)
- [ ] Prueba: Registrar pago manual
- [ ] Prueba: Pago aplica a deudas correctamente
- [ ] Prueba: Error handling (toast messages)

---

### 14. NOTAS & DECISIONES 📝

**Decisiones clave:**
1. **Cursor-based pagination**: Coherencia con PQRS/Notices, mejor rendimiento
2. **Redux para estado global**: Ya existe, usar para `selectedApartment` en modal
3. **No usar SWR/React Query**: Proyecto usa fetch manual, mantener consistencia
4. **Tabla `invoices` desnormalizada**: `apartment_number` para evitar JOINs costosos
5. **Pago automático aplicado en backend**: No en frontend (seguridad + lógica compleja)
6. **Modal (no drawer)**: Coherente con componentes existentes
7. **Colores**: Usar sistema del proyecto (rojo para vencidas, verde para pagadas, etc)

**Riesgos identificados:**
- ⚠️ Si hay muchas facturas (>100k), cursor-based es CRÍTICO
- ⚠️ Aplicación de pagos debe ser transaccional (usar DB trigger o Lambda transactional)
- ⚠️ Si `balance_due` se desincroniza, puede causar issues → tests necesarios

---

## 🚀 Next Steps

1. **Review**: PM/Tech Lead revisa este documento
2. **Refine**: Ajustar según feedback
3. **Backend**: Crear las 4 endpoints + migraciones SQL
4. **Frontend**: Implementar componentes + servicio
5. **QA**: Testing según checklist
6. **Deploy**: Producción

---

**Last Updated**: March 10, 2026  
**Created by**: Architecture Review  
**Status**: READY FOR IMPLEMENTATION
