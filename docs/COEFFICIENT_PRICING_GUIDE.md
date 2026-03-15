# Tabla de Precios por Coeficiente - Guía SQL

## Resumen de Cambios

### 1. Nueva Tabla: `coefficient_pricing`

Almacena los precios de administración para cada coeficiente por complejo.

**Estructura:**
```sql
id                  UUID (PK)
complex_id          UUID (FK → residential_complexes)
coefficient         NUMERIC(10, 6)  -- Coeficiente único
meters              NUMERIC(10, 2)  -- Metros de referencia (opcional)
price               NUMERIC(12, 2)  -- Precio de administración
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

**Características:**
- Constraint UNIQUE en (complex_id, coefficient) - un precio por coeficiente por complejo
- Índice compuesto en (complex_id, coefficient) para búsquedas eficientes
- Trigger automático para actualizar timestamps
- Centraliza toda la lógica de precios por coeficiente

### 2. Modificaciones a Tabla: `apartments`

**Columna Agregada:**
```sql
coefficient_pricing_id  UUID (FK → coefficient_pricing)
```

**Columna Removida:**
```sql
copropriety_coefficient  (NUMERIC) -- Movido a coefficient_pricing table
```

- `coefficient_pricing_id`: Vincula el apartamento con su configuración de precio
- El coeficiente ahora se obtiene desde `coefficient_pricing.coefficient` mediante el JOIN
- Esto evita redundancia de datos y facilita cambios en coeficientes

**Ventajas de esta estructura:**
- ✅ Normalización: No hay duplicación del coeficiente
- ✅ Cambios centralizados: Modifica una sola tabla de precios
- ✅ Integridad referencial: FK garantiza consistencia
- ✅ Datos sincronizados: Cambios automáticos en tiempo real

## Cómo Usar

### Crear la Estructura

Ejecuta el archivo SQL completo:
```sql
-- Copiar y pegar el contenido de SQL_COEFFICIENT_PRICING.sql en Supabase
```

### Flujo de Datos

1. **Admin define precios por coeficiente:**
   ```sql
   INSERT INTO coefficient_pricing (complex_id, coefficient, meters, price)
   VALUES (
     'complex-uuid',
     0.05,
     50,
     150000
   );
   ```

2. **Los apartamentos se vinculan automáticamente:**
   - El sistema agrupa apartamentos por coeficiente
   - Los vincula con coefficient_pricing
   - Sincroniza custom_admin_cost

3. **Al cambiar un precio, se actualiza en todos los apartamentos:**
   ```sql
   UPDATE coefficient_pricing
   SET price = 160000
   WHERE complex_id = 'complex-uuid'
   AND coefficient = 0.05;
   -- → Automáticamente todos los apartamentos con coef. 0.05 tendrán price = 160000
   ```

## Consultas Útiles

### Obtener precios configurados para un complejo
```sql
SELECT coefficient, meters, price
FROM coefficient_pricing
WHERE complex_id = 'complex-uuid'
ORDER BY coefficient;
```

### Ver apartamentos con sus coeficientes y precios
```sql
SELECT 
  a.number,
  cp.coefficient,
  cp.meters,
  cp.price
FROM apartments a
LEFT JOIN coefficient_pricing cp ON a.coefficient_pricing_id = cp.id
JOIN blocks b ON a.block_id = b.id
WHERE b.complex_id = 'complex-uuid'
ORDER BY cp.coefficient, a.number;
```

### Total de administración por coeficiente
```sql
SELECT 
  cp.coefficient,
  COUNT(a.id) as apartment_count,
  cp.price * COUNT(a.id) as total_admin_cost
FROM coefficient_pricing cp
LEFT JOIN apartments a ON a.coefficient_pricing_id = cp.id
WHERE cp.complex_id = 'complex-uuid'
GROUP BY cp.coefficient, cp.price, cp.id;
```

## Migraciones de Datos

El script SQL incluye migraciones automáticas que:

1. ✅ Crea coefficient_pricing basado en datos existentes
2. ✅ Vincula apartamentos con sus precios
3. ✅ Sincroniza custom_admin_cost

**Nota:** Estas migraciones solo se ejecutan si no existen ya los registros.

## Rollback (si es necesario)

```sql
-- Restaurar la columna copropriety_coefficient (si es necesario)
ALTER TABLE apartments 
ADD COLUMN copropriety_coefficient NUMERIC(10, 6);

-- Restaurar valores desde coefficient_pricing
UPDATE apartments a
SET copropriety_coefficient = cp.coefficient
FROM coefficient_pricing cp
WHERE a.coefficient_pricing_id = cp.id;

-- Eliminar la columna de relación
ALTER TABLE apartments DROP COLUMN IF EXISTS coefficient_pricing_id;

-- Eliminar la tabla de precios completa
DROP TABLE IF EXISTS coefficient_pricing;
```
