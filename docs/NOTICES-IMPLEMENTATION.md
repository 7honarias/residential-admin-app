# HU-2: Avisos y Notificaciones - Guía de Implementación Completa

## 📋 Descripción General

Esta guía describe la **implementación completa de la HU-2** (módulo de Avisos y Notificaciones Informativas) en la aplicación de administración residencial.

---

## ✅ Estado de Implementación

### Frontend ✅ COMPLETADO
- [x] **Types** (`app/dashboard/notices/notices.types.ts`)
  - Interfaces: `INotice`, `ICreateNoticePayload`, `IGetNoticesResponse`, etc.
  - Enums y constantes: `NoticeScope`, `NoticeType`, color/label mappings

- [x] **Services** (`services/notices.service.ts`)
  - `fetchNotices()` - Obtener lista con cursor-based pagination
  - `createNotice()` - Crear nuevo aviso
  - `fetchBlocks()` - Obtener bloques para selector
  - `fetchApartments()` - Obtener apartamentos para selector

- [x] **Redux State** (`store/slices/noticesSlice.ts`)
  - Estado: `notices[]`, `formData`, `preview`, `blocks[]`, `apartments[]`, etc.
  - Acciones: `openForm`, `closeForm`, `updateFormData`, `showPreview`, `prependNotice`, etc.
  - Integrado en `store/index.ts`

- [x] **UI Components**
  - `NoticeForm.tsx` - Formulario con validación y selectores dinámicos
  - `NoticePreview.tsx` - Preview antes de enviar + confirmación
  - `NoticesList.tsx` - Tabla paginada (cursor-based)
  - `CreateNoticeModal.tsx` - Modal que alterna form/preview

- [x] **Pages**
  - `/dashboard/notices/page.tsx` - Página principal con:
    - Header + botón "Nuevo Aviso"
    - Lista de avisos
    - Modal integrado
    - Mensaje de éxito

### Backend 🔄 PENDIENTE (Documentado)
- [x] **Documentación completa** (`docs/NOTICES-LAMBDA-GUIDE.md`)
  - Schema SQL para tabla `notices`
  - Tipos TypeScript
  - Servicio: GET/POST con validaciones
  - Handlers Lambda con JWT + security
  - API contracts detallados

---

## 🛠️ Integración y Próximos Pasos

### Paso 1: Verificar Variables de Entorno

En tu `.env.local` o `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# (o tu URL de API Gateway)
```

### Paso 2: Implementar Backend

Sigue la guía en **`docs/NOTICES-LAMBDA-GUIDE.md`** para:

1. Crear tabla `notices` en Supabase
2. Implementar servicio en Lambda
3. Registrar endpoints en API Gateway
4. Deployar cambios

**Endpoints requeridos:**
```
GET  /getNoticesList?complexId=<UUID>&limit=20&cursor=<base64>&order=desc
POST /manageNotices?complexId=<UUID>
  > Body: { action: "CREATE_NOTICE", payload: {...} }
```

### Paso 3: Testear Localmente

```bash
# 1. Asegúrate de que el backend esté corriendo
npm run dev  # Frontend (Next.js)
# Lambda debería estar en localhost:3001 o similar

# 2. Navega a /dashboard/notices
# - Deberías ver botón "Nuevo Aviso"
# - Click abre modal con formulario
# - Verifica que se cargan bloques/apartamentos correctamente

# 3. Crea un aviso de prueba
# - Completa el formulario
# - Click en "Previsualizar"
# - Click en "Enviar Aviso"
# - Deberías ver mensaje de éxito
# - El aviso aparecerá en la lista
```

### Paso 4: Validar Funcionalidades

- [ ] **Crear aviso GLOBAL** (sin target)
- [ ] **Crear aviso BLOCK** (con selector de bloque)
- [ ] **Crear aviso UNIT** (con selector de apartamento)
- [ ] **Validaciones** (no permite enviar sin title/message/target)
- [ ] **Cursor-based pagination** (carga más avisos)
- [ ] **Manejo de errores** (muestra errores del backend)
- [ ] **UX** (form → preview → create → list update)

---

## 📂 Estructura de Archivos

```
residential-admin-app/
├── app/
│   └── dashboard/
│       └── notices/
│           ├── notices.types.ts      ✅ Tipos e interfaces
│           └── page.tsx              ✅ Página principal
│
├── components/
│   └── notices/
│       ├── NoticeForm.tsx            ✅ Formulario
│       ├── NoticePreview.tsx         ✅ Preview
│       ├── NoticesList.tsx           ✅ Lista/tabla
│       └── CreateNoticeModal.tsx     ✅ Modal (form + preview)
│
├── services/
│   └── notices.service.ts            ✅ API service
│
├── store/
│   ├── index.ts                      ✅ (actualizado)
│   └── slices/
│       └── noticesSlice.ts           ✅ Redux state
│
└── docs/
    └── NOTICES-LAMBDA-GUIDE.md       ✅ Documentación backend
```

