# Residential Admin App - Architecture Documentation

## 1. Project Overview

`residential-admin-app` is a modern Next.js frontend for managing residential complexes. It provides a comprehensive dashboard for managing apartments, residents, finances, amenities, assemblies, packages, PQRS, parking, and more.

## 2. Architecture

The project follows a modern web architecture using:

*   **Frontend Framework:** Next.js 14+ (React)
*   **Language:** TypeScript
*   **State Management:** Redux Toolkit
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth
*   **UI Components:** TailwindCSS + Lucide Icons
*   **API:** REST API via AWS Lambda backend

## 3. Project Structure

```
residential-admin-app/
├── app/                      # Next.js app directory
│   ├── dashboard/           # Main dashboard pages
│   │   ├── finances/       # Invoices and payments management
│   │   ├── amenities/      # Amenities management
│   │   ├── apartments/     # Apartment management
│   │   ├── assemblies/     # Assembly management
│   │   ├── notices/        # Notices management
│   │   ├── packages/       # Package tracking
│   │   ├── parking/        # Parking management
│   │   ├── pqrs/          # PQRS (Petitions/Complaints) management
│   │   ├── settings/       # Settings
│   │   └── users/          # User management
│   ├── login/              # Authentication
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable React components
├── services/               # API service layer
├── store/                  # Redux store configuration
├── lib/                    # Utility functions
└── public/                 # Static files
```

## 4. Key Features

### Finances Management
- Invoice listing with cursor-based pagination
- Invoice filtering by status and apartment
- Manual payment registration with idempotency protection
- Payment tracking and history
- Credit management

### Amenities Management
- Create and manage amenities
- Booking slots configuration
- Pricing management
- Time-slot based reservations

### Apartments Management
- Apartment listing by block
- Owner and resident assignment
- Coefficient pricing configuration
- Vehicle and parking management

### Assemblies & Polls
- Assembly scheduling
- Attendance tracking
- Poll creation and voting
- Proxy vote support

### Packages & PQRS
- Package reception and pickup tracking
- PQRS (Petitions, Complaints, Requests, Suggestions) management
- Status tracking

### Notifications & Alerts
- Complex-wide notices
- Quick alerts by block/unit
- Real-time alert system

## 5. Database Schema

### Table: `residential_complexes`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `name` | `text` | The name of the complex. |
| `address` | `text` | The address of the complex. |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `blocks`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id` | `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `name` | `text` | The name or number of the block. |
| `floors` | `integer` | Number of floors in the block. |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `apartments`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `block_id` | `uuid` | **Foreign Key** to `blocks.id`. |
| `number` | `text` | The apartment number. |
| `floor` | `integer` | The floor the apartment is on. |
| `coefficient_pricing_id` | `uuid` | **Foreign Key** to `coefficient_pricing.id`. |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `coefficient_pricing`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id` | `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `coefficient` | `numeric` | The coefficient value for pricing. |
| `meters` | `numeric` | The area in square meters. |
| `price` | `numeric` | The base price for this coefficient. |
| `created_at` | `timestamp` | Record creation timestamp. |
| `updated_at` | `timestamp` | Last update timestamp. |

### Table: `amenities`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id` | `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `name` | `varchar` | Name of the amenity. |
| `description` | `text` | Detailed description. |
| `capacity` | `integer` | Maximum capacity. |
| `booking_mode` | `USER-DEFINED` | e.g., `TIME_SLOT`. |
| `pricing_type` | `USER-DEFINED` | e.g., `FREE`. |
| `price` | `numeric` | The price for booking. |
| `requires_approval` | `boolean` | If an admin must approve the booking. |
| `is_active` | `boolean` | Whether the amenity is available. |
| `slot_duration` | `integer` | Duration of a booking slot in minutes. |
| `max_slots_per_reservation` | `integer` | Maximum slots a user can book at once. |
| `created_at` | `timestamp` | Record creation timestamp. |
| `updated_at` | `timestamp` | Last update timestamp. |

