# 📋 Prompt para Backend: Implementación de Módulo Suppliers (Directorio de Proveedores)

## Contexto General

Se ha completado la implementación **100% frontend** del módulo "Directorio de Proveedores" (Suppliers Directory) integrado en la sección **Finanzas** del dashboard administrativo. El frontend está listo para producción y aguarda la implementación de los **endpoints Lambda/API** en el backend.

**Estado Actual:**
- ✅ Tipos TypeScript definidos
- ✅ Componentes React (Table, Modal, Page) implementados
- ✅ Capa de servicios preparada con contrato API claro
- ✅ Navegación integrada (Sidebar, Layout, Botones)
- ✅ Lógica de búsqueda, ordenamiento y filtrado implementada
- ⏳ **Endpoints API backend pendientes de implementación**

---

## 📡 Especificación Técnica de Endpoints

### 1. GET /getSuppliersList

**Propósito:** Obtener la lista de todos los proveedores de un complejo.

**Parámetros de Query:**
```
GET /getSuppliersList?complexId={complexId}
```

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-----------|-------------|
| `complexId` | UUID | Sí | ID del complejo residencial |

**Header Requerido:**
```
Authorization: Bearer {supabaseToken}
```

**Respuesta Exitosa (200):**
```json
{
  "suppliers": [
    {
      "id": "uuid-1",
      "name": "Plomería Expresa",
      "category": "Servicios",
      "contact_name": "Juan García",
      "email": "juan@plomeria.com",
      "phone": "+57-300-1234567",
      "tax_id": "123456789-1",
      "notes": "Disponible 24/7",
      "is_active": true,
      "created_at": "2026-03-15T10:30:00Z",
      "updated_at": "2026-03-15T10:30:00Z"
    },
    {
      "id": "uuid-2",
      "name": "Pinturas y Acabados",
      "category": "Materiales",
      "contact_name": "María López",
      "email": "maria@pinturas.com",
      "phone": "+57-300-2345678",
      "tax_id": "987654321-1",
      "notes": null,
      "is_active": true,
      "created_at": "2026-02-20T14:45:00Z",
      "updated_at": "2026-02-20T14:45:00Z"
    }
  ]
}
```

**Respuestas Alternativas Aceptadas:**
```json
{
  "data": {
    "suppliers": [...]
  }
}
```
O incluso:
```json
{
  "data": [...]  // Array directo también es aceptado
}
```

**Códigos de Error:**
- `400`: complexId inválido o faltante
- `401`: Token expirado o inválido
- `403`: Usuario no autorizado para este complejo
- `404`: Complejo no encontrado
- `500`: Error del servidor

**Ejemplos de Respuesta de Error:**
```json
{
  "error": "Complex not found",
  "code": "NOT_FOUND"
}
```

---

### 2. POST /manageSuppliers

**Propósito:** Crear, actualizar o eliminar un proveedor. La acción se especifica mediante el parámetro `action` en el body.

**Parámetro de Query:**
```
POST /manageSuppliers?complexId={complexId}
```

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-----------|-------------|
| `complexId` | UUID | Sí | ID del complejo residencial |

**Header Requerido:**
```
Authorization: Bearer {supabaseToken}
Content-Type: application/json
```

---

#### 2.1 Acción: CREATE_SUPPLIER

**Request Body:**
```json
{
  "action": "CREATE_SUPPLIER",
  "payload": {
    "name": "Servicios Eléctricos JM",
    "category": "Servicios",
    "contact_name": "Jorge Martínez",
    "email": "jorge@servicios-electricos.com",
    "phone": "+57-300-5555555",
    "tax_id": "555666777-1",
    "notes": "Certificado en baja tensión",
    "is_active": true
  }
}
```

**Campo `payload` - Esquema:**
```typescript
interface CreateSupplierPayload {
  name: string;                    // Obligatorio, mínimo 2 caracteres
  category?: string | null;        // Opcional
  contact_name?: string | null;    // Opcional
  email?: string | null;           // Opcional, debe ser email válido si se proporciona
  phone?: string | null;           // Opcional
  tax_id?: string | null;          // Opcional (NIT en Colombia)
  notes?: string | null;           // Opcional
  is_active?: boolean;             // Opcional, por defecto true
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-nuevo",
    "name": "Servicios Eléctricos JM",
    "category": "Servicios",
    "contact_name": "Jorge Martínez",
    "email": "jorge@servicios-electricos.com",
    "phone": "+57-300-5555555",
    "tax_id": "555666777-1",
    "notes": "Certificado en baja tensión",
    "is_active": true,
    "created_at": "2026-03-20T10:15:00Z",
    "updated_at": "2026-03-20T10:15:00Z"
  }
}
```