---

## 🔌 Flujo de Datos

```
User Flow:
1. Dashboard/Notices Page carga
   ↓
2. NoticesList se inicializa
   ↓ Redux: setNoticesLoading(true)
   ↓
3. fetchNotices() → GET /getNoticesList
   ↓ Lambda valida JWT + complex access
   ↓
4. Redux: setNotices([ INotice[] ]) + nextCursor
   ↓
5. User clicks "Nuevo Aviso"
   ↓ Redux: openForm()
   ↓
6. CreateNoticeModal muestra NoticeForm
   ↓ User llena campos
   ↓
7. User clicks "Previsualizar"
   ↓ Redux: showPreview()
   ↓
8. CreateNoticeModal muestra NoticePreview
   ↓
9. User clicks "Enviar Aviso"
   ↓ Redux: setCreatingNotice(true)
   ↓
10. createNotice() → POST /manageNotices
    ↓ Lambda valida + inserta en DB
    ↓
11. Redux: prependNotice() + closeForm()
    ↓
12. NoticesList se actualiza (optimistic insert)
```

---

## 🔒 Seguridad Implementada

### Frontend
- [x] JWT token en headers (`Authorization: Bearer <token>`)
- [x] Validación de form (campos requeridos)
- [x] Validación de scope vs target_id

### Backend (Documentado)
- [x] JWT validation obligatorio
- [x] Verificación de complex_id access
- [x] Validación de target (blocks/apartments) pertenencia al complex
- [x] RLS policies en Supabase

---

## 🎨 Componentes Reutilizables

### Colores y Estilos
```typescript
// notices.types.ts
NOTICE_TYPE_COLORS = {
  INFO: 'bg-blue-100 text-blue-800 border-blue-300',
  WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ALERT: 'bg-red-100 text-red-800 border-red-300',
};

NOTICE_TYPE_LABELS = {
  INFO: 'Informativo',
  WARNING: 'Importante',
  ALERT: 'Alerta/Cobro',
};
```

Usa estas constantes en otros componentes para mantener consistencia.

---

## 🚀 Optimizaciones Implementadas

1. **Cursor-based Pagination**: Eficiente para grandes listas
2. **Optimistic Insert**: Prepend del aviso inmediatamente (sin refetch)
3. **Lazy Loading**: Bloques y apartamentos se cargan bajo demanda
4. **Form Validation**: Campos requeridos validados antes de preview
5. **Error Handling**: Mensajes claros sin duplicación de avisos

---

## 📝 Testing Checklist

```
[ ] Backend Lambda deployada correctamente
[ ] Endpoints GET/POST accesibles desde frontend
[ ] JWT validation funciona
[ ] Crear aviso GLOBAL
[ ] Crear aviso BLOCK (valida block pertenencia)
[ ] Crear aviso UNIT (valida apartment pertenencia)
[ ] Cursor pagination carga más avisos
[ ] Form validation muestra errores
[ ] Preview muestra contenido correcto
[ ] Success message aparece después de crear
[ ] Error handling muestra errores del backend
[ ] Formulario se limpia después de crear
[ ] Modal cierra correctamente
[ ] RLS policies funcionan (solo admin del complex)
```

---

## 🐛 Troubleshooting

### "Error fetching notices"
- Verifica que `NEXT_PUBLIC_API_URL` esté correcto
- Verifica que el backend esté corriendo
- Verifica JWT token en headers

### "Unauthorized"
- Verifica que el JWT es válido
- Verifica que el usuario tiene acceso al complex_id

### "Block/Apartment not found"
- Verifica que el target_id pertenece al complex_id
- Verifica en Supabase que los datos existen

### Form no responde
- Revisa la consola del navegador (DevTools)
- Verifica que Redux state está siendo actualizado correctamente

---

## 📚 Referencias

- **HU-2**: `docs/HU-2.md`
- **Lambda Guide**: `docs/NOTICES-LAMBDA-GUIDE.md`
- **PQRS Implementation**: `docs/PQRS-IMPLEMENTATION.md` (similar pattern)

---

## ✉️ Contacto & Soporte

Cualquier duda sobre:
- **Frontend**: Revisar `components/notices/` y `services/notices.service.ts`
- **Backend**: Revisar `docs/NOTICES-LAMBDA-GUIDE.md`
- **State**: Revisar `store/slices/noticesSlice.ts`
