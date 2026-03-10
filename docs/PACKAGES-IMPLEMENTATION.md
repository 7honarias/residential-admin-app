# 📦 Packages & Quick Alerts - Frontend Implementation Guide

**Status:** ✅ Frontend 100% Complete  
**Pattern:** Same as PQRS and Notices  

---

## 📁 File Structure

```
app/
  dashboard/
    packages/
      layout.tsx            # Layout wrapper
      page.tsx              # Main page component
      packages.types.ts     # TypeScript types/interfaces

components/
  packages/                 # All package-related components
    CreatePackageModal.tsx  # Modal to register new package
    DeliverPackageModal.tsx # Modal to mark as delivered
    CreateQuickAlertModal.tsx # Modal to send quick alerts
    PackageCard.tsx         # Package card display
    AlertItem.tsx           # Alert item display

services/
  packages.service.ts       # HTTP service layer with JWT

store/
  (Redux state management already configured)
```

---

## 🔧 Services & API Endpoints

### Service Functions (in `services/packages.service.ts`)

#### Packages
```typescript
fetchPackages({
  token: string,
  complexId: string,
  options?: {
    status?: 'PENDING_PICKUP' | 'DELIVERED',
    limit?: number,    // default: 10
    cursor?: string    // for pagination
  }
}): Promise<{ packages: IPackage[], nextCursor: string | null }>
```

```typescript
registerPackage({
  token: string,
  complexId: string,
  payload: IRegisterPackagePayload
}): Promise<{ success: boolean, package: IPackage }>
```

```typescript
deliverPackage({
  token: string,
  complexId: string,
  payload: IDeliverPackagePayload
}): Promise<{ success: boolean, package: IPackage }>
```

#### Alerts
```typescript
createQuickAlert({
  token: string,
  complexId: string,
  payload: IQuickAlertPayload
}): Promise<{ success: boolean, alert: IQuickAlert }>
```

```typescript
fetchAlerts({
  token: string,
  complexId: string,
  options?: {
    limit?: number,    // default: 10
    cursor?: string
  }
}): Promise<{ alerts: IQuickAlert[], nextCursor: string | null }>
```

---

## 🌐 Backend Endpoints Required

Your Lambda backend should implement these 4 endpoints:

### 1. GET `/getPackagesList`
**Query Parameters:**
- `complexId` (required): Complex UUID
- `status` (required): `PENDING_PICKUP` or `DELIVERED`
- `limit` (optional, default: 10): Items per page
- `cursor` (optional): For pagination

**Headers:**
- `Authorization: Bearer {JWT}`

**Expected Response:**
```json
{
  "packages": [
    {
      "id": "pkg_123",
      "complex_id": "cx_1",
      "apartment_id": "apt_456",
      "type": "BOX",
      "carrier": "FedEx",
      "notes": "Fragile",
      "status": "PENDING_PICKUP",
      "received_at": "2025-03-09T10:30:00Z",
      "picked_up_at": null,
      "picked_up_by": null,
      "apartment_number": "201",
      "block_name": "Torre A"
    }
  ],
  "nextCursor": "eyJpZCI6ICJwa2dfMTIzIn0=" // or null if no more
}
```

---

### 2. POST `/managePackages`
**Query Parameters:**
- `complexId` (required)

**Body:**
```json
{
  "action": "REGISTER_PACKAGE",  // or "DELIVER_PACKAGE"
  "payload": { ... }              // See below
}
```

#### Action: REGISTER_PACKAGE
**Payload:**
```json
{
  "complex_id": "cx_1",
  "apartment_id": "apt_456",
  "type": "BOX",
  "carrier": "FedEx",      // optional
  "notes": "Fragile"       // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "package": { ... }  // Full IPackage object with id, received_at, etc.
}
```

#### Action: DELIVER_PACKAGE
**Payload:**
```json
{
  "complex_id": "cx_1",
  "package_id": "pkg_123",
  "picked_up_by": "Juan Pérez"
}
```

**Response (200):**
```json
{
  "success": true,
  "package": { 
    ...
    "status": "DELIVERED",
    "picked_up_at": "2025-03-09T14:45:00Z",
    "picked_up_by": "Juan Pérez"
    ...
  }
}
```

---

### 3. POST `/quickAlert`
**Query Parameters:**
- `complexId` (required)

**Body:**
```json
{
  "complex_id": "cx_1",
  "target_apartment_id": null,    // or apartment UUID
  "target_block_id": null,        // or block UUID
  "alert_type": "DELIVERY_WAITING",
  "message": "Package waiting for Tower B"
}
```

**Valid alert_type values:**
- `UTILITY_CUT` (Service cut - Red)
- `BILLS_ARRIVED` (Bills/Payments - Orange)
- `DELIVERY_WAITING` (Package info - Blue)

**Response (201):**
```json
{
  "success": true,
  "alert": {
    "id": "alert_999",
    "complex_id": "cx_1",
    "target_apartment_id": null,
    "target_block_id": null,
    "alert_type": "DELIVERY_WAITING",
    "message": "Package waiting for Tower B",
    "created_at": "2025-03-09T10:35:00Z"
  }
}
```

---

### 4. GET `/getAlertsList`
**Query Parameters:**
- `complexId` (required)
- `limit` (optional, default: 10)
- `cursor` (optional): For pagination

**Headers:**
- `Authorization: Bearer {JWT}`

