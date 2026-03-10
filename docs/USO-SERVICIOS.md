# Cómo Usar los Servicios desde las Páginas/Componentes

Este documento muestra el patrón de uso de los servicios con ejemplos reales del proyecto.

---

## 📌 Patrón General

### 1. **Obtener el Token desde Redux**
```typescript
import { useAppSelector } from "@/store/hooks";

const token = useAppSelector((state) => state.auth.token);
```

### 2. **Obtener el ComplexId desde Redux**
```typescript
const activeComplex = useAppSelector((state) => state.complex.activeComplex);
const complexId = activeComplex?.id;
```

### 3. **Llamar al servicio**
```typescript
import { fetchPqrs, respondPqrs } from "@/services/pqrs.service";

const response = await fetchPqrs({
  token,
  complexId,
  options: { status: "PENDING", limit: 20 }
});
```

---

## 🔍 Ejemplo Real 1: Página con Listado (PQRS)

Archivo: `/app/dashboard/pqrs/page.tsx`

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { fetchPqrs } from "@/services/pqrs.service";
import { IPqrsTicket } from "./pqrs.types";

export default function PqrsPage() {
  // 1️⃣ Obtener datos del store
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const token = useAppSelector((state) => state.auth.token);

  // 2️⃣ Estado local
  const [tickets, setTickets] = useState<IPqrsTicket[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "PENDING">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const complexId = activeComplex?.id;

  // 3️⃣ Función para cargar datos
  const loadPqrs = useCallback(
    async (cursor: string | null = null) => {
      if (!complexId || !token) return;

      setIsLoading(true);
      setError(null);

      try {
        // 📡 Llamar al servicio
        const response = await fetchPqrs({
          token,
          complexId,
          options: {
            status: selectedStatus === "ALL" ? undefined : selectedStatus,
            limit: 20,
            cursor: cursor || undefined,
            order: "desc",
          },
        });

        // 4️⃣ Actualizar estado
        if (cursor) {
          setTickets((prev) => [...prev, ...response.pqrs]);
        } else {
          setTickets(response.pqrs);
        }
        setNextCursor(response.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando PQRS");
      } finally {
        setIsLoading(false);
      }
    },
    [complexId, token, selectedStatus]
  );

  // 5️⃣ Ejecutar al montar y al cambiar filtros
  useEffect(() => {
    if (complexId && token) {
      loadPqrs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complexId, token, selectedStatus]);

  return (
    <div>
      {/* Tabs para filtrar */}
      <button onClick={() => setSelectedStatus("ALL")}>Todos</button>
      <button onClick={() => setSelectedStatus("PENDING")}>Pendientes</button>

      {/* Mostrar error */}
      {error && <div className="error">{error}</div>}

      {/* Mostrar loading */}
      {isLoading && <div>Cargando...</div>}

      {/* Mostrar datos */}
      {!isLoading && tickets.map((ticket) => (
        <div key={ticket.id}>{ticket.subject}</div>
      ))}

      {/* Load more */}
      {nextCursor && (
        <button onClick={() => loadPqrs(nextCursor)}>Cargar más</button>
      )}
    </div>
  );
}
```

---

## 🔍 Ejemplo Real 2: Modal con Acción POST

Archivo: `/components/pqrs/PqrsDetailModal.tsx`

```typescript
"use client";

import { useState } from "react";
import { respondPqrs } from "@/services/pqrs.service";
import { IPqrsTicket, PqrsStatus } from "@/app/dashboard/pqrs/pqrs.types";

interface Props {
  isOpen: boolean;
  ticket: IPqrsTicket | null;
  token: string;
  complexId: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export default function PqrsDetailModal({
  isOpen,
  ticket,
  token,
  complexId,
  onSuccess,
  onClose,
}: Props) {
  const [newStatus, setNewStatus] = useState<PqrsStatus>("PENDING");
  const [adminResponse, setAdminResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !ticket) return null;

  const handleSave = async () => {
    // 1️⃣ Validar
    if (!newStatus || !adminResponse.trim()) {
      setError("Response is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 2️⃣ Llamar al servicio con la estructura correcta
      await respondPqrs({
        token,
        complexId,
        payload: {
          pqrs_id: ticket.id,
          status: newStatus,
          admin_response: adminResponse,
        },
      });

      // 3️⃣ Éxito
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal">
      <h2>{ticket.subject}</h2>

      {error && <div className="error">{error}</div>}

      <div>
        <label>Status:</label>
        <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as PqrsStatus)}>
          <option value="PENDING">Pendiente</option>
          <option value="IN_PROGRESS">En Progreso</option>
          <option value="RESOLVED">Resuelto</option>
        </select>
      </div>

      <div>
        <label>Admin Response:</label>
        <textarea
          value={adminResponse}
          onChange={(e) => setAdminResponse(e.target.value)}
          placeholder="Required..."
        />
      </div>

      <button onClick={handleSave} disabled={isLoading}>
        {isLoading ? "Saving..." : "Save"}
      </button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}
```

---

## 🔍 Ejemplo Real 3: Desde Página Padre (PQRS)

Archivo: `/app/dashboard/pqrs/page.tsx` (continuación)

```typescript
export default function PqrsPage() {
  // ... estado anterior ...
  const [selectedTicket, setSelectedTicket] = useState<IPqrsTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (ticket: IPqrsTicket) => {
    // Abrir modal con ticket seleccionado
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    // Refrescar la lista después de guardar
    loadPqrs();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  return (
    <div>
      {/* ... render anterior ... */}

      {/* Pasar tanto token como complexId al modal */}
      <PqrsDetailModal
        isOpen={isModalOpen}
        ticket={selectedTicket}
        token={token || ""}
        complexId={complexId || ""}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
```

---

## 🔍 Comparación: Apartments Service

Para referencia, aquí está cómo se usa `fetchApartments`:

```typescript
// Archivo: /app/dashboard/apartments/page.tsx

const apartments = await fetchApartments({
  token: user.token,
  complexId: complex.id,
  blockId: selectedBlock.id, // Opcional
});

// Los parámetros SIEMPRE son:
// - token: JWT del usuario autenticado
// - complexId: ID del conjunto
// - Otros parámetros específicos del servicio (blockId, apartmentId, etc)
```

---

## 🔍 Comparación: Assembly Service

Para referencia, aquí está cómo se usan los servicios de Assembly:

```typescript
// GET: Obtener listado
const assemblies = await fetchAssemblies({
  token,
  complexId,
});

// GET: Obtener detalle
const detail = await fetchAssemblyDetail({
  token,
  complexId,
  assemblyId: assembly.id,
});

// POST: Ejecutar acción
const result = await changeAssemblyStatus({
  token,
  complexId,
  payload: {
    assembly_id: assembly.id,
    status: "IN_PROGRESS",
  },
});
```

---

## 📋 Patrón de Errores

Todo servicio puede thrownear un error que debe ser manejado:

```typescript
try {
  const response = await fetchPqrs({
    token,
    complexId,
    options: { ... }
  });
  
  // Usar response...
} catch (err) {
  // Error del servicio (network, 4xx, 5xx)
  const errorMessage = err instanceof Error 
    ? err.message 
    : "Unknown error";
  
  setError(errorMessage);
}
```

---

## ⚠️ Errores Comunes

### ❌ Error: "No authenticated session"
```typescript
// INCORRECTO (antigua forma con Supabase directo)
const { session } = await supabase.auth.getSession();

// CORRECTO (usar Redux state)
const token = useAppSelector((state) => state.auth.token);
```

### ❌ Error: "Missing complexId"
```typescript
// INCORRECTO
await fetchPqrs(token, options);

// CORRECTO
await fetchPqrs({
  token,
  complexId,
  options,
});
```

### ❌ Error: "PQRS not found"
```typescript
// En el backend, el complexId debe verificarse
// El frontend debe pasar siempre el complexId correcto

const response = await respondPqrs({
  token,
  complexId: "wrong-complex-id", // ❌ Error!
  payload: { ... }
});
```

---

## ✅ Checklist Uso de Servicios

- [ ] Token obtenido de Redux (`state.auth.token`)
- [ ] ComplexId obtenido de Redux (`state.complex.activeComplex?.id`)
- [ ] Parámetros están en la estructura correcta ({ token, complexId, ...})
- [ ] Los query params se construyen con URLSearchParams
- [ ] El método HTTP es correcto (GET, POST)
- [ ] Los errores se re-lanzan correctamente
- [ ] El componente espera un token (no null)
- [ ] El formato del payload coincide con lo esperado

---

## 📁 Estructura de Carpetas Relacionadas

```
app/
  ├── dashboard/
      └── pqrs/
          ├── page.tsx (usa fetchPqrs)
          └── pqrs.types.ts (interfaces)

components/
  └── pqrs/
      ├── PqrsCard.tsx (muestra tickets)
      └── PqrsDetailModal.tsx (usa respondPqrs)

services/
  └── pqrs.service.ts (fetchPqrs, respondPqrs)

store/
  ├── slices/
      ├── authSlice.ts (almacena token)
      └── complexSlice.ts (almacena activeComplex)
```

---

## 🔐 Seguridad

- **Token**: Siempre del Redux store (nunca hardcodeado)
- **ComplexId**: Siempre del Redux store (nunca de URL)
- **Validación**: Backend valida pertenencia de datos al complex
- **Errores**: No revelar detalles internos al usuario

---

## 📚 Referencias

- Ver `/services/pqrs.service.ts` para la implementación
- Ver `/services/assembly.service.ts` para patrón similar
- Ver `/app/dashboard/pqrs/page.tsx` para uso en página
- Ver `/components/pqrs/PqrsDetailModal.tsx` para uso en modal
