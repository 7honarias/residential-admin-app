# HU-4 Quick Reference 🚀

**Cuándo consultarla**: Durante sprint/implementación

---

## ⚡ Endpoints a Crear (Backend)

```
GET  /getInvoicesList?complexId=X&status=Y&limit=20&cursor=Z&apartmentSearch=Q&order=asc
     └─ Response: { invoices[], nextCursor, totalCount?, error? }

GET  /getInvoiceDetail?complexId=X&invoiceId=Y
     └─ Response: { id, ...invoice, payments: [] }

GET  /getApartmentsAutocomplete?complexId=X&search=Y
     └─ Response: { apartments: [{ id, number, block_name, full_label }] }

POST /registerManualPayment?complexId=X
     Body: { action: "REGISTER_PAYMENT", payload: { apartment_id, amount, payment_date, payment_method, reference?, notes? } }
     └─ Response: { success, payment_id?, message?, applied_to_invoices? }
```

---

## 🗂️ Carpetas a Crear (Frontend)

```
app/dashboard/finances/
  ├── layout.tsx                    (simple wrapper)
  ├── page.tsx                      (main list page - 300 LOC)
  └── invoices.types.ts             (types & interfaces)

components/finances/
  ├── InvoicesTable.tsx             (tabla + paginación)
  ├── InvoiceFilters.tsx            (filtros + búsqueda)
  ├── InvoiceDetailModal.tsx        (detalle + historial)
  ├── ManualPaymentModal.tsx        (form pago manual)
  └── InvoicesTableSkeleton.tsx     (loader skeleton)

services/
  └── invoices.service.ts           (4 funciones fetch)
```

---

## 📊 Tipos Principales

```typescript
// invoices.types.ts
type InvoiceStatus = 'PENDING' | 'OVERDUE' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
type InvoiceType = 'ADMIN' | 'INTEREST' | 'PENALTY' | 'EXTRAORDINARY';
type PaymentMethod = 'CASH' | 'TRANSFER' | 'DEPOSIT' | 'OTHER';
type PaymentOrigin = 'GATEWAY' | 'MANUAL';

interface IInvoice {
  id, complex_id, apartment_id, apartment_number,
  type, description, amount, balance_due,
  status, due_date, created_at, updated_at
}

interface IPaymentRecord {
  id, invoice_id, amount_applied,
  origin, payment_method?, reference?, notes?, created_at
}

interface IInvoiceDetail extends IInvoice {
  payments: IPaymentRecord[]
}

interface IManualPaymentPayload {
  apartment_id, amount, payment_date,
  payment_method, reference?, notes?
}
```

---

## 🎨 UI Components

```typescript
// page.tsx (main)
<Header title="Finanzas" />
<InvoiceFilters onChange={handleFilterChange} />
<InvoicesTable data={invoices} onDetail={openDetail} />
{hasMore && <button onClick={loadMore}>Cargar Más</button>}

// Modals
<InvoiceDetailModal invoice={selected} open={detailOpen} />
<ManualPaymentModal open={paymentOpen} onSubmit={handlePayment} />

// Loading
{isLoading && <InvoicesTableSkeleton rows={5} />}

// Empty
{!isLoading && invoices.length === 0 && <EmptyState />}
```

---

## 📱 Redux Integration

```typescript
// store/slices/invoicesSlice.ts (optional, if needed)
- invoices: IInvoice[]
- selectedInvoice: IInvoice | null
- isLoading: boolean
- error: string | null

// Using in component
const invoices = useAppSelector(state => state.invoices.list);
const dispatch = useAppDispatch();
dispatch(setInvoices(data));
```

---

## 🔐 Backend Validations

```typescript
// Cada endpoint debe validar:
1. JWT token válido → 401 si no
2. User es ADMIN del complex → 403 si no
3. apartment_id pertenece al complex → 403 si no
4. Monto > 0 → 400 si no
5. RLS Supabase enforce (double-check)

// Pago manual logic:
Reorden deudas: INTEREST → PENALTY → ADMIN → EXTRAORDINARY
Dentro cada tipo: due_date ASC, created_at ASC
Aplicar pago en tx (transacción atomic)
Guardar excedente como saldo a favor
```

---