---

#### 2.2 Acción: UPDATE_SUPPLIER

**Request Body:**
```json
{
  "action": "UPDATE_SUPPLIER",
  "payload": {
    "supplier_id": "uuid-existente",
    "name": "Servicios Eléctricos JM (Actualizado)",
    "category": "Servicios Profesionales",
    "contact_name": "Jorge Martínez",
    "email": "jorge.nuevo@servicios-electricos.com",
    "phone": "+57-300-6666666",
    "tax_id": "555666777-1",
    "notes": "Certificado en baja y media tensión",
    "is_active": true
  }
}
```

**Campo `payload` - Esquema:**
```typescript
interface UpdateSupplierPayload {
  supplier_id: string;             // Obligatorio - ID del proveedor a actualizar
  name?: string;                   // Opcional - si se proporciona, mínimo 2 caracteres
  category?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  tax_id?: string | null;
  notes?: string | null;
  is_active?: boolean;
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-existente",
    "name": "Servicios Eléctricos JM (Actualizado)",
    "category": "Servicios Profesionales",
    "contact_name": "Jorge Martínez",
    "email": "jorge.nuevo@servicios-electricos.com",
    "phone": "+57-300-6666666",
    "tax_id": "555666777-1",
    "notes": "Certificado en baja y media tensión",
    "is_active": true,
    "created_at": "2026-03-20T10:15:00Z",
    "updated_at": "2026-03-20T11:30:00Z"
  }
}
```

---

#### 2.3 Acción: DELETE_SUPPLIER

**Request Body:**
```json
{
  "action": "DELETE_SUPPLIER",
  "payload": {
    "supplier_id": "uuid-a-eliminar"
  }
}
```

**Campo `payload` - Esquema:**
```typescript
interface DeleteSupplierPayload {
  supplier_id: string;  // Obligatorio - ID del proveedor a eliminar
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Supplier deleted successfully",
  "data": {
    "id": "uuid-a-eliminar",
    "deleted_at": "2026-03-20T11:35:00Z"
  }
}
```

---

## 🗄️ Especificación de Base de Datos

### Tabla: `suppliers`

```sql
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES public.residential_complexes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Índices Recomendados:**
```sql
CREATE INDEX idx_suppliers_complex_id ON public.suppliers(complex_id);
CREATE INDEX idx_suppliers_is_active ON public.suppliers(is_active);
CREATE INDEX idx_suppliers_complex_active ON public.suppliers(complex_id, is_active);
```

**Script SQL Completo:** Ver archivo `SUPPLIERS-SQL.sql` en la misma carpeta.

---

## 🔐 Consideraciones de Seguridad

### Autenticación
- ✅ Verificar token Bearer en cada request
- ✅ Validar que el `complexId` pertenece al usuario autenticado
- ✅ Usar Row Level Security (RLS) en Supabase para doble validación

### Validación de Entrada
- ✅ `name`: Obligatorio, mínimo 2 caracteres, máximo 255
- ✅ `email`: Si se proporciona, validar formato email
- ✅ `phone`: Validación básica de formato (ej: +57-XXX-XXXXXXX)
- ✅ `tax_id`: Validación opcional pero recomendada (NIT colombiano)
- ✅ `category`, `contact_name`, `notes`: Permitir null/vacío

### Autorización
- ✅ Usuario solo puede acceder a proveedores del complejo asignado
- ✅ Verificar permisos de rol (admin, manager, etc.) si aplica

### Manejo de Errores
- ✅ No exponer información sensible en mensajes de error
- ✅ Registrar intentos sospechosos (múltiples DELETE, etc.)
- ✅ Rate limiting recomendado

---

## 🧪 Escenarios de Prueba

### Caso 1: Crear Proveedor
```bash
curl -X POST "https://api.example.com/manageSuppliers?complexId=uuid-123" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "CREATE_SUPPLIER",
    "payload": {
      "name": "Test Proveedor",
      "category": "Servicios",
      "contact_name": "Test Contact",
      "email": "test@example.com",
      "is_active": true
    }
  }'
