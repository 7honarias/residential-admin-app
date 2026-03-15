# HU-4 Cambios Específicos Recomendados 📝

**Aplicar estos cambios directamente al archivo HU-4.md**

---

## 1. TÍTULO & DESCRIPCIÓN

### ❌ ORIGINAL:
```
HU-04 (Frontend - Next.js): Panel de Gestión de Facturas y Pagos
Título: Visualización de cartera + registro de pagos manuales (desde selector de apartamento)
```

### ✅ PROPUESTO:
```
HU-04 (Frontend - Next.js): Panel de Gestión de Facturas y Pagos

Título: Visualización de cartera (facturas) + registro de pagos manuales por apartamento

Ruta: /dashboard/finances
```

---

## 2. ALCANCE / REGLAS DE NEGOCIO

### ❌ ORIGINAL:
```
El pago manual se registra por apartamento (no por factura).
El backend aplica el pago manual automáticamente a las deudas del apartamento con la regla:
Primero facturas INTEREST, luego PENALTY, luego ADMIN, luego EXTRAORDINARY
```

### ✅ PROPUESTO (MEJORADO):
```
El pago manual se registra por apartamento (no por factura individual).

El backend DEBE aplicar el pago manual automáticamente a las deudas reordenadas así:
1. Primero: Type = INTEREST (Intereses)
   Ordenadas: due_date ASC, created_at ASC
   
2. Luego: Type = PENALTY (Sanciones)
   Ordenadas: due_date ASC, created_at ASC
   
3. Luego: Type = ADMIN (Cuota Administrativa)
   Ordenadas: due_date ASC, created_at ASC
   
4. Finalmente: Type = EXTRAORDINARY (Extraordinarias)
   Ordenadas: due_date ASC, created_at ASC

NOTAS:
- El pago debe aplicarse en una ÚNICA transacción (no parcial)
- Si el pago excede el saldo total adeudado, el excedente se guarda como saldo a favor
- El saldo a favor se aplica automáticamente a futuras cuotas
```

---

## 3. CA1 — Listado Inicial (MEJORADO)

### ❌ ORIGINAL:
```
CA1 — Listado inicial (tabla paginada)
Dado que el administrador ingresa a Finanzas > Facturas,
cuando la vista cargue,
entonces debe ver una tabla paginada de facturas con al menos las columnas:

Apartamento
Concepto/Tipo (ADMIN, INTEREST, PENALTY, EXTRAORDINARY)
Fecha de vencimiento (due_date)
Monto original (amount)
Saldo pendiente (balance_due)
Estado (status)
Acciones (ver detalle)
Y debe existir estado de cargando (skeleton/loader) y estado de sin resultados.
```

### ✅ PROPUESTO:
```
CA1 — Listado inicial (tabla paginada con cursor-based pagination)

Dado que el administrador ingresa a /dashboard/finances,
cuando la vista cargue,
entonces debe ver:

1. TABLA PAGINADA con columnas:
   - Apartamento (número, ej: "101")
   - Concepto/Tipo (texto de enum: "Cuota Administrativa", "Interés", "Sanción", "Extraordinaria")
   - Fecha de Vencimiento (formato: "Mar 15, 2026")
   - Monto Original (formato moneda: "$1,200.00")
   - Saldo Pendiente (formato moneda, color según status)
   - Estado (badge con color: Pendiente=Amarillo, Vencida=Rojo, Pagada=Verde, etc)
   - Acciones (botón "Ver Detalle" o columna de iconos)
   
2. PAGINACIÓN cursor-based:
   - Botón "Cargar Más" (load more style, como PQRS)
   - NO paginación numérica (prev/next)
   - Default: 20 resultados por página
   
3. ESTADOS:
   - Loading: Mostrar 5 skeleton rows mientras carga
   - No resultados: "No se encontraron facturas" (con icono de $ tachado)
   - Error: Toast rojo con mensaje error, reintentar
```

