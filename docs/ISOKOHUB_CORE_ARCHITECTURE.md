# IsokoHub Core Architecture

## Goal

Create a minimal shared layer that can support the future multi-service platform without rewriting the marketplace.

## Core structure

IsokoHub Core
├── Identity & Authentication
├── User Profiles
├── Business Profiles
├── Listings
├── Services
├── Locations
├── Search
├── Messaging
├── Reviews
├── Verification
├── Notifications
├── Orders
├── Bookings
├── Payments
├── AI
└── Administration

## Shared core principles

- One account, multiple capabilities
- One profile, many service roles
- Shared verification and trust layer
- Shared location and category models
- Shared messaging, reviews, and notifications
- Shared search indexing over multiple entity types
- Shared link graph for IsokoLink relationships

## Capability model

The current app has a single `role` field in user profile patterns. The future model should expand to a capability model, for example:

- customer
- seller
- service_provider
- professional
- business_owner
- employer
- job_seeker
- instructor
- organizer
- delivery_provider

This should be stored in a normalized way and resolved at runtime.

## IsokoLink model

Create a relationship layer instead of a category layer:

- source_type
- source_id
- target_type
- target_id
- relationship
- metadata
- created_at

Examples:

- user -> product via "favorite" or "owner"
- user -> business via "customer" or "admin"
- user -> service via "provider"
- business -> customer via "client"
- user -> job via "applicant"

This allows cross-entity discovery in a scalable way.

## Listing abstraction

The safest approach is a layered abstraction:

- Keep the existing `products` table unchanged.
- Add an optional `entity_registry` or `listings` layer that references the specialized table.
- Specialized modules can map to the same base listing concept without destroying the current product data model.

This avoids migration risk while preserving future extensibility.

## Database evolution plan

### 1. Immediate safe additions

- `user_capabilities` table
- `aler` or `notifications` table
- `entity_links` or `isokolink_relations` table
- `service_profiles` or similar future mapping table

### 2. Medium-term additions

- shared `reviews`
- shared `locations`
- shared `search_index`
- shared `conversations` / `messages`

### 3. Long-term additions

- orders
- bookings
- payments
- AI metadata or vector search surfaces

## Frontend evolution plan

- Keep existing marketplace routes active.
- Introduce a `core` module that exposes capability helpers and module metadata.
- Add future module routes under `/market`, `/services`, `/businesses`, `/properties`, `/jobs`, etc.
- Only activate the route if that module is implemented.
- Avoid heavy eager loading of future modules on the homepage.

## Operational guidance

- Never delete or rewrite the current product schema.
- Prefer additive migrations.
- Keep RLS narrow and role-aware.
- Keep auth, profiles, and messaging centralized.
- Add new modules only after the shared core is stable.
