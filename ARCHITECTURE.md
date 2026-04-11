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

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.amenities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  capacity integer DEFAULT 1,
  booking_mode USER-DEFINED DEFAULT 'TIME_SLOT'::amenity_booking_mode,
  pricing_type USER-DEFINED DEFAULT 'FREE'::amenity_pricing_type,
  price numeric DEFAULT 0,
  requires_approval boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  slot_duration integer DEFAULT 60,
  max_slots_per_reservation integer DEFAULT 1,
  CONSTRAINT amenities_pkey PRIMARY KEY (id),
  CONSTRAINT amenities_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id)
);
CREATE TABLE public.amenity_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  amenity_id uuid NOT NULL,
  apartment_id uuid NOT NULL,
  reserved_by uuid NOT NULL,
  reservation_date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  people_count integer DEFAULT 1,
  total_price numeric DEFAULT 0,
  status USER-DEFINED DEFAULT 'PENDING'::amenity_reservation_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT amenity_reservations_pkey PRIMARY KEY (id),
  CONSTRAINT amenity_reservations_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(id),
  CONSTRAINT amenity_reservations_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartments(id),
  CONSTRAINT amenity_reservations_reserved_by_fkey FOREIGN KEY (reserved_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.amenity_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  amenity_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  CONSTRAINT amenity_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT amenity_schedules_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(id)
);
CREATE TABLE public.apartment_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL,
  credit_amount numeric NOT NULL CHECK (credit_amount > 0::numeric),
  remaining_amount numeric NOT NULL CHECK (remaining_amount >= 0::numeric),
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT apartment_credits_pkey PRIMARY KEY (id),
  CONSTRAINT apartment_credits_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartments(id)
);
CREATE TABLE public.apartments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL,
  number text NOT NULL,
  floor integer,
  created_at timestamp with time zone DEFAULT now(),
  coefficient_pricing_id uuid,
  CONSTRAINT apartments_pkey PRIMARY KEY (id),
  CONSTRAINT apartments_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.blocks(id),
  CONSTRAINT apartments_coefficient_pricing_id_fkey FOREIGN KEY (coefficient_pricing_id) REFERENCES public.coefficient_pricing(id)
);
CREATE TABLE public.assemblies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  title text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'SCHEDULED'::assembly_status,
  scheduled_for timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  agenda jsonb DEFAULT '[]'::jsonb,
  description text,
  CONSTRAINT assemblies_pkey PRIMARY KEY (id),
  CONSTRAINT assemblies_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id)
);
CREATE TABLE public.assembly_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assembly_id uuid NOT NULL,
  apartment_id uuid NOT NULL,
  attendee_name text NOT NULL,
  attendee_document text NOT NULL,
  is_proxy boolean DEFAULT false,
  proxy_file_url text,
  can_vote boolean DEFAULT true,
  check_in_time timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  document_type_code character varying,
  CONSTRAINT assembly_attendance_pkey PRIMARY KEY (id),
  CONSTRAINT assembly_attendance_assembly_id_fkey FOREIGN KEY (assembly_id) REFERENCES public.assemblies(id),
  CONSTRAINT assembly_attendance_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartments(id),
  CONSTRAINT fk_attendance_doc_type FOREIGN KEY (document_type_code) REFERENCES public.document_types(code)
);
CREATE TABLE public.assembly_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assembly_id uuid NOT NULL,
  event_type text NOT NULL DEFAULT 'NOTE'::text,
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT assembly_logs_pkey PRIMARY KEY (id),
  CONSTRAINT assembly_logs_assembly_id_fkey FOREIGN KEY (assembly_id) REFERENCES public.assemblies(id)
);
CREATE TABLE public.billing_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL UNIQUE,
  invoice_generation_mode text NOT NULL DEFAULT 'AUTOMATIC'::text CHECK (invoice_generation_mode = ANY (ARRAY['AUTOMATIC'::text, 'EXCEL_UPLOAD'::text, 'MANUAL'::text])),
  invoice_generation_day smallint CHECK (invoice_generation_day >= 1 AND invoice_generation_day <= 28),
  payment_due_days smallint CHECK (payment_due_days >= 1 AND payment_due_days <= 60),
  payment_mode text NOT NULL DEFAULT 'PAYMENT_GATEWAY'::text CHECK (payment_mode = ANY (ARRAY['PAYMENT_GATEWAY'::text, 'REDIRECT_LINK'::text, 'MANUAL_TRANSFER'::text])),
  redirect_payment_url text,
  gateway_provider text CHECK (gateway_provider = ANY (ARRAY['PLACETOPAY'::text, 'WOMPI'::text, 'EPAYCO'::text, 'MERCADOPAGO'::text, 'NONE'::text])),
  gateway_environment text DEFAULT 'TEST'::text CHECK (gateway_environment = ANY (ARRAY['TEST'::text, 'PRODUCTION'::text])),
  gateway_credentials jsonb,
  fee_strategy text DEFAULT 'RESIDENT_PAYS'::text CHECK (fee_strategy = ANY (ARRAY['RESIDENT_PAYS'::text, 'COMPLEX_PAYS'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT billing_config_pkey PRIMARY KEY (id),
  CONSTRAINT billing_config_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id)
);
CREATE TABLE public.blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  name text NOT NULL,
  floors integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blocks_pkey PRIMARY KEY (id),
  CONSTRAINT blocks_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id)
);
CREATE TABLE public.business_complexes (
  business_id uuid NOT NULL,
  complex_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_complexes_pkey PRIMARY KEY (business_id, complex_id),
  CONSTRAINT fk_bc_business FOREIGN KEY (business_id) REFERENCES public.businesses(id),
  CONSTRAINT fk_bc_complex FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id)
);
CREATE TABLE public.business_promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  valid_until timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_promotions_pkey PRIMARY KEY (id),
  CONSTRAINT business_promotions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.business_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT business_reviews_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id),
  CONSTRAINT business_reviews_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  phone_number text,
  whatsapp_number text,
  logo_url text,
  is_verified boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  address text,
  operating_hours text,
  CONSTRAINT businesses_pkey PRIMARY KEY (id),
  CONSTRAINT businesses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id)
);
CREATE TABLE public.coefficient_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  coefficient numeric NOT NULL,
  meters numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT coefficient_pricing_pkey PRIMARY KEY (id),
  CONSTRAINT coefficient_pricing_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id)
);
CREATE TABLE public.complex_financial_settings (
  complex_id uuid NOT NULL,
  interest_type text NOT NULL DEFAULT 'PERCENTAGE'::text CHECK (interest_type = ANY (ARRAY['PERCENTAGE'::text, 'FIXED_AMOUNT'::text])),
  interest_rate numeric NOT NULL DEFAULT 0,
  grace_period_days integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT complex_financial_settings_pkey PRIMARY KEY (complex_id),
  CONSTRAINT fk_complex FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id)
);
CREATE TABLE public.complex_payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL UNIQUE,
  gateway_provider text NOT NULL CHECK (gateway_provider = ANY (ARRAY['PLACETOPAY'::text, 'WOMPI'::text, 'EPAYCO'::text])),
  environment text NOT NULL CHECK (environment = ANY (ARRAY['TEST'::text, 'PRODUCTION'::text])),
  credentials jsonb NOT NULL,
  fee_strategy text NOT NULL CHECK (fee_strategy = ANY (ARRAY['RESIDENT_PAYS'::text, 'COMPLEX_PAYS'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT complex_payment_settings_pkey PRIMARY KEY (id),
  CONSTRAINT complex_payment_settings_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id)
);
CREATE TABLE public.credit_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  credit_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  amount_applied numeric NOT NULL CHECK (amount_applied > 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT credit_applications_pkey PRIMARY KEY (id),
  CONSTRAINT credit_applications_credit_id_fkey FOREIGN KEY (credit_id) REFERENCES public.apartment_credits(id),
  CONSTRAINT credit_applications_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.document_types (
  code character varying NOT NULL,
  name character varying NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  CONSTRAINT document_types_pkey PRIMARY KEY (code)
);
CREATE TABLE public.expense_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  accounting_code character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expense_categories_pkey PRIMARY KEY (id),
  CONSTRAINT fk_expense_cat_complex FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id)
);
CREATE TABLE public.expense_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL,
  amount_paid numeric NOT NULL CHECK (amount_paid > 0::numeric),
  payment_date timestamp with time zone NOT NULL DEFAULT now(),
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['TRANSFER'::text, 'CASH'::text, 'CHECK'::text, 'DEBIT'::text])),
  reference_code character varying,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expense_payments_pkey PRIMARY KEY (id),
  CONSTRAINT fk_expense_payments_expense FOREIGN KEY (expense_id) REFERENCES public.expenses(id)
);
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  category_id uuid NOT NULL,
  invoice_number character varying,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  description text NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount > 0::numeric),
  paid_amount numeric DEFAULT 0 CHECK (paid_amount >= 0::numeric),
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'PARTIALLY_PAID'::text, 'PAID'::text, 'CANCELLED'::text])),
  receipt_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT fk_expenses_complex FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id),
  CONSTRAINT fk_expenses_category FOREIGN KEY (category_id) REFERENCES public.expense_categories(id)
);
CREATE TABLE public.feed_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  author_profile_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feed_comments_pkey PRIMARY KEY (id),
  CONSTRAINT feed_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.feed_posts(id),
  CONSTRAINT feed_comments_author_profile_id_fkey FOREIGN KEY (author_profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.feed_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid,
  author_profile_id uuid NOT NULL,
  post_type text NOT NULL CHECK (post_type = ANY (ARRAY['ANNOUNCEMENT'::text, 'POLL'::text, 'CLASSIFIED'::text, 'SOCIAL'::text])),
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  scope text NOT NULL DEFAULT 'COMPLEX'::text CHECK (scope = ANY (ARRAY['GLOBAL'::text, 'COMPLEX'::text])),
  media_urls ARRAY,
  CONSTRAINT feed_posts_pkey PRIMARY KEY (id),
  CONSTRAINT feed_posts_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id),
  CONSTRAINT feed_posts_author_profile_id_fkey FOREIGN KEY (author_profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.feed_reactions (
  post_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'LIKE'::text CHECK (reaction_type = ANY (ARRAY['LIKE'::text, 'LOVE'::text, 'INFO'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feed_reactions_pkey PRIMARY KEY (post_id, profile_id),
  CONSTRAINT feed_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.feed_posts(id),
  CONSTRAINT feed_reactions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  apartment_id uuid NOT NULL,
  guest_name character varying NOT NULL,
  plate character varying NOT NULL CHECK (length(TRIM(BOTH FROM plate)) >= 5 AND length(TRIM(BOTH FROM plate)) <= 7 AND plate::text = upper(TRIM(BOTH FROM plate))),
  expected_date date NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::invitation_status,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone,
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id),
  CONSTRAINT invitations_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartments(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  apartment_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['INTEREST'::text, 'PENALTY'::text, 'ADMIN'::text, 'EXTRAORDINARY'::text])),
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  balance_due numeric NOT NULL CHECK (balance_due >= 0::numeric),
  discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0::numeric),
  discount_applied_amount numeric DEFAULT 0 CHECK (discount_applied_amount >= 0::numeric),
  discount_deadline timestamp with time zone,
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'PARTIALLY_PAID'::text, 'PAID'::text, 'OVERDUE'::text, 'CANCELLED'::text])),
  period_month integer CHECK (period_month >= 1 AND period_month <= 12),
  period_year integer,
  due_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id),
  CONSTRAINT invoices_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartments(id)
);
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  complex_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  status text DEFAULT 'NEW'::text CHECK (status = ANY (ARRAY['NEW'::text, 'CONTACTED'::text, 'DEMO_SCHEDULED'::text, 'CLOSED_WON'::text, 'CLOSED_LOST'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  scope text NOT NULL CHECK (scope = ANY (ARRAY['GLOBAL'::text, 'BLOCK'::text, 'UNIT'::text])),
  target_id uuid,
  type text NOT NULL CHECK (type = ANY (ARRAY['INFO'::text, 'WARNING'::text, 'ALERT'::text])),
  title character varying NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notices_pkey PRIMARY KEY (id),
  CONSTRAINT notices_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id)
);
CREATE TABLE public.packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  apartment_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  carrier character varying,
  notes text,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING_PICKUP'::package_status,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  picked_up_at timestamp with time zone,
  picked_up_by character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT packages_pkey PRIMARY KEY (id),
  CONSTRAINT packages_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id),
  CONSTRAINT packages_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartments(id)
);
CREATE TABLE public.parking_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parking_id uuid NOT NULL,
  apartment_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_fee numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT parking_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT fk_parking FOREIGN KEY (parking_id) REFERENCES public.parkings(id),
  CONSTRAINT fk_apartment FOREIGN KEY (apartment_id) REFERENCES public.apartments(id)
);
CREATE TABLE public.parking_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parking_id uuid NOT NULL,
  vehicle_id uuid,
  external_plate character varying,
  entry_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  exit_time timestamp with time zone,
  observations text,
  fee_amount numeric DEFAULT 0.00,
  CONSTRAINT parking_logs_pkey PRIMARY KEY (id),
  CONSTRAINT fk_parking_log FOREIGN KEY (parking_id) REFERENCES public.parkings(id),
  CONSTRAINT fk_vehicle_log FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id)
);
CREATE TABLE public.parking_pricing_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL UNIQUE,
  is_free boolean DEFAULT true,
  free_hours integer DEFAULT 0,
  hourly_rate numeric DEFAULT 0,
  has_flat_rate boolean DEFAULT false,
  flat_rate_after_hours integer DEFAULT 24,
  flat_rate_amount numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT parking_pricing_rules_pkey PRIMARY KEY (id),
  CONSTRAINT parking_pricing_rules_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id)
);
CREATE TABLE public.parkings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  number character varying NOT NULL,
  complex_id uuid NOT NULL,
  apartment_id uuid,
  type USER-DEFINED DEFAULT 'PRIVATE'::parking_type,
  vehicle_allowed USER-DEFINED DEFAULT 'CAR'::vehicle_type,
  status USER-DEFINED DEFAULT 'AVAILABLE'::parking_status,
  coefficient_pricing_id uuid,
  CONSTRAINT parkings_pkey PRIMARY KEY (id),
  CONSTRAINT parkings_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartments(id),
  CONSTRAINT parkings_coefficient_pricing_id_fkey FOREIGN KEY (coefficient_pricing_id) REFERENCES public.coefficient_pricing(id)
);
CREATE TABLE public.poll_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL,
  apartment_id uuid NOT NULL,
  selected_option text NOT NULL,
  voter_name text NOT NULL,
  voter_document text,
  is_proxy boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  document_type_code character varying,
  CONSTRAINT poll_votes_pkey PRIMARY KEY (id),
  CONSTRAINT fk_poll_doc_type FOREIGN KEY (document_type_code) REFERENCES public.document_types(code),
  CONSTRAINT poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id),
  CONSTRAINT poll_votes_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartments(id)
);
CREATE TABLE public.polls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assembly_id uuid NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  majority_type text NOT NULL DEFAULT 'SIMPLE'::text CHECK (majority_type = ANY (ARRAY['SIMPLE'::text, 'QUALIFIED'::text])),
  status text NOT NULL DEFAULT 'DRAFT'::text CHECK (status = ANY (ARRAY['DRAFT'::text, 'ACTIVE'::text, 'CLOSED'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT polls_pkey PRIMARY KEY (id),
  CONSTRAINT polls_assembly_id_fkey FOREIGN KEY (assembly_id) REFERENCES public.assemblies(id)
);
CREATE TABLE public.pqrs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  apartment_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  subject character varying NOT NULL,
  description text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::pqrs_status,
  admin_response text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pqrs_pkey PRIMARY KEY (id),
  CONSTRAINT pqrs_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id),
  CONSTRAINT pqrs_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartments(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  email text NOT NULL DEFAULT ''::text UNIQUE CHECK (length(email) <= 50),
  updated_at timestamp with time zone DEFAULT now(),
  document_type_code character varying,
  document_number text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT fk_profiles_doc_type FOREIGN KEY (document_type_code) REFERENCES public.document_types(code)
);
CREATE TABLE public.quick_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  target_apartment_id uuid,
  target_block_id uuid,
  alert_type USER-DEFINED NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quick_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT quick_alerts_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id),
  CONSTRAINT quick_alerts_target_apartment_id_fkey FOREIGN KEY (target_apartment_id) REFERENCES public.apartments(id),
  CONSTRAINT quick_alerts_target_block_id_fkey FOREIGN KEY (target_block_id) REFERENCES public.blocks(id)
);
CREATE TABLE public.residential_complexes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  country text,
  city text,
  CONSTRAINT residential_complexes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.service_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon_name text,
  color_hex text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT service_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complex_id uuid NOT NULL,
  name text NOT NULL,
  category text,
  contact_name text,
  email text,
  phone text,
  tax_id text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT suppliers_pkey PRIMARY KEY (id),
  CONSTRAINT suppliers_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id)
);
CREATE TABLE public.transaction_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  amount_applied numeric NOT NULL CHECK (amount_applied > 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transaction_invoices_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_invoices_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
  CONSTRAINT transaction_invoices_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL,
  gateway_request_id text,
  total_amount numeric NOT NULL CHECK (total_amount > 0::numeric),
  gateway_fee numeric DEFAULT 0,
  net_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'ERROR'::text])),
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['PSE'::text, 'CREDIT_CARD'::text, 'BRE-B'::text, 'CASH'::text, 'TRANSFER'::text])),
  gateway_response jsonb,
  allocation_applied_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  idempotency_key uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartments(id)
);
CREATE TABLE public.user_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  complex_id uuid NOT NULL,
  apartment_id uuid,
  role USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT user_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT user_assignments_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT user_assignments_complex_id_fkey FOREIGN KEY (complex_id) REFERENCES public.residential_complexes(id),
  CONSTRAINT user_assignments_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartments(id)
);
CREATE TABLE public.user_fcm_tokens (
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform = ANY (ARRAY['ios'::text, 'android'::text])),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_fcm_tokens_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_fcm_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plate character varying NOT NULL,
  brand character varying,
  model character varying,
  color character varying,
  apartment_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  parking_id uuid,
  CONSTRAINT vehicles_pkey PRIMARY KEY (id),
  CONSTRAINT vehicles_parking_id_fkey FOREIGN KEY (parking_id) REFERENCES public.parkings(id),
  CONSTRAINT fk_apartment FOREIGN KEY (apartment_id) REFERENCES public.apartments(id)
);
CREATE TABLE public.visitor_authorizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL,
  visitor_name text NOT NULL,
  document_number text,
  plate character varying,
  expected_date date NOT NULL DEFAULT CURRENT_DATE,
  needs_parking boolean DEFAULT false,
  target_parking_id uuid,
  status text DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'ENTERED'::text, 'EXPIRED'::text, 'CANCELLED'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT visitor_authorizations_pkey PRIMARY KEY (id),
  CONSTRAINT visitor_authorizations_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES public.apartments(id),
  CONSTRAINT visitor_authorizations_target_parking_id_fkey FOREIGN KEY (target_parking_id) REFERENCES public.parkings(id)
);|

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