---

## 4. CA2 — Filtros Y Búsqueda (MEJORADO)

### ❌ ORIGINAL:
```
CA2 — Filtros y búsqueda
Dado el listado de facturas,
cuando el administrador use filtros,
entonces debe poder:

Filtrar por estado: PENDING, OVERDUE, PAID (opcional: incluir PARTIALLY_PAID, CANCELLED)
Buscar por número/código de apartamento (coincidencia parcial)
Y al cambiar filtros/búsqueda la tabla debe refrescarse manteniendo paginación coherente 
(por ejemplo, volver a página 1 al cambiar filtros).
```

### ✅ PROPUESTO:
```
CA2 — Filtros y búsqueda

1. FILTRO DE ESTADO (select/tabs):
   Opciones (DEFAULT: PENDING):
   - Todos (ALL)
   - Pendientes (PENDING) ← por defecto
   - Vencidas (OVERDUE)
   - Pago Parcial (PARTIALLY_PAID)
   - Pagadas (PAID)
   - Canceladas (CANCELLED)
   
   UI: Usar botones/tabs o select dropdown
   
2. BÚSQUEDA POR APARTAMENTO (input text):
   - Permite búsqueda parcial: "101" encuentra "101", "A-101", etc formatos
   - Debounce: 300ms al escribir
   - Placeholder: "Busca por número de apto..."
   - Limpiar botón (x) para resetear búsqueda
   
3. COMPORTAMIENTO AL CAMBIAR FILTROS:
   - Resetear cursor a inicial (volver a primera página)
   - Mantener último estado de scroll position (UX)
   - Mostrar estado "Aplicando filtros..." brief (spin)
   - Si no hay resultados: mostrar empty state (no error)
```

---

## 5. CA3 — Detalle de Factura (MEJORADO)

### ❌ ORIGINAL:
```
CA3 — Detalle de factura (historial)
Dado que el administrador hace clic en una factura,
cuando abra el detalle (modal o vista),
entonces debe ver:

Resumen: Apartamento, Tipo, Descripción, Monto original, Saldo pendiente, Estado, Vencimiento
Historial de movimientos que redujeron el saldo (abonos), ordenado por fecha descendente, mostrando:
Fecha/hora
Origen (Pasarela o Manual)
Monto aplicado
Referencia/nota (si existe)
```

### ✅ PROPUESTO:
```
CA3 — Detalle de factura (modal o drawer con historial)

1. RESUMEN (encabezado del modal):
   Apartamento: "Torre A - Apto 101" (número legible)
   Tipo: "Cuota Administrativa" (label del enum, no código)
   Descripción: "Marzo 2026" (del campo description)
   Monto Original: "$1,200.00" (format currency)
   Saldo Pendiente: "$500.00" (color dinámico según estado)
   Estado: Badge colorido (Pendiente=Amarillo, etc)
   Vencimiento: "15 Mar 2026" (formato legible)
   
2. SECTION: HISTORIAL DE PAGOS (abonos)
   Título: "Historial de Abonos" o "Pagos Realizados"
   
   Tabla/lista ordenada por fecha DESC (más reciente arriba):
   Columnas:
   - Fecha/Hora: "10 Mar 2026 14:32" (con hora)
   - Origen: "Manual" | "Pasarela" (badge con color diferente)
   - Monto Aplicado: "$500.00" (verde, suma)
   - Referencia: "TRX-123456" (si existe, gris)
   - Nota: "Pago por efectivo" (truncado si muy largo)
   
   Si no hay pagos:
   - Mensaje: "Sin pagos registrados aún"
   
   Si hay muchos pagos (>10):
   - Opción: "Ver toda la historia" link (expandir/collapse)
```

---

## 6. CA4 — Registro de Pago Manual (MEJORADO)

