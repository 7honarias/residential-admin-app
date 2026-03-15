# Diagnóstico del Error "Failed to fetch" (200 OK)

## 🔍 Posibles Causas

1. **CORS**: El backend no tiene headers CORS correctos
2. **Respuesta vacía**: El servidor envía respuesta vacía aunque dice 200
3. **Content-Type incorrecto**: La respuesta no es JSON
4. **Network error**: Problema de red/conexión

## 📋 Pasos para Diagnosticar

### 1. **Abre DevTools** (F12)
- Ve a la pestaña **Console**
- Abre el archivo: `lib/test-dashboard-api.ts`
- Copia el código de `testDashboardAPI()`
- Pégalo en la consola y presiona Enter

### 2. **Verifica la salida**
Busca:
- ✅ "JSON parseado exitosamente" = **Tu backend funciona**
- ❌ "JSON inválido" = **Problema con formato de respuesta**
- ❌ "Respuesta vacía" = **Backend no está retornando datos**

### 3. **En la pestaña Network (F12)**
- Filtra por `getDashboardData`
- Abre el request
- Ve a **Response** y verifica:
  - ¿Es JSON válido?
  - ¿Tiene la estructura correcta?
  - ¿Hay datos o está vacío?

## 🔧 Soluciones Rápidas

### Opción A: Si es CORS
En tu Lambda, agrega headers:
```javascript
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  },
  body: JSON.stringify(data),
};
```

### Opción B: Si la respuesta está vacía
Asegúrate que tu Lambda retorna:
```javascript
return {
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dashboardData), // No olvides JSON.stringify
};
```

### Opción C: Mientras diagnosticas
Usa datos mock agregando un fallback en el dashboard:
```typescript
if (!data) {
  const mockData = { /* datos de ejemplo */ };
  setDashboardData(mockData);
}
```

## 📞 Información para el Backend

Asegúrate que `/getDashboardData` retorna exactamente esta estructura:

```json
{
  "summary": {
    "apartments": { "value": 124, "trend": 2, "isPositive": true },
    "residents": { "value": 312, "trend": 5, "isPositive": true },
    "monthlyRevenue": { "value": 45200.50, "trend": 12, "isPositive": true },
    "pendingCases": { "value": 8, "trend": 3, "isPositive": false }
  },
  "alerts": [...],
  "charts": {...},
  "lastUpdate": "2024-03-14T14:32:45.123Z"
}
```

## 🎯 Próximo Paso

1. Ejecuta `testDashboardAPI()` en la consola
2. Comparte el output
3. Verificaremos juntos qué está fallando
