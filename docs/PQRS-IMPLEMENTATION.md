# PQRS Module Implementation Guide

## Overview
This document outlines the implementation of the PQRS (Peticiones, Quejas, Reclamos y Sugerencias) module for the residential admin app.

## What Has Been Created

### 1. Frontend Components & Pages

#### Types Definition
- **File**: `app/dashboard/pqrs/pqrs.types.ts`
- **Content**: TypeScript interfaces and types for PQRS tickets, responses, and filters

#### Service
- **File**: `services/pqrs.service.ts`
- **Functions**:
  - `fetchPqrs()` - Fetch PQRS with cursor pagination
  - `respondPqrs()` - Update PQRS status and add admin response

#### Components
1. **PqrsCard** (`components/pqrs/PqrsCard.tsx`)
   - Displays individual PQRS ticket summary
   - Color-coded by type (RECLAMO, QUEJA, PETICION, SUGERENCIA)
   - Shows status with visual indicator

2. **PqrsDetailModal** (`components/pqrs/PqrsDetailModal.tsx`)
   - Modal for viewing full ticket details
   - Change status with mandatory admin response
   - Real-time validation
   - Optimistic updates with error handling

#### Page
- **File**: `app/dashboard/pqrs/page.tsx`
- **Features**:
  - Tab-based filtering (Todos, Pendientes, En Progreso, Resueltos)
  - Card grid display
  - Cursor-based pagination with "Load More"
  - Modal integration
  - Error handling and loading states

### 2. Utilities
- **File**: `lib/utils.ts`
- **Functions**:
  - `formatDate()` - Format dates in Spanish
  - `formatDateShort()` - Short date format
  - `encodeCursor()` - Encode cursor for pagination
  - `decodeCursor()` - Decode cursor from base64

### 3. Backend Documentation

#### Lambda Handler
- **File**: `docs/adminPqrsLambda.ts`
- **Endpoints**:
  - `GET /admin/complexes/{complexId}/pqrs` - Fetch PQRS with pagination
  - `POST /admin/complexes/{complexId}/pqrs` - Update PQRS and add admin response

#### Database Migration
- **File**: `docs/pqrs-migration.sql`
- **Created**:
  - `pqrs` table with proper schema
  - Type enums (pqrs_type, pqrs_status)
  - Indexes for efficient cursor-based pagination
  - RLS policies for security
  - Updated_at trigger
  - View with apartment info

## Integration Steps

### Step 1: Update Sidebar Navigation
Add the PQRS menu item to `components/sidebar/Sidebar.tsx`:

```tsx
{/* After other menu items, add: */}
<NavItem href="/dashboard/pqrs" icon={<MessageSquare />} label="PQRS" />
```

Make sure to import the icon:
```tsx
import { MessageSquare } from "lucide-react"; // or use appropriate icon
```

### Step 2: Understand Service Pattern
Before implementing the backend, review:
- **[PATRON-SERVICIOS.md](./PATRON-SERVICIOS.md)** - How services communicate with Lambda
- **[USO-SERVICIOS.md](./USO-SERVICIOS.md)** - How to use services from pages/components

Key points:
- All services receive `{ token, complexId, options/payload }`
- GET endpoints use query params: `/getPqrsList?complexId=...&status=...`
- POST endpoints use body: `{ action: "ACTION_NAME", payload: {...} }`
- Token comes from Redux auth state
- ComplexId comes from Redux complex state

### Step 2: Configure Environment Variables
Ensure your `.env.local` has:
```env
NEXT_PUBLIC_API_URL=your_api_endpoint_here
```

### Step 3: Database Setup
Execute the migration SQL (`docs/pqrs-migration.sql`) in your Supabase database:
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the entire content of `pqrs-migration.sql`
5. Run the migration

### Step 4: Backend Lambda Setup
1. Use `docs/adminPqrsLambda.ts` as a reference to implement the backend
2. Deploy the Lambda function to AWS
3. Create API Gateway endpoints:
   - `GET /admin/complexes/{complexId}/pqrs`
   - `POST /admin/complexes/{complexId}/pqrs`
4. Hook it up to your API_URL