### ❌ ORIGINAL:
```
CA4 — Registro de pago manual (desde selector global)
Dado que el administrador está en Finanzas > Facturas,
cuando presione el botón global "Registrar pago manual",
entonces debe abrirse un modal (o drawer) con:

Selector de apartamento (obligatorio) tipo Autocomplete:
Permite buscar por número/código (debounce)
Permite seleccionar un apartamento de la lista
Formulario de pago manual con campos:
Monto pagado (obligatorio, > 0)
Fecha del pago (obligatoria; por defecto hoy/ahora)
Medio de pago (obligatorio): CASH, TRANSFER, DEPOSIT, OTHER
Referencia (opcional)
Nota/observación (opcional)
Y el botón "Guardar" debe permanecer deshabilitado hasta que haya apartamento seleccionado y datos válidos.
```

### ✅ PROPUESTO:
```
CA4 — Registro de pago manual (modal desde botón flotante/header)

UBICACIÓN:
- Botón "Registrar Pago Manual" EN:
  - Header derecho de la tabla (preferred)
  - O botón flotante FAB (secondary)
  
1. SELECTOR DE APARTAMENTO (obligatorio):
   - Tipo: Autocomplete (input text + dropdown)
   - Placeholder: "Busca apto #101, Torre A, etc..."
   - Debounce: 300ms
   - Opciones: Mostrar "Torre A - Apto 101" en lista
   - Validación: Campo requerido, error si vacío
   - Icon: Busqueda / Home icon
   
2. MONTO PAGADO (obligatorio):
   - Tipo: Input number
   - Placeholder: "0.00"
   - Validación: > 0, máximo 999,999.99
   - Prefix: "$" símbolo
   - Error si: vacío o <= 0
   
3. FECHA DEL PAGO (obligatoria):
   - Tipo: Date picker o input date
   - Default: Hoy (today)
   - Validación: No puede ser en futuro
   - Formato: "10 Mar 2026" (legible)
   
4. MEDIO DE PAGO (obligatorio):
   - Tipo: Select/Dropdown
   - Opciones:
     ☐ CASH (Efectivo)
     ☐ TRANSFER (Transferencia Bancaria)
     ☐ DEPOSIT (Consignación)
     ☐ OTHER (Otro)
   - Validación: Campo requerido
   
5. REFERENCIA (opcional):
   - Tipo: Input text
   - Placeholder: "Ej: TRX-123456, referencia banco, etc"
   - Máximo: 100 caracteres
   - Helper text: "Para transacciones, déjalo vacío si es efectivo"
   
6. NOTA/OBSERVACIÓN (opcional):
   - Tipo: Textarea
   - Placeholder: "Notas adicionales..."
   - Máximo: 500 caracteres
   - Helper: "No se muestra al residente"
   
7. BOTÓN "GUARDAR":
   - Estado disabled SI:
     • Apartamento NO seleccionado
     • Monto vacío O <= 0
     • Fecha vacía
     • Medio de pago NO seleccionado
   - Estado enabled solo si TODOS los campos obligatorios son válidos
   - Mostrar checkmark cuando habilitado (opcional UX)
```

---

## 7. CA5 — Envío Y Confirmación (MEJORADO)

### ❌ ORIGINAL:
```
CA5 — Envío, confirmación y actualización automática
Dado que el administrador guardará el pago manual,
cuando haga clic en "Guardar",
entonces:

Se debe mostrar estado Guardando… y deshabilitar acciones para evitar doble submit
El frontend debe llamar al backend (POST) y:
En éxito: mostrar notificación de éxito, cerrar el modal y refrescar automáticamente el listado de facturas
En error: mostrar notificación de error y mantener el modal abierto preservando los datos ingresados
```