## 🗄️ Database Schema (SQL)

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complex_id UUID NOT NULL REFERENCES residential_complexes(id),
  apartment_id UUID NOT NULL REFERENCES apartments(id),
  
  type VARCHAR(50) NOT NULL CHECK (type IN ('ADMIN', 'INTEREST', 'PENALTY', 'EXTRAORDINARY')),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_due DECIMAL(10, 2) NOT NULL DEFAULT amount,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  
  due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_invoices_complex_status (complex_id, status),
  INDEX idx_invoices_cursor (complex_id, due_date, id)
);

CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  amount_applied DECIMAL(10, 2) NOT NULL,
  origin VARCHAR(50) NOT NULL CHECK (origin IN ('GATEWAY', 'MANUAL')),
  payment_method VARCHAR(50),
  reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_payments_invoice (invoice_id),
  INDEX idx_payments_created_at (created_at DESC)
);

CREATE TRIGGER trigger_invoices_updated_at
BEFORE UPDATE ON invoices FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP;
```

---

## ✅ Checklist Rápido

**Backend (Lambda)**:
- [ ] 4 endpoints creados
- [ ] Validaciones JWT + complex access
- [ ] Tablas + índices
- [ ] Lógica pago automático
- [ ] RLS policies
- [ ] Tests unitarios

**Frontend (React)**:
- [ ] 5 componentes creados
- [ ] Service calls implementadas
- [ ] Form validations (zod/react-hook-form)
- [ ] Loading/error/empty states
- [ ] Responsive design
- [ ] TypeScript sin errores

**Testing**:
- [ ] Listar facturas
- [ ] Filtros funcionan
- [ ] Paginación works
- [ ] Ver detalle modal
- [ ] Pago manual submit
- [ ] Error handling
- [ ] Acceso bloqueado sin ADMIN

---

## 🎯 Patrón a Seguir (Copiar de PQRS)

```typescript
// Cómo llama frontend:
const token = useAppSelector(state => state.auth.token);
const complexId = useAppSelector(state => state.complex.activeComplex?.id);

const response = await fetchInvoices({
  token,
  complexId,
  options: { status: 'PENDING', limit: 20, cursor }
});

// Servicio pattern (copy/paste from pqrs.service.ts):
const params = new URLSearchParams({ complexId });
if (filters) params.append('status', filters.status);

const response = await fetch(`${API_URL}/getInvoicesList?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 🔄 Data Flow

```
User clicks "Finanzas"
    ↓
Auth check (ADMIN role?)
    ↓
Fetch invoices (GET /getInvoicesList)
    ↓
Render table + filters
    ↓
User filters/searches
    ↓
Refetch with new params
    ↓
User clicks "Ver Detalle"
    ↓
Fetch detail (GET /getInvoiceDetail + payment history)
    ↓
Show modal with invoice + payments
    ↓
User clicks "Registrar Pago Manual"
    ↓
Modal opens, user enters apartment (autocomplete)
    ↓
Submit form (POST /registerManualPayment)
    ↓
Success → Close modal, refetch invoices list
    ↓
Show success toast
```

---

## 🎨 Color Coding (Suggested)

```
PENDING        → Yellow (#FCD34D)
OVERDUE        → Red (#EF4444)
PARTIALLY_PAID → Orange (#F97316)
PAID           → Green (#22C55E)
CANCELLED      → Gray (#9CA3AF)
```

---

## 📞 Common Issues & Fixes

| Problema | Solución |
|----------|----------|
| Pago no aplica correctamente | Verificar lógica backend (orden deudas, tx atomic) |
| Modal no cierra post-pago | Añadir timeout + manual close en success callback |
| Autocomplete lento | Implement debounce 300ms, limit resultados a 10 |
| Tabla no refrescar | Asegurar refetch con `token` + `complexId` validos |
| RLS bloquea queries | Verificar policy SQL, user permisos en admin_users |
| Tipos TS error | Asegurar imports desde invoices.types.ts correcto |

---

## 🚀 Implementation Order

1. **Día 1-2**: Backend (endpoints + DB + validations)
2. **Día 3**: Frontend (components + service + integración)
3. **Día 4**: Testing + QA
4. **Día 5**: Fixes + deployment

Estimated: **5 days** (2 BE + 2 FE + 1 QA)

---

**Ver también**:
- `HU-4-REFINEMENT.md` - Análisis detallado
- `HU-4-SPECIFIC-CHANGES.md` - Cambios específicos a aplicar
- `PATRON-SERVICIOS.md` - Service pattern (copy/paste reference)
- `PQRS-IMPLEMENTATION.md` - Componente similar como referencia

**Last Updated**: March 10, 2026
