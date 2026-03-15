# Prompt para Crear Lambdas de Configuración de Administración

## Contexto
El frontend ha implementado un nuevo módulo de configuración que permite a los administradores gestionar los valores de administración de los apartamentos de dos formas:
1. **Modo Valor Fijo**: Un valor que se multiplica por el coeficiente de propiedad de cada apartamento
2. **Modo Costos Personalizados**: Asignar un costo diferente a cada apartamento

## Lambdas Requeridas

### 1. getAdministrationConfig
**Propósito**: Obtener la configuración actual de administración del conjunto

**Endpoint**: GET `/getAdministrationConfig`

**Query Parameters**:
- `complexId`: string (uuid) - ID del conjunto residencial

**Headers**:
- `Authorization: Bearer {token}` - Token JWT del usuario

**Response (200)**:
```json
{
  "success": true,
  "config": {
    "id": "uuid",
    "complex_id": "uuid",
    "administration_value": 1000000,
    "effective_date": "2026-03-10",
    "created_at": "2026-03-01T10:00:00Z",
    "updated_at": "2026-03-10T10:00:00Z"
  }
}
```

**Error Response (400/401/404)**:
```json
{
  "success": false,
  "error": "No administration config found for this complex"
}
```

**Lógica**:
- Validar que el usuario tenga acceso al conjunto
- Obtener el registro de `administration_configs` donde `complex_id = {complexId}`
- Si no existe, retornar null o un valor por defecto

---

### 2. updateAdministrationConfig
**Propósito**: Actualizar el valor de administración fijo del conjunto

**Endpoint**: POST `/updateAdministrationConfig`

**Query Parameters**:
- `complexId`: string (uuid) - ID del conjunto residencial

**Headers**:
- `Authorization: Bearer {token}` - Token JWT del usuario
- `Content-Type: application/json`

**Body**:
```json
{
  "administration_value": 1500000
}
```

**Response (200)**:
```json
{
  "success": true,
  "config": {
    "id": "uuid",
    "complex_id": "uuid",
    "administration_value": 1500000,
    "effective_date": "2026-03-10",
    "created_at": "2026-03-01T10:00:00Z",
    "updated_at": "2026-03-10T15:30:00Z"
  }
}
```

**Error Response (400/401)**:
```json
{
  "success": false,
  "error": "Invalid administration value"
}
```

**Lógica**:
- Validar que el usuario sea administrador del conjunto
- Validar que `administration_value` sea un número positivo
- Crear o actualizar el registro en `administration_configs`
- Actualizar `updated_at` con la fecha actual
- Retornar el registro actualizado

---

### 3. getApartmentsWithAdminCost
**Propósito**: Obtener todos los apartamentos del conjunto con el costo de administración calculado (basado en valor fijo)

**Endpoint**: GET `/getApartmentsWithAdminCost`

**Query Parameters**:
- `complexId`: string (uuid) - ID del conjunto residencial

**Headers**:
- `Authorization: Bearer {token}` - Token JWT del usuario

**Response (200)**:
```json
{
  "success": true,
  "apartments": [
    {
      "id": "uuid",
      "number": "101",
      "block_name": "Torre A",
      "copropriety_coefficient": 0.05,
      "administration_cost": 50000,
      "owner_name": "Juan Pérez",
      "owner_email": "juan@example.com"
    },
    {
      "id": "uuid",
      "number": "102",
      "block_name": "Torre A",
      "copropriety_coefficient": 0.08,
      "administration_cost": 80000,
      "owner_name": "María García",
      "owner_email": "maria@example.com"
    }
  ]
}
```

**Lógica**:
- Obtener el `administration_value` de `administration_configs`
- Obtener todos los apartamentos del complejo desde la tabla `apartments`
- Para cada apartamento, calcular: `administration_cost = administration_value * copropriety_coefficient`
- Obtener el propietario desde la tabla `apartment_owners` uniendo por `apartment_id`
- Retornar lista de apartamentos con el costo calculado

---

### 4. getApartmentsWithCustomCosts
**Propósito**: Obtener apartamentos con sus costos de administración personalizados

**Endpoint**: GET `/getApartmentsWithCustomCosts`

**Query Parameters**:
- `complexId`: string (uuid) - ID del conjunto residencial

**Headers**:
- `Authorization: Bearer {token}` - Token JWT del usuario