### ✅ PROPUESTO:
```
CA5 — Envío, confirmación y actualización automática

1. AL PRESIONAR "GUARDAR":
   - Deshabilitar inmediatamente:
     • Botón "Guardar" (show spinner)
     • Input Apartamento
     • Input Monto
     • Input Fecha
     • Select Medio de Pago
   - Mostrar: "Registrando pago..." (spinner inline en botón o tooltip)
   - Enviar POST a /registerManualPayment
   
2. EN CASO DE ÉXITO (HTTP 200):
   - Mostrar Toast verde: "✓ Pago registrado exitosamente"
   - Duración: 3 segundos
   - Cerrar modal automáticamente tras 1.5 segundos
   - Refrescar AUTOMÁTICAMENTE el listado de facturas:
     • Llamar fetchInvoices() con filtros actuales
     • Animar actualización (fade in nuevos datos)
     • Resetear paginación a página 1
   - Feedback visual: Scroll user a top de tabla (smooth scroll)
   
3. EN CASO DE ERROR (HTTP 4xx | 5xx):
   - Mostrar Toast rojo: "❌ Error: [mensaje del servidor]"
   - Duración: 5 segundos (más tiempo para leer)
   - MANTENER modal abierto
   - PRESERVAR datos ingresados (no limpiar form)
   - Deshabilitar spinner, re-habilitar botones
   - Permitir reintentar o corregir datos
   - Casos de error comunes:
     • 400: Validación (monto inválido, etc) → error in-form
     • 401: Token expirado → redirect a /login
     • 403: Sin permisos → generic error
     • 500: Error servidor → "Intenta más tarde"
```

---

## 8. CA6 — Acceso/Permisos (MEJORADO)

### ❌ ORIGINAL:
```
CA6 — Acceso/Permisos
Dado un usuario sin permisos administrativos,
cuando intente acceder a Finanzas > Facturas o registrar pago manual,
entonces debe recibir bloqueo de acceso (ocultar UI o mostrar 403 según estándar del producto).
```

### ✅ PROPUESTO:
```
CA6 — Acceso/Permisos (Validar en AMBOS lados)

FRONTEND:
1. Proteger ruta /dashboard/finances:
   - Verificar: user.role incluye ADMIN
   - Si NO: página 403 "Acceso Denegado"
   - Si SÍ: renderizar contenido
   
2. Ejemplo (en app/dashboard/finances/page.tsx):
   ```typescript
   export default function FinancesPage() {
     const { role } = useAppSelector(state => state.auth);
     
     if (role !== 'ADMIN') {
       return <Unauthorized403 />;
     }
     
     return <FinancesContent />;  // Contenido
   }
   ```

BACKEND:
1. Validar JWT token:
   - 401 si token inválido o expirado
   - 401 si sin user info
   
2. Validar admin access to complex:
   - Verificar: user.admin_complexes incluye complexId del query param
   - 403 si user no es admin de ese complex
   
3. Validar RLS en Supabase:
   - Row-level security enforce (double-check)
   - Admin solo ve facturas de su complex

FLUJO:
- Frontend intenta acceder → JS check → 403 page
- API call sin token/headers → 401 Unauthorized
- API call con token pero otro complex → 403 Forbidden
- Supabase RLS rechaza query → 403 (double-net)
```

---

## 9. NOTAS TÉCNICAS (MEJORADO)

### ❌ ORIGINAL:
```
Notas Técnicas (Next.js)
UI: Tailwind + shadcn/ui (o MUI) + tabla de datos (TanStack Table / DataGrid).
Data Fetching: SWR o React Query (recomendado por invalidación/refetch).
Endpoints:
GET /api/admin/invoices (listado + filtros + paginación)
GET /api/admin/apartments?search=... (para autocomplete)
POST /api/admin/payments/manual (registro pago manual)
(Opcional) GET /api/admin/invoices/:invoiceId para detalle/historial
UX: loaders, empty states, form validation, prevenir doble clic.
```

