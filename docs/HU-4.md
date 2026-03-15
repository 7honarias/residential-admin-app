HU-04 (Frontend - Next.js): Panel de Gestión de Facturas y Pagos

Título: Visualización de cartera (facturas) + registro de pagos manuales por apartamento

Ruta: `/dashboard/finances`

Épica: Módulo Administrativo Financiero

Historia de Usuario
Como administrador del conjunto residencial,
quiero visualizar y filtrar el estado de las facturas y registrar pagos manuales para un apartamento seleccionado (efectivo/transferencia/consignación),
para llevar un control exacto de la cartera, identificar quién está al día y asentar pagos realizados por fuera de la pasarela.

Alcance / Reglas de negocio (suposiciones explícitas)

El panel muestra información del conjunto (complex) del administrador autenticado.

El pago manual se registra por apartamento (no por factura individual).

El backend DEBE aplicar el pago manual automáticamente a las deudas reordenadas así:
1. Primero: Type = INTEREST (Intereses) → Ordenadas: due_date ASC, created_at ASC
2. Luego: Type = PENALTY (Sanciones) → Ordenadas: due_date ASC, created_at ASC
3. Luego: Type = ADMIN (Cuota Administrativa) → Ordenadas: due_date ASC, created_at ASC
4. Finalmente: Type = EXTRAORDINARY (Extraordinarias) → Ordenadas: due_date ASC, created_at ASC

NOTAS IMPORTANTES:
- El pago debe aplicarse en una ÚNICA transacción (atomic)
- Si el pago excede el saldo total adeudado, el excedente se guarda como saldo a favor
- El saldo a favor se aplica automáticamente a futuras cuotas
- El frontend debe prevenir doble envío (doble clic) usando estados de carga y deshabilitando acciones.
Criterios de Aceptación (CA)
CA1 — Listado inicial (tabla paginada con cursor-based pagination)

Dado que el administrador ingresa a `/dashboard/finances`,
cuando la vista cargue,
entonces debe ver:

1. TABLA PAGINADA con columnas:
   - Apartamento (número, ej: "101")
   - Concepto/Tipo (texto legible: "Cuota Administrativa", "Interés", "Sanción", "Extraordinaria")
   - Fecha de Vencimiento (formato: "Mar 15, 2026")
   - Monto Original (formato moneda: "$1,200.00")
   - Saldo Pendiente (formato moneda, color según status)
   - Estado (badge colorido: Pendiente=Amarillo, Vencida=Rojo, Pagada=Verde, Pago Parcial=Naranja)
   - Acciones (botón "Ver Detalle")

2. PAGINACIÓN cursor-based:
   - Botón "Cargar Más" (load more style, NOT página numérica)
   - Default: 20 resultados por página
   - Resetear al cambiar filtros

3. ESTADOS DE CARGA:
   - Loading: Mostrar 5 skeleton rows
   - No resultados: "No se encontraron facturas" (con icono $)
   - Error: Toast rojo con opción de reintentar

CA2 — Filtros y búsqueda

Dado el listado de facturas,
cuando el administrador use filtros,
entonces debe poder:

1. FILTRO DE ESTADO (select/tabs, DEFAULT: PENDING):
   - Todos (ALL)
   - Pendientes (PENDING) ← por defecto
   - Vencidas (OVERDUE)
   - Pago Parcial (PARTIALLY_PAID)
   - Pagadas (PAID)
   - Canceladas (CANCELLED)

2. BÚSQUEDA POR APARTAMENTO:
   - Input text con debounce 300ms
   - Búsqueda parcial (\"101\" encuentra múltiples formatos)
   - Botón clear (x) para resetear

3. AL CAMBIAR FILTROS:
   - Resetear cursor (volver a página 1)
   - Mostrar estado \"Aplicando filtros...\" brief
   - Si no hay resultados: mostrar empty state (NO error)

CA3 — Detalle de factura (modal o drawer con historial)

Dado que el administrador hace clic en una factura,
cuando abra el detalle,
entonces debe ver:

1. RESUMEN (encabezado del modal):
   - Apartamento: \"Torre A - Apto 101\" (número legible)
   - Tipo: \"Cuota Administrativa\" (label legible, no código)
   - Descripción: \"Marzo 2026\"
   - Monto Original: \"$1,200.00\" (formato moneda)
   - Saldo Pendiente: \"$500.00\" (color dinámico según estado)
   - Estado: Badge colorido
   - Vencimiento: \"15 Mar 2026\"

2. SECTION: HISTORIAL DE PAGOS/ABONOS
   Tabla/lista ordenada por fecha DESC (más reciente arriba):
   Columnas:
   - Fecha/Hora: \"10 Mar 2026 14:32\"
   - Origen: \"Manual\" | \"Pasarela\" (badge con color)
   - Monto Aplicado: \"$500.00\" (verde)
   - Referencia: \"TRX-123456\" (si existe)
   - Nota: \"Pago por efectivo\" (si existe)
   
   Si no hay pagos: Mostrar \"Sin pagos registrados aún\"
CA4 — Registro de pago manual (desde selector global)
Dado que el administrador está en Finanzas > Facturas,
cuando presione el botón global “Registrar pago manual”,
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
Y el botón “Guardar” debe permanecer deshabilitado hasta que haya apartamento seleccionado y datos válidos.

CA5 — Envío, confirmación y actualización automática
Dado que el administrador guardará el pago manual,
cuando haga clic en “Guardar”,
entonces:

Se debe mostrar estado Guardando… y deshabilitar acciones para evitar doble submit
El frontend debe llamar al backend (POST) y:
En éxito: mostrar notificación de éxito, cerrar el modal y refrescar automáticamente el listado de facturas
En error: mostrar notificación de error y mantener el modal abierto preservando los datos ingresados
CA6 — Acceso/Permisos
Dado un usuario sin permisos administrativos,
cuando intente acceder a Finanzas > Facturas o registrar pago manual,
entonces debe recibir bloqueo de acceso (ocultar UI o mostrar 403 según estándar del producto).

Notas Técnicas (Next.js)
UI: Tailwind + shadcn/ui (o MUI) + tabla de datos (TanStack Table / DataGrid).
Data Fetching: SWR o React Query (recomendado por invalidación/refetch).
Endpoints:
GET /api/admin/invoices (listado + filtros + paginación)
GET /api/admin/apartments?search=... (para autocomplete)
POST /api/admin/payments/manual (registro pago manual)
(Opcional) GET /api/admin/invoices/:invoiceId para detalle/historial
UX: loaders, empty states, form validation, prevenir doble clic.
Definition of Done (DoD)
Tabla paginada + filtros + búsqueda funcionando
Detalle de factura con historial visible
Modal de pago manual con selector de apartamento + validaciones + loading
Refresco automático del listado tras registrar pago
Manejo de errores y estados vacíos/cargando
(Opcional recomendado) prueba e2e básica del flujo de registro de pago manual