**Response (200)**:
```json
{
  "success": true,
  "apartments": [
    {
      "apartment_id": "uuid",
      "apartment_number": "101",
      "block_name": "Torre A",
      "copropriety_coefficient": 0.05,
      "custom_admin_cost": 200000,
      "owner_name": "Juan Pérez",
      "owner_email": "juan@example.com"
    },
    {
      "apartment_id": "uuid",
      "apartment_number": "102",
      "block_name": "Torre A",
      "copropriety_coefficient": 0.08,
      "custom_admin_cost": 250000,
      "owner_name": "María García",
      "owner_email": "maria@example.com"
    }
  ]
}
```

**Lógica**:
- Obtener todos los apartamentos del complejo
- Para cada apartamento, obtener el `custom_admin_cost` de una tabla `apartment_administration_costs` (o similar)
- Si no existe costo personalizado para un apartamento, usar 0 o el costo calculado
- Obtener datos del propietario
- Retornar lista de apartamentos con sus costos personalizados

---

### 5. updateApartmentAdminCosts
**Propósito**: Actualizar los costos de administración personalizados para múltiples apartamentos

**Endpoint**: POST `/updateApartmentAdminCosts`

**Query Parameters**:
- `complexId`: string (uuid) - ID del conjunto residencial

**Headers**:
- `Authorization: Bearer {token}` - Token JWT del usuario
- `Content-Type: application/json`

**Body**:
```json
{
  "apartments": [
    {
      "apartment_id": "uuid-apt-101",
      "custom_admin_cost": 200000
    },
    {
      "apartment_id": "uuid-apt-102",
      "custom_admin_cost": 250000
    },
    {
      "apartment_id": "uuid-apt-103",
      "custom_admin_cost": 180000
    }
  ]
}
```

**Response (200)**:
```json
{
  "success": true,
  "apartments": [
    {
      "apartment_id": "uuid-apt-101",
      "apartment_number": "101",
      "block_name": "Torre A",
      "copropriety_coefficient": 0.05,
      "custom_admin_cost": 200000,
      "owner_name": "Juan Pérez",
      "owner_email": "juan@example.com"
    },
    {
      "apartment_id": "uuid-apt-102",
      "apartment_number": "102",
      "block_name": "Torre A",
      "copropriety_coefficient": 0.08,
      "custom_admin_cost": 250000,
      "owner_name": "María García",
      "owner_email": "maria@example.com"
    },
    {
      "apartment_id": "uuid-apt-103",
      "apartment_number": "103",
      "block_name": "Torre A",
      "copropriety_coefficient": 0.06,
      "custom_admin_cost": 180000,
      "owner_name": "Carlos López",
      "owner_email": "carlos@example.com"
    }
  ]
}
```

**Error Response (400/401)**:
```json
{
  "success": false,
  "error": "Invalid apartment ID or cost value"
}
```

**Lógica**:
- Validar que el usuario sea administrador del conjunto
- Para cada apartamento en el array:
  - Validar que el `apartment_id` existe y pertenece al `complexId`
  - Validar que `custom_admin_cost` es un número positivo
  - Insertar o actualizar el registro en la tabla `apartment_administration_costs`
  - Usar upsert para evitar duplicados
- Retornar la lista actualizada de apartamentos con sus nuevos costos

---

## Estructuras de Base de Datos Necesarias

### Tabla: administration_configs
```sql
CREATE TABLE administration_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complex_id UUID NOT NULL REFERENCES residential_complexes(id),
  administration_value NUMERIC NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(complex_id)
);
```

### Tabla: apartment_administration_costs
```sql
CREATE TABLE apartment_administration_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id UUID NOT NULL REFERENCES apartments(id),
  custom_admin_cost NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(apartment_id)
);
```

---

## Autenticación y Permisos

- Todas las lambdas requieren un token JWT válido
- El usuario debe ser "admin" o "superadmin" del conjunto residencial
- Validar que el `complexId` pertenece al usuario autenticado
- Si no tiene permisos, retornar 401 Unauthorized

---

## Environment Variables

Las lambdas necesitarán:
- `SUPABASE_URL`: URL de la base de datos
- `SUPABASE_SERVICE_KEY`: Clave de servicio para operaciones backend

---

## Headers de Respuesta Comunes

Todas las respuestas deben incluir:
```
Content-Type: application/json
Access-Control-Allow-Origin: *
```

---

## Notas Importantes

1. **Validación**: Todas las entradas deben ser validadas
2. **Transacciones**: Si se actualiza múltiples registros, usar transacciones
3. **Auditoría**: Registrar quién y cuándo hizo cambios en los costos
4. **Performance**: Indexar `complex_id`, `apartment_id` en las tablas nuevas
5. **Caché**: Considerar cachear los costos ya que pueden ser consultados frecuentemente