### ✅ PROPUESTO:
```
Notas Técnicas (Next.js + Patrón Proyecto)

STACK CONFIRMADO:
- UI Framework: Tailwind CSS 4 + Lucide React icons
  • NO usar shadcn/ui (no está en proyecto)
  • NO usar MUI (no está en proyecto)
  • Usar componentes custom (ver: notices, pqrs componentes)
  
- Data Fetching: Fetch manual (como PQRS, Notices)
  • NO SWR (no está en proyecto)
  • NO React Query (no está en proyecto)
  • Usar servicio pattern existente: services/invoices.service.ts
  
- State Management: Redux Toolkit (ya existe)
  • Para valores globales: selectedComplex, userToken, etc
  • Reducers: store/slices/invoicesSlice.ts (opcional si necesario)
  
- Forms: react-hook-form (ya existe en proyecto)
  • Schema validation: zod o similares (decide)
  
- Database: Supabase PostgreSQL + RLS
- Data Access Pattern: Pattern PQRS/Notices (cursor-based pagination)

ENDPOINTS (Backend):
GET  /getInvoicesList           (listado + filtros + cursor pagination)
GET  /getInvoiceDetail          (detalle + historial de pagos)
GET  /getApartmentsAutocomplete (autocomplete para selector)
POST /registerManualPayment     (registrar pago manual)

ESTRUCTURA DE CARPETAS:
app/dashboard/finances/       (nuevas)
  ├── layout.tsx
  ├── page.tsx
  └── invoices.types.ts
  
components/finances/          (nuevas)
  ├── InvoicesTable.tsx
  ├── InvoiceFilters.tsx
  ├── InvoiceDetailModal.tsx
  ├── ManualPaymentModal.tsx
  └── InvoicesTableSkeleton.tsx
  
services/
  └── invoices.service.ts     (nuevo)

UX/VALIDATIONS:
✓ Loading states: Skeleton rows while fetching
✓ Empty states: "No invoices found" with icon
✓ Form validation: Real-time error messages
✓ Prevent double-click: Disable button while submitting
✓ Toast notifications: Success (green) | Error (red)
✓ Debounced search: 300ms for apartment autocomplete
✓ Error boundary: Catch fetch errors gracefully
```

---

## 10. DEFINITION OF DONE (ACTUALIZADO)

### ❌ ORIGINAL:
```
Definition of Done (DoD)
Tabla paginada + filtros + búsqueda funcionando
Detalle de factura con historial visible
Modal de pago manual con selector de apartamento + validaciones + loading
Refresco automático del listado tras registrar pago
Manejo de errores y estados vacíos/cargando
(Opcional recomendado) prueba e2e básica del flujo de registro de pago manual
```

