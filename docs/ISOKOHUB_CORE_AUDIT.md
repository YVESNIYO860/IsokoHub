# IsokoHub Architecture Audit

## Executive summary

This project is a working marketplace application built as a hybrid static frontend with React mounted into a route-based shell and a large legacy JavaScript layer providing marketplace data access, auth state, admin flows, seller tools, and listing management. The application is not yet a modular multi-service platform, but it already contains the foundational patterns needed for one: shared identity/auth logic, reusable product/listing/district data, and a route/metadata layer around page-level functionality.

## Current architecture summary

### Frontend structure

- Vite builds a static app with a central HTML shell.
- `src/main.jsx` is the route resolver and app bootstrap.
- Each route maps to a React page component plus script files loaded from the legacy `js/` folder.
- The legacy `js/` layer handles commerce logic, auth, admin, dashboard, product browsing, and supportive UI behavior.
- The application preserves a marketplace-first design while adding property/home features through HouseHub-specific logic.

### Data and backend layer

- The app uses Supabase for authentication, user profiles, and PostgreSQL data access.
- Product browsing, listing creation, admin moderation, and site analytics are centered on the `products` table.
- There are HouseHub-specific additions (`househub_listings`, `is_househub`, `exclude_from_browse`, etc.) designed to avoid breaking the marketplace schema.
- User profile storage is dual-layer: local storage fallback plus Supabase `user_profiles` where available.
- File uploads use Supabase Storage buckets such as `product-images` and `house-videos`.

### Marketplace model

- Products are the core public entity.
- Seller identity is derived from `seller_id`, `seller_email`, `seller_phone`, and user profile records.
- Marketplaces with homes/rents are layered onto the same product schema via category and mirror tables instead of replacing the original `products` table.
- Admin moderation is local/per-page and controlled by email-based access for the configured admin account.

## What is still working and should remain unchanged

- The public marketplace pages and product browsing experience.
- Seller dashboard and listing management flows.
- The existing `products` data model and listing UI.
- Current navigation and route-based app bootstrap.
- Supabase auth integration for login, signup, and current-session handling.
- Storage bucket usage for product media.

## What can already be reused for future services

- User session and profile persistence patterns.
- Data access helpers that normalize product data, district filters, and pricing.
- Product/media storage flow and file cleanup helpers.
- Marketplace listing moderation and admin access patterns.
- Seller/shop abstraction and profile pages.
- Geographic filters and product categorization logic.

## What should become shared/core functionality

- Identity and capability management.
- User profile records and account roles/capabilities.
- Shared entity abstraction for product/property/service/job/event entities.
- Search/filter composition logic.
- Messaging and conversation schemas.
- Verification and review models.
- Locations and discovery metadata.
- Notification infrastructure.

## What needs refactoring

- The current product-centric model should become a shared listing/domain layer, not a single marketplace-only table.
- User roles are currently treated as a simple `role` string instead of a capability-based model.
- Auth and profile logic are spread across multiple scripts and not centralized.
- Route management is route-by-route, not module-based.
- Reusable search/filter logic is embedded in page scripts instead of a common service layer.
- Existing `js/` scripts are not organized by bounded domain, which makes future multi-service expansion more fragile.

## Risks that could break the current marketplace

- Applying a new abstraction prematurely on top of the existing `products` table without preserving old fields.
- Adding generic entity tables without keeping a compatibility layer for product queries.
- Overwriting the current auth role model or changing `user_profiles` semantics without migration planning.
- Replacing the legacy route shell with a different router before the existing pages are fully migrated.
- Introducing extra dependencies or a new framework without a proven migration path.
- Dropping or rewriting storage bucket logic, admin checks, or page-specific scripts in a way that breaks the public marketplace.

## Database evolution recommendations

The safest direction is to preserve `products` as the marketplace source of truth and introduce future shared layers around it.

Recommended additions:

- `user_profiles` should grow from a role-only record into a capability-aware profile model.
- Add `user_capabilities` or `user_roles` link table for multi-role support.
- Introduce `entities` or `listings` base table for common business objects with type-specific metadata.
- Keep `products` and `househub_listings` as specialized tables and mirror relevant records into typed service tables only when necessary.
- Add `reviews`, `relationships` (IsokoLink), `notifications`, `bookings`, `orders`, and `search_index` tables in a modular way.
- Keep RLS policies explicit and role-based, not broad public writes.

## Key design principle for IsokoLink

IsokoLink should not be another marketplace category. It is the relationship layer that connects:

- User ↔ Product
- User ↔ Business
- User ↔ Service
- User ↔ Professional
- User ↔ Property
- User ↔ Job
- Business ↔ Customer
- Customer ↔ Provider

The right implementation is a reusable relationship table plus typed metadata tables, rather than duplicating logic across modules.

## Overall recommendation

Proceed in phases:

1. Keep the current marketplace stable.
2. Add a shared core module for user capabilities, links, and module metadata.
3. Introduce a generic listing abstraction only as an optional layer, not a replacement.
4. Keep future modules lazy-loaded and route-based, with only the implemented ones activated.
5. Add database migration structure in small stages, never by destructive changes.

This gives IsokoHub a path to become a multi-service ecosystem without destabilizing the existing marketplace.
