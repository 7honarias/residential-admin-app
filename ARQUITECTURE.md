# lambdaResidential Documentation

## 1. Project Overview

`lambdaResidential` is a serverless backend for a residential management application. It provides APIs to manage apartments, residents, amenities, and user access within a residential complex.

## 2. Architecture

The project follows a serverless architecture using [AWS (Amazon Web Services)](https://aws.amazon.com/) and [Supabase](https://supabase.com/).

*   **API Gateway:** Exposes a RESTful API for client applications.
*   **AWS Lambda:** Provides the business logic for each API endpoint. The functions are written in TypeScript.
*   **Supabase:** Acts as the backend-as-a-service, providing a PostgreSQL database and authentication services.
*   **AWS CDK (Cloud Development Kit):** Used for defining and deploying the cloud infrastructure.

## 3. API Endpoints

| Method | Endpoint                      | Lambda Function                      | Description                               |
|--------|-------------------------------|--------------------------------------|-------------------------------------------|
| GET    | `/hello`                      | `helloLambda`                        | A simple test endpoint.                   |
| POST   | `/bulkLoadAptBlock`           | `bulkLoadAptBlockLambda`             | Bulk loads apartment block data.          |
| POST   | `/massUserOnboarding`         | `massUserOnboardingLambda`           | Onboards multiple users at once.          |
| GET    | `/getUserComplex`             | `getUserComplexLambda`               | Gets the complex a user belongs to.       |
| GET    | `/getApartmentList`           | `getApartmentListLambda`             | Lists apartments in a block.              |
| GET    | `/getAmenitiesList`           | `getAmenitiesListLambda`             | Lists amenities in a complex.             |
| POST   | `/createUpdateAmenities`      | `createUpdateAmenitiesLambda`        | Creates a new amenity.                    |
| PUT    | `/createUpdateAmenities`      | `createUpdateAmenitiesLambda`        | Updates an existing amenity.              |
| POST   | `/assignApartmentOwner`       | `assignApartmentOwnerLambda`         | Assigns an owner to an apartment.         |
| POST   | `/addResident`                | `assignApartmentResidentLambda`      | Adds a resident to an apartment.          |
| POST   | `/assignParkingResident`      | `assignParkingResidentLambda`        | Assigns a parking spot to a resident.     |
| GET    | `/getParkingList`             | `getParkingListLambda`               | Gets the list of parkings for a complex.  |
| GET    | `/getParkingDetail`           | `getParkingDetailLambda`             | Gets the details of a single parking spot. |
| GET    | `/getAssemblyList`            | `getAssemblyListLambda`              | Gets the list of assemblies for a complex. |
| POST   | `/bulkCreateAssignParkingVehicle` | `bulkCreateAssignParkingVehicleLambda` | Bulk creates and assigns parkings and vehicles. |
| GET    | `/getApartmentDetail`         | `getApartmentDetailLambda`           | Gets the details of a single apartment.   |
| GET    | `/getAmenityDetails`          | `getAmenityDetailsLambda`            | Gets the details of a single amenity.     |
| PATCH  | `/getAmenityDetails`          | `getAmenityDetailsLambda`            | Partially updates an amenity.             |
| DELETE | `/deleteApartmentResident`    | `deleteApartmentResidentLambda`      | Deletes a resident from an apartment.     |
| GET    | `/goodbye`                    | `goodbyeLambda`                      | A simple test endpoint.                   |

## 4. Database Schema (Supabase/PostgreSQL)

### Table: `amenities`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id` | `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `name` | `varchar` | Name of the amenity. |
| `description`| `text` | Detailed description. |
| `capacity` | `integer` | Maximum capacity. |
| `booking_mode`| `USER-DEFINED` | e.g., `TIME_SLOT`. |
| `pricing_type`| `USER-DEFINED` | e.g., `FREE`. |
| `price` | `numeric` | The price for booking. |
| `requires_approval`| `boolean` | If an admin must approve the booking. |
| `is_active` | `boolean` | Whether the amenity is available. |
| `created_at`| `timestamp` | Record creation timestamp. |
| `updated_at`| `timestamp` | Last update timestamp. |
| `slot_duration` | `integer` | Duration of a booking slot in minutes. |
| `max_slots_per_reservation` | `integer` | Maximum slots a user can book at once. |

### Table: `amenity_reservations`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `amenity_id`| `uuid` | **Foreign Key** to `amenities.id`. |
| `apartment_id`| `uuid` | **Foreign Key** to `apartments.id`. |
| `reserved_by` | `uuid` | **Foreign Key** to `profiles.id`. |
| `reservation_date`| `date` | The date of the reservation. |
| `start_time`| `time` | The start time of the reservation. |
| `end_time` | `time` | The end time of the reservation. |
| `people_count`| `integer` | Number of people for the reservation. |
| `total_price` | `numeric` | The total price of the reservation. |
| `status` | `USER-DEFINED` | The status of the reservation (e.g., `PENDING`). |
| `created_at`| `timestamp` | Record creation timestamp. |
| `updated_at`| `timestamp` | Last update timestamp. |

### Table: `amenity_schedules`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `amenity_id`| `uuid` | **Foreign Key** to `amenities.id`. |
| `day_of_week` | `integer` | The day of the week (0-6). |
| `start_time`| `time` | The opening time for that day. |
| `end_time` | `time` | The closing time for that day. |

### Table: `apartments`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `block_id` | `uuid` | **Foreign Key** to `blocks.id`. |
| `number` | `text` | The apartment number. |
| `floor` | `integer` | The floor the apartment is on. |
| `created_at`| `timestamp` | Record creation timestamp. |
| `copropriety_coefficient` | `numeric` | The copropriety coefficient for the apartment. |

### Table: `assemblies`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id`| `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `title` | `text` | The title of the assembly. |
| `status` | `text` | The status of the assembly (e.g., `SCHEDULED`, `REGISTRATION_OPEN`, `IN_PROGRESS`, `FINISHED`). |
| `scheduled_for` | `timestamp` | The date and time the assembly is scheduled for. |
| `created_at`| `timestamp` | Record creation timestamp. |
| `agenda` | `jsonb` | The agenda for the assembly. |

### Table: `assembly_attendance`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `assembly_id`| `uuid` | **Foreign Key** to `assemblies.id`. |
| `apartment_id`| `uuid` | **Foreign Key** to `apartments.id`. |
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
| `assembly_id`| `uuid` | **Foreign Key** to `assemblies.id`. |
| `event_type`| `text` | The type of event. |
| `description`| `text` | A description of the event. |
| `created_at`| `timestamp` | Record creation timestamp. |

### Table: `blocks`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `complex_id`| `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `name` | `text` | The name or number of the block. |
| `floors` | `integer` | Number of floors in the block. |
| `created_at`| `timestamp` | Record creation timestamp. |

### Table: `parking_logs`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `parking_id`| `uuid` | **Foreign Key** to `parkings.id`. |
| `vehicle_id`| `uuid` | **Foreign Key** to `vehicles.id`. |
| `external_plate`| `varchar` | License plate of an external vehicle. |
| `entry_time`| `timestamp` | The time the vehicle entered. |
| `exit_time` | `timestamp` | The time the vehicle exited. |
| `observations`| `text` | Any observations. |
| `fee_amount` | `numeric` | The fee amount for the parking. |

### Table: `parkings`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `number` | `varchar` | The parking spot number. |
| `complex_id`| `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `apartment_id`| `uuid` | **Foreign Key** to `apartments.id`. |
| `type` | `USER-DEFINED` | The type of parking spot (e.g., `RESIDENT`). |
| `vehicle_allowed`| `USER-DEFINED` | The type of vehicle allowed (e.g., `CAR`). |
| `status` | `USER-DEFINED` | The status of the parking spot (e.g., `AVAILABLE`). |

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
| `created_at`| `timestamp` | Record creation timestamp. |

### Table: `polls`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `assembly_id` | `uuid` | **Foreign Key** to `assemblies.id`. |
| `question` | `text` | The question of the poll. |
| `options` | `jsonb` | The options for the poll. |
| `majority_type` | `text` | The type of majority required (e.g., `SIMPLE`, `QUALIFIED`). |
| `status` | `text` | The status of the poll (e.g., `DRAFT`, `ACTIVE`, `CLOSED`). |
| `created_at`| `timestamp` | Record creation timestamp. |

### Table: `profiles`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key**, mirrors `auth.users.id`. |
| `full_name`| `text` | The user's full name. |
| `phone` | `text` | The user's phone number. |
| `created_at`| `timestamp` | Record creation timestamp. |
| `email` | `text` | The user's email address. |
| `updated_at`| `timestamp` | Last update timestamp. |

### Table: `residential_complexes`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `name` | `text` | The name of the complex. |
| `address`| `text` | The address of the complex. |
| `created_at`| `timestamp` | Record creation timestamp. |

### Table: `user_assignments`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `profile_id`| `uuid` | **Foreign Key** to `profiles.id`. |
| `complex_id`| `uuid` | **Foreign Key** to `residential_complexes.id`. |
| `apartment_id`| `uuid` | **Foreign Key** to `apartments.id`. |
| `role` | `USER-DEFINED` | The user's role (e.g., `ADMIN`, `OWNER`, `RESIDENT`). |
| `created_at`| `timestamp` | Record creation timestamp. |
| `is_active` | `boolean` | Whether the assignment is currently active. |

### Table: `vehicles`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | **Primary Key** |
| `plate` | `varchar` | The vehicle's license plate. |
| `brand` | `varchar` | The brand of the vehicle. |
| `model` | `varchar` | The model of the vehicle. |
| `color` | `varchar` | The color of the vehicle. |
| `apartment_id`| `uuid` | **Foreign Key** to `apartments.id`. |
| `is_active` | `boolean` | Whether the vehicle is active. |
| `created_at`| `timestamp` | Record creation timestamp. |