### ✅ PROPUESTO:
```
Definition of Done (DoD) - Completo

FRONTEND:
✓ Tabla de facturas con columnas: Apto, Tipo, Vencimiento, Monto, Saldo, Estado, Acciones
✓ Paginación cursor-based: "Cargar Más" botón (no numérica)
✓ Filtro por estado: Default = PENDING, opciones ALL/PENDING/OVERDUE/PARTIALLY_PAID/PAID/CANCELLED
✓ Búsqueda por apartamento: Debounce 300ms, resetear cursor al cambiar
✓ Empty states: Para tabla sin resultados, autocomplete sin coincidencias
✓ Loading states: Skeleton rows, spinner en botón submit
✓ Error handling: Toast notifications (success/error), reintentos permitidos
✓ Modal Pago Manual:
  - Autocomplete de apartamento (functional, debounced)
  - Form fields validados: monto (>0), fecha, método pago
  - Botón Guardar disabled hasta válida
  - Preserve datos en error
  - Mostrar spinner mientras envía
✓ Refetch automático post-pago: Lista actualiza sin reload
✓ Protección de ruta: 403 si no es ADMIN
✓ Responsive design: Mobile-friendly
✓ TypeScript: Sin errores de tipo
✓ Código limpio: Sin console.log, comentarios claros

BACKEND:
✓ GET /getInvoicesList: Cursor pagination, status filter, apartment search
✓ GET /getInvoiceDetail: Con payment history (ordenado DESC por fecha)
✓ GET /getApartmentsAutocomplete: Debounce-friendly, partial search
✓ POST /registerManualPayment: Validaciones, aplicación automática de pago
✓ JWT validation: Token válido y pertenece a admin
✓ Complex access check: Admin solo ve su complex
✓ Error responses: 401/403/400/500 con mensajes claros
✓ Database migrations: Tablas invoices, invoice_payments con índices
✓ RLS policies: Admin solo ve datos de su complex
✓ Trigger: updated_at se actualiza automáticamente
✓ Unit tests: Lógica de pago (aplicación a deudas)
✓ Code clean: Validación de inputs, error handling

QA/TESTING:
✓ Test: Cargar tabla sin filtros
✓ Test: Filtrar por estado OVERDUE
✓ Test: Buscar por apartamento (partial match)
✓ Test: Cargar más facturas (cursor pagination)
✓ Test: Ver detalle de factura (modal opens)
✓ Test: Historial de pagos visible en detalle
✓ Test: Abrir modal pago manual
✓ Test: Autocomplete apartamento (busca, selecciona)
✓ Test: Form validation (campos obligatorios)
✓ Test: Submit pago manual exitoso
✓ Test: Pago se aplica a deudas correctamente (backend logic)
✓ Test: Listado se refrescar post-pago
✓ Test: Error handling (401, 403, 500)
✓ Test: Acceso denegado sin credentials
✓ Test: Responsive en mobile

OPTIONAL (nice to have):
□ E2E test: Playwright/Cypress del flujo completo
□ Performance: Tabla con 1000+ items (pagination efficient)
□ Analytics: Track pago registration events
□ Export: Exportar listado de facturas a CSV
□ Bulk actions: Marcar como pagadas sin registro manual

DEPLOYMENT:
✓ Environment variables: NEXT_PUBLIC_API_URL configurado
✓ Database migrations: Ejecutadas en Supabase
✓ RLS policies: Activas
✓ Lambda endpoints: Deployadas
✓ Frontend build: Sin errores (npm run build)
✓ Testing en staging: Pre-prod verification
```

---

## 11. COMPARATIVA: ORIGINAL vs REFINADO

| Aspecto | Original | Refinado | Mejora |
|---------|----------|----------|--------|
| **Paginación** | Vago | Cursor-based explícitamente | Claridad + perf |
| **Default filtro** | No indicado | PENDING por defecto | UX mejor |
| **Tipos TS** | No definidos | Tipos completos en tipos.ts | Implementación clara |
| **Service pattern** | Endpoints /api/admin/* | Endpoints /get* /register* | Alineado a proyecto |
| **Data fetching** | SWR o React Query | Fetch manual (pattern PQRS) | Coherencia |
| **Error handling** | Vago | Específico (401/403/400/500) | Robustez |
| **RLS Supabase** | No mencionado | Políticas SQL definidas | Security |
| **Form validation** | Mencionado | Validación con zod/react-hook-form | Completitud |
| **DoD** | 6 items | 40+ items específicos | Clarity |
| **Componentes** | Listados genéricamente | Nombres exactos de archivos | Implementación |
| **Botones/UI** | Descripción textual | Especificado con colores/estados | Diseño claro |

---

## 📋 Cómo Usar Este Documento

1. **Para PM/Tech Lead**: 
   - Lee Resumen Ejecutivo
   - Revisa Comparativa
   - Aprueba cambios

2. **Para Desarrollador Backend**:
   - Lee "Endpoints Backend"
   - Revisa "Definición de Tablas (SQL)"
   - Implementa 4 endpoints + tablas

3. **Para Desarrollador Frontend**:
   - Lee "Tipos de Datos"
   - Revisa "Servicio"
   - Implementa componentes

4. **Para QA**:
   - Lee "Definition of Done"
   - Usa checklist para testing

---

**Last Updated**: March 10, 2026  
**Status**: READY TO APPLY  
**Reviewer**: Architecture Review Team