### Step 5: Test the Implementation
1. Start the dev server: `npm run dev`
2. Navigate to `/dashboard/pqrs`
3. Test filtering, pagination, and modal interactions
4. Verify API calls in browser DevTools

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   PqrsPage (page.tsx)                   │
│  - Manages state: tickets, cursor, filters, modal       │
└────────────────┬──────────────────────────────────────┘
                 │
        ┌───────┴────────┐
        │                │
   ┌────▼─────┐    ┌────▼──────────┐
   │ PqrsCard │    │ PqrsDetailModal│
   │(Display) │    │ (Interaction)  │
   └──────────┘    └────┬──────────┘
                        │
               ┌────────▼────────┐
               │  pqrs.service   │
               │  (API calls)    │
               └─────────────────┘
                        │
              ┌─────────▼─────────┐
              │  Lambda Backend   │
              │  + Supabase DB    │
              └───────────────────┘
```

## Color Coding System

### Type Colors
- **RECLAMO** (Red): `#ef4444` (rose/red)
- **QUEJA** (Amber): `#f59e0b` (amber/orange)
- **PETICION** (Blue): `#3b82f6` (blue)
- **SUGERENCIA** (Teal): `#14b8a6` (teal/green)

### Status Colors
- **PENDING** (Yellow): In progress, needs attention
- **IN_PROGRESS** (Blue): Being handled
- **RESOLVED** (Green): Completed
- **REJECTED** (Gray): Declined

## Key Features Implemented

✅ **Cursor-based Pagination**
- Server-side pagination using cursor
- Efficient for large datasets
- No performance degradation with size

✅ **Mandatory Admin Response**
- Validation prevents status change without response
- Ensures accountability for all changes
- Clear error messaging

✅ **Optimistic Updates**
- UI updates before server confirmation
- Better UX for fast connections
- Rollback on error

✅ **Security**
- JWT validation in Lambda
- Role-based access control (ADMIN only)
- RLS policies in database
- Complex-level authorization

✅ **Status Filtering**
- Tab-based UI
- Persistent filter state
- Reset cursor on filter change

✅ **Responsive Design**
- Tailwind CSS styling
- Mobile-friendly card layout
- Accessible forms and buttons

## Testing Checklist

- [ ] Navigation to PQRS page works
- [ ] Initial load displays PQRS tickets (or empty state)
- [ ] Tab filtering updates list correctly
- [ ] "Load More" pagination works
- [ ] Clicking card opens modal
- [ ] Status dropdown appears when needed
- [ ] Response validation prevents empty submissions
- [ ] Status change updates immediately (optimistic)
- [ ] Successful update shows toast/confirmation
- [ ] Error state handled gracefully
- [ ] Modal closes after successful save
- [ ] Page refreshes correctly after modal close
- [ ] Admin response field validates non-empty
- [ ] All colors display correctly per type

## Common Issues & Solutions

### API Errors
**Problem**: "Error fetching PQRS"
- Check if API_URL is correctly set in .env.local
- Verify JWT token validity
- Check CORS settings on API

### Missing Format Function
**Problem**: "formatDate is not defined"
- Ensure `lib/utils.ts` exists
- Import from correct path: `@/lib/utils`

### Modal Not Opening
**Problem**: Modal doesn't appear on card click
- Check `document.body` is available
- Verify Next.js hydration is complete
- Check z-index in browser DevTools

### Pagination Issues
**Problem**: Duplicate tickets or missing items
- Ensure cursor encoding/decoding is correct
- Verify SQL ORDER BY clause (created_at DESC, id DESC)
- Check nextCursor null handling

## Performance Considerations

1. **Pagination Limit**: Default 20 items per page (configurable)
2. **Indexes**: Database has composite indexes for fast filtering
3. **Cursor Encoding**: Uses base64 to keep URLs clean
4. **Optimistic Updates**: Reduces perceived latency

## Security Considerations

1. **Authentication**: JWT token required for all API calls
2. **Authorization**: Lambda verifies ADMIN role for target complex
3. **Database RLS**: Row-level security ensures data isolation
4. **Input Validation**: Admin response trimmed and non-empty
5. **HTTPS Only**: All API calls should use HTTPS in production

## Next Steps / Future Enhancements

- [ ] File attachments support
- [ ] Multi-message conversations
- [ ] Search by subject/apartment
- [ ] Auto-notifications to residents
- [ ] Bulk actions (change status multiple)
- [ ] Export to PDF/CSV
- [ ] Admin notes/internal comments
- [ ] SLA tracking and alerts

## Questions or Issues?

Refer to the HU-1.md for complete requirements or check the inline documentation in each file.