### Table: `amenity_reservations`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `amenity_id` | `uuid` | **Foreign Key** to `amenities.id`. |
| `apartment_id` | `uuid` | **Foreign Key** to `apartments.id`. |
| `reserved_by` | `uuid` | **Foreign Key** to `profiles.id`. |
| `reservation_date` | `date` | The date of the reservation. |
| `start_time` | `time` | The start time of the reservation. |
| `end_time` | `time` | The end time of the reservation. |
| `people_count` | `integer` | Number of people for the reservation. |
| `total_price` | `numeric` | The total price of the reservation. |
| `status` | `USER-DEFINED` | The status of the reservation (e.g., `PENDING`). |
| `created_at` | `timestamp` | Record creation timestamp. |
| `updated_at` | `timestamp` | Last update timestamp. |

### Table: `amenity_schedules`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `amenity_id` | `uuid` | **Foreign Key** to `amenities.id`. |
| `day_of_week` | `integer` | The day of the week (0-6). |
| `start_time` | `time` | The opening time for that day. |
| `end_time` | `time` | The closing time for that day. |

### Table: `invoices`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id` | `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `apartment_id` | `uuid` | **Foreign Key** to `apartments.id`. |
| `type` | `text` | Invoice type (`ADMIN`, `INTEREST`, `PENALTY`, `EXTRAORDINARY`). |
| `description` | `text` | Description of the invoice. |
| `amount` | `numeric` | Original invoice amount. |
| `balance_due` | `numeric` | Remaining balance to be paid. |
| `discount_amount` | `numeric` | Available discount amount. |
| `discount_applied_amount` | `numeric` | Amount of discount already applied. |
| `discount_deadline` | `timestamp` | Deadline for applying the discount. |
| `status` | `text` | Status (`PENDING`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`). |
| `period_month` | `integer` | Month of the invoice period (1-12). |
| `period_year` | `integer` | Year of the invoice period. |
| `due_date` | `timestamp` | Payment due date. |
| `created_at` | `timestamp` | Record creation timestamp. |
| `updated_at` | `timestamp` | Last update timestamp. |

### Table: `apartment_credits`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `apartment_id` | `uuid` | **Foreign Key** to `apartments.id`. |
| `credit_amount` | `numeric` | The original credit amount. |
| `remaining_amount` | `numeric` | The remaining available credit. |
| `description` | `text` | Description of the credit. |
| `created_at` | `timestamp` | Record creation timestamp. |
| `updated_at` | `timestamp` | Last update timestamp. |

### Table: `transactions`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `apartment_id` | `uuid` | **Foreign Key** to `apartments.id`. |
| `idempotency_key` | `uuid` | **Unique** - Prevents duplicate payment processing. |
| `gateway_request_id` | `text` | Payment gateway's transaction ID. |
| `total_amount` | `numeric` | Total transaction amount. |
| `gateway_fee` | `numeric` | Fee charged by the gateway. |
| `net_amount` | `numeric` | Amount received after fees. |
| `status` | `text` | Status (`PENDING`, `APPROVED`, `REJECTED`, `ERROR`). |
| `payment_method` | `text` | Method (`PSE`, `CREDIT_CARD`, `BRE-B`, `CASH`, `TRANSFER`). |
| `gateway_response` | `jsonb` | Full gateway response. |
| `allocation_applied_at` | `timestamp` | When the payment was allocated to invoices. |
| `created_at` | `timestamp` | Record creation timestamp. |
| `updated_at` | `timestamp` | Last update timestamp. |

### Table: `transaction_invoices`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `transaction_id` | `uuid` | **Foreign Key** to `transactions.id`. |
| `invoice_id` | `uuid` | **Foreign Key** to `invoices.id`. |
| `amount_applied` | `numeric` | Amount of payment applied to this invoice. |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `credit_applications`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `credit_id` | `uuid` | **Foreign Key** to `apartment_credits.id`. |
| `invoice_id` | `uuid` | **Foreign Key** to `invoices.id`. |
| `amount_applied` | `numeric` | Amount of credit applied to the invoice. |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `complex_payment_settings`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id` | `uuid` | **Unique Foreign Key** to `residential_complexes.id`. |
| `gateway_provider` | `text` | Payment gateway (e.g., `PLACETOPAY`, `WOMPI`, `EPAYCO`). |
| `environment` | `text` | Environment type (`TEST`, `PRODUCTION`). |
| `credentials` | `jsonb` | JSON object with gateway credentials. |
| `fee_strategy` | `text` | Fee arrangement (`RESIDENT_PAYS`, `COMPLEX_PAYS`). |
| `created_at` | `timestamp` | Record creation timestamp. |
| `updated_at` | `timestamp` | Last update timestamp. |

### Table: `assemblies`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id` | `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `title` | `text` | The title of the assembly. |
| `status` | `text` | The status of the assembly (e.g., `SCHEDULED`, `REGISTRATION_OPEN`, `IN_PROGRESS`, `FINISHED`). |
| `scheduled_for` | `timestamp` | The date and time the assembly is scheduled for. |
| `agenda` | `jsonb` | The agenda for the assembly. |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `assembly_attendance`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `assembly_id` | `uuid` | **Foreign Key** to `assemblies.id`. |
| `apartment_id` | `uuid` | **Foreign Key** to `apartments.id`. |
| `attendee_name` | `text` | The name of the attendee. |
| `attendee_document` | `text` | The document of the attendee. |
| `is_proxy` | `boolean` | Whether the attendee is a proxy. |
| `proxy_file_url` | `text` | The URL to the proxy file. |
| `can_vote` | `boolean` | Whether the attendee can vote. |
| `check_in_time` | `timestamp` | The time the attendee checked in. |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `assembly_logs`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `assembly_id` | `uuid` | **Foreign Key** to `assemblies.id`. |
| `event_type` | `text` | The type of event. |
| `description` | `text` | A description of the event. |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `polls`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `assembly_id` | `uuid` | **Foreign Key** to `assemblies.id`. |
| `question` | `text` | The question of the poll. |
| `options` | `jsonb` | The options for the poll. |
| `majority_type` | `text` | The type of majority required (e.g., `SIMPLE`, `QUALIFIED`). |
| `status` | `text` | The status of the poll (e.g., `DRAFT`, `ACTIVE`, `CLOSED`). |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `poll_votes`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `poll_id` | `uuid` | **Foreign Key** to `polls.id`. |
| `apartment_id` | `uuid` | **Foreign Key** to `apartments.id`. |
| `selected_option` | `text` | The option selected by the voter. |
| `voter_name` | `text` | The name of the voter. |
| `voter_document` | `text` | The document of the voter. |
| `is_proxy` | `boolean` | Whether the vote was cast by a proxy. |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `packages`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id` | `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `apartment_id` | `uuid` | **Foreign Key** to `apartments.id`. |
| `type` | `USER-DEFINED` | Package type. |
| `carrier` | `varchar` | Shipping carrier name. |
| `notes` | `text` | Additional notes. |
| `status` | `USER-DEFINED` | Status (`PENDING_PICKUP`, `PICKED_UP`). |
| `received_at` | `timestamp` | When the package was received. |
| `picked_up_at` | `timestamp` | When the package was picked up. |
| `picked_up_by` | `varchar` | Name of person who picked up. |
| `created_at` | `timestamp` | Record creation timestamp. |
| `updated_at` | `timestamp` | Last update timestamp. |

### Table: `parkings`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `number` | `varchar` | The parking spot number. |
| `complex_id` | `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `apartment_id` | `uuid` | **Foreign Key** to `apartments.id`. |
| `type` | `USER-DEFINED` | The type of parking spot (e.g., `RESIDENT`). |
| `vehicle_allowed` | `USER-DEFINED` | The type of vehicle allowed (e.g., `CAR`). |
| `status` | `USER-DEFINED` | The status of the parking spot (e.g., `AVAILABLE`). |

### Table: `parking_logs`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `parking_id` | `uuid` | **Foreign Key** to `parkings.id`. |
| `vehicle_id` | `uuid` | **Foreign Key** to `vehicles.id`. |
| `external_plate` | `varchar` | License plate of an external vehicle. |
| `entry_time` | `timestamp` | The time the vehicle entered. |
| `exit_time` | `timestamp` | The time the vehicle exited. |
| `observations` | `text` | Any observations. |
| `fee_amount` | `numeric` | The fee amount for the parking. |

### Table: `vehicles`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `plate` | `varchar` | The vehicle's license plate. |
| `brand` | `varchar` | The brand of the vehicle. |
| `model` | `varchar` | The model of the vehicle. |
| `color` | `varchar` | The color of the vehicle. |
| `apartment_id` | `uuid` | **Foreign Key** to `apartments.id`. |
| `is_active` | `boolean` | Whether the vehicle is active. |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `pqrs` (Petitions, Complaints, Requests, Suggestions)
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id` | `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `apartment_id` | `uuid` | **Foreign Key** to `apartments.id`. |
| `type` | `USER-DEFINED` | Type of PQRS (PETITION, COMPLAINT, REQUEST, SUGGESTION). |
| `subject` | `varchar` | Subject line. |
| `description` | `text` | Detailed description. |
| `status` | `USER-DEFINED` | Status (PENDING, IN_PROGRESS, RESOLVED, CLOSED). |
| `admin_response` | `text` | Admin's response. |
| `created_at` | `timestamp` | Record creation timestamp. |
| `updated_at` | `timestamp` | Last update timestamp. |

### Table: `notices`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id` | `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `scope` | `text` | Scope of notice (`GLOBAL`, `BLOCK`, `UNIT`). |
| `target_id` | `uuid` | ID of target (block or apartment) when scope is not GLOBAL. |
| `type` | `text` | Type (`INFO`, `WARNING`, `ALERT`). |
| `title` | `varchar` | Notice title. |
| `message` | `text` | Notice message. |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `quick_alerts`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id` | `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `target_apartment_id` | `uuid` | **Foreign Key** to `apartments.id` (optional). |
| `target_block_id` | `uuid` | **Foreign Key** to `blocks.id` (optional). |
| `alert_type` | `USER-DEFINED` | Type of alert (MAINTENANCE, EMERGENCY, SAFETY, OTHER). |
| `message` | `text` | Alert message. |
| `created_at` | `timestamp` | Record creation timestamp. |

### Table: `profiles`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key**, mirrors `auth.users.id`. |
| `full_name` | `text` | The user's full name. |
| `phone` | `text` | The user's phone number. |
| `email` | `text` | The user's email address. |
| `created_at` | `timestamp` | Record creation timestamp. |
| `updated_at` | `timestamp` | Last update timestamp. |

### Table: `user_assignments`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `profile_id` | `uuid` | **Foreign Key** to `profiles.id`. |
| `complex_id` | `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `apartment_id` | `uuid` | **Foreign Key** to `apartments.id`. |
| `role` | `USER-DEFINED` | The user's role (e.g., `ADMIN`, `OWNER`, `RESIDENT`). |
| `created_at` | `timestamp` | Record creation timestamp. |
| `is_active` | `boolean` | Whether the assignment is currently active. |

## 6. Service Layer

The application implements a robust service layer (`services/` directory) for all API interactions:

- `invoices.service.ts` - Invoice and payment management
- `apartments.service.ts` - Apartment operations
- `amenities.service.ts` - Amenities management
- `assembly.service.ts` - Assembly operations
- `notices.service.ts` - Notices management
- `packages.service.ts` - Package tracking
- `parking.service.ts` - Parking management
- `pqrs.service.ts` - PQRS management
- `authService.ts` - Authentication

## 7. State Management

Uses Redux Toolkit with slices for:
- `auth` - Authentication state
- `complex` - Active complex
- Other domain-specific slices

## 8. Implementation Notes

### Idempotency
Payment transactions use `idempotency_key` (UUID v4) to prevent duplicate processing and allow safe retries.

### Pagination
Cursor-based pagination is used for large data sets (invoices, apartments, etc.) with:
- `limit` - Number of items per page (typically 20)
- `cursor` - Pointer to next page
- `nextCursor` - Returned cursor for subsequent requests

### Error Handling
Comprehensive error boundaries and toast notifications throughout the application.

### TypeScript
Fully typed application with strict type checking for better IDE support and reduced runtime errors.