**Expected Response:**
```json
{
  "alerts": [
    {
      "id": "alert_999",
      "complex_id": "cx_1",
      "target_apartment_id": null,
      "target_block_id": null,
      "alert_type": "DELIVERY_WAITING",
      "message": "Package waiting for Tower B",
      "created_at": "2025-03-09T10:35:00Z",
      "target_name": "Global"  // or "Torre A", "Apto 101", etc.
    }
  ],
  "nextCursor": null  // or cursor string if more exist
}
```

---

## 🎨 UI Components

### CreatePackageModal
- Type selection (BOX, ENVELOPE, FOOD, LAUNDRY, OTHER)
- Apartment search/select
- Carrier input (optional)
- Notes textarea (optional)
- Validation and loading states

### DeliverPackageModal
- Shows package info (apartment, type, carrier)
- Input for recipient name
- Required validation

### CreateQuickAlertModal
- Alert type select
- Message textarea
- Recipients radio selection (Global, Block, Apartment)
- Conditional selects based on recipient type

### PackageCard
- Type and status badges with colors
- Apartment info
- Carrier and notes if present
- Received and delivered dates/times
- "Mark as Delivered" button for pending packages

### AlertItem
- Alert type badge with color coding
- Message
- Recipient info
- Creation date

---

## 🔄 Data Flow

```
User Action
    ↓
Component (Modal/Page)
    ↓
Service Function (packages.service.ts)
    ↓
fetch() to Lambda endpoint
    ↓
Lambda validates JWT + authorization
    ↓
Lambda queries/modifies Supabase
    ↓
Response back to Service
    ↓
Component updates Redux state + local state
    ↓
UI re-renders with new data
```

---

## 📱 State Management

Frontend uses **Redux** for global state:
- `auth.token` - JWT token (from login)
- `complex.activeComplex?.id` - Current complex ID

These are retrieved in each service call:
```typescript
const token = useAppSelector(state => state.auth.token);
const complexId = useAppSelector(state => state.complex.activeComplex?.id);
```

---

## 🚀 How to Test Frontend

1. **Login** to the app
2. **Navigate** to "Paquetes" from sidebar
3. **Register a Package:**
   - Click "+ Register Package"
   - Fill in type, apartment, carrier (opt), notes (opt)
   - Click "Register"
   - Should see success message and package in "Pending" list

4. **Deliver a Package:**
   - Click "Mark as Delivered" on a pending package
   - Enter recipient name
   - Click "Confirm Delivery"
   - Package moves to "Delivered" list

5. **Send Quick Alert:**
   - Click "+ Send Alert"
   - Select alert type
   - Enter message
   - Select recipients (Global/Block/Apartment)
   - Click "Send Alert"
   - Should appear in "Quick Alerts" section

6. **Test Pagination:**
   - Load >10 packages/alerts
   - "Load More" button should appear
   - Click to load next batch

---

## ⚠️ Important Notes for Backend Team

### 1. Error Handling
Services expect errors in response JSON:
```json
{ "error": "ErrorType", "message": "Human readable error" }
```

Frontend will display the `message` field to users.

### 2. JWT Validation
All endpoints MUST:
- Validate JWT from `Authorization: Bearer {token}` header
- Verify user has ADMIN role
- Check user has access to the specified `complexId`
- Return 401 if token invalid
- Return 403 if not authorized for complex

### 3. Cursor-based Pagination
- Send `nextCursor` if more results exist
- Send `null` if no more results
- Cursor can be opaque (hash, encrypted ID, etc)
- Frontend will send exact cursor back in next request

### 4. Auto-timestamps
Server should auto-set these timestamps:
- `received_at` on package register
- `picked_up_at` on deliver
- `created_at` on alert creation

### 5. Data Completeness
Responses should include optional fields for display:
- `apartment_number` - apartment #201
- `block_name` - block/tower name

### 6. Complex ID Validation
Never trust `complexId` from client only:
```
❌ Bad: Trust URL parameter complexId
✅ Good: Verify against user's JWT claims/memberships
```

---

## 📊 Mock Data in Frontend

The page currently uses mock data for apartments and blocks:

```typescript
const MOCK_APARTMENTS = [
  { id: 'apt_1', number: '101', block_name: 'Torre A' },
  { id: 'apt_2', number: '102', block_name: 'Torre A' },
  // ... more
];

const MOCK_BLOCKS = [
  { id: 'block_1', name: 'Torre A' },
  { id: 'block_2', name: 'Torre B' },
];
```

**TODO:** Replace with real data fetched from backend when `getComplexData` or similar endpoint is available.

---

## 🎯 Integration Checklist

- [ ] Backend: Database migration (packages, quick_alerts tables)
- [ ] Backend: GET /getPackagesList endpoint
- [ ] Backend: POST /managePackages endpoint (REGISTER_PACKAGE action)
- [ ] Backend: POST /managePackages endpoint (DELIVER_PACKAGE action)
- [ ] Backend: POST /quickAlert endpoint
- [ ] Backend: GET /getAlertsList endpoint
- [ ] Backend: JWT validation on all endpoints
- [ ] Backend: Authorization checks (ADMIN role, complex_id)
- [ ] Backend: Cursor-based pagination
- [ ] Backend: Error handling with proper status codes
- [ ] Frontend: Update MOCK_APARTMENTS and MOCK_BLOCKS with real data
- [ ] Frontend: Testing with real backend
- [ ] Frontend: Error boundary / fallback UI
- [ ] Testing: E2E tests with Postman/Insomnia
- [ ] Docs: Backend Lambda implementation guide (optional)

---

## 📚 Reference

- HU-3.md - Complete user story and requirements
- packages.types.ts - All TypeScript interfaces
- packages.service.ts - All service functions
- PQRS-IMPLEMENTATION.md - Similar implementation reference