```

### Caso 2: Listar Proveedores
```bash
curl -X GET "https://api.example.com/getSuppliersList?complexId=uuid-123" \
  -H "Authorization: Bearer {token}"
```

### Caso 3: Actualizar Proveedor
```bash
curl -X POST "https://api.example.com/manageSuppliers?complexId=uuid-123" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "UPDATE_SUPPLIER",
    "payload": {
      "supplier_id": "uuid-proveedor",
      "name": "Test Proveedor Actualizado",
      "email": "newemail@example.com"
    }
  }'
```

### Caso 4: Eliminar Proveedor
```bash
curl -X POST "https://api.example.com/manageSuppliers?complexId=uuid-123" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "DELETE_SUPPLIER",
    "payload": {
      "supplier_id": "uuid-proveedor"
    }
  }'
```

---

## 📝 Notas Técnicas Importantes

1. **Response Parsing Flexible:** El frontend service layer (`suppliers.service.ts`) está preparado para parsear múltiples formatos de respuesta:
   - `{ suppliers: [...] }`
   - `{ data: { suppliers: [...] } }`
   - `{ data: [...] }`
   
   Usa el formato que sea más natural en tu backend, pero asegúrate de incluir los campos snake_case como se especifican en los ejemplos.

2. **Campo `updated_at`:** Debe actualizarse automáticamente en cada UPDATE a la base de datos.

3. **Soft Delete (Opcional):** Actualmente el DELETE es hard delete. Si en el futuro necesitas auditoría, considera un soft delete con campo `deleted_at`.

4. **Timestamps:** Deben estar en formato ISO 8601 (UTC): `2026-03-20T11:35:00Z`

5. **Estructura de Payload:** El sistema espera campos en snake_case en API, pero el frontend los convierte a camelCase automáticamente.

---

## 🚀 Prioridad de Implementación

| Prioridad | Endpoint | Justificación |
|-----------|----------|---------------|
| 🔴 **P0** | `GET /getSuppliersList` | Core functionality - lectura de datos |
| 🔴 **P0** | `POST /manageSuppliers` (CREATE) | Core functionality - creación |
| 🟡 **P1** | `POST /manageSuppliers` (UPDATE) | Funcionalidad estándar CRUD |
| 🟡 **P1** | `POST /manageSuppliers` (DELETE) | Funcionalidad estándar CRUD |

---

## ✅ Checklist de Validación

Antes de considerar completa la implementación, verificar:

- [ ] Tabla `suppliers` creada en Supabase
- [ ] Todos los índices creados para performance
- [ ] Endpoints `/getSuppliersList` respondiendo correctamente
- [ ] Endpoints `/manageSuppliers` con todas las acciones (CREATE, UPDATE, DELETE)
- [ ] Autenticación y autorización validando correctamente
- [ ] Validaciones de entrada implementadas
- [ ] Manejo de errores retornando códigos HTTP apropiados
- [ ] Timestamps en formato ISO 8601 (UTC)
- [ ] RLS policies creadas (opcional pero recomendado)
- [ ] Tests unitarios para cada acción
- [ ] Documentación API actualizada
- [ ] Frontend testing completo con endpoints vivos

---

## 📞 Contacto / Preguntas

Si durante la implementación surgen dudas sobre:
- Estructura de datos esperada
- Formatos de respuesta
- Validaciones específicas
- Integraciones con otros módulos

Referirse a:
1. **Frontend Service:** `services/suppliers.service.ts` - contiene toda la lógica de parsing esperada
2. **Tipos:** `app/dashboard/finances/suppliers/suppliers.types.ts` - estructura de datos exacta
3. **Este documento** - especificación completa de endpoints

---

## 🎯 Resultado Esperado

Una vez completada la implementación backend, el módulo **Directorio de Proveedores** estará 100% funcional:

✅ **Frontend:** Completo (búsqueda, ordenamiento, filtrado, modales)
✅ **API Endpoints:** Implementados y probados
✅ **Base de Datos:** Schema creado con datos persistentes
✅ **Seguridad:** Autenticación y autorización validadas
✅ **UX:** Flujos CRUD completos con feedback visuales

**Tiempo Estimado:** 4-6 horas de desarrollo backend (según experiencia del equipo).
