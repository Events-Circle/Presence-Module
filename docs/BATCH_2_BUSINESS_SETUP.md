# Batch 2 — Business setup

Implemented 21 September 2026. Public pages, sharing improvements and public launch remain last.

## Delivered

- A new Presence profile can be saved as a private draft without a public page address. Initial setup focuses on the introduction; images and further details can be added afterward.
- Core accepts omitted slug on profile writes, generates an internal draft identifier, and tracks pageAddressConfirmed. Existing addresses remain confirmed. Publication and readiness enforce choosing an address first. Internal identifiers are not presented as shareable URLs in management screens.
- Business owners can add/remove up to 30 service areas (100 characters each). Duplicate additions are explained; a pending typed area is included on save; clearing all areas persists an empty array. Uses Core supplier serviceAreas, separate from base city. Saved areas appear in the in-app preview.
- Inquiry preferences explain the Leads dependency. When disabled, the UI explicitly states clients cannot send inquiries now. Onboarding explains that availability is checked after setup. The preference remains editable without pretending the inbox exists.
- Country code and phone number are visually grouped; natural formatting is retained.
- Category fields are grouped by capacity, services, facilities and timing/travel; unknown future fields retain an Other details group. Replacing previously saved category answers requires confirmation; cancel keeps the draft and existing server values.
- Essential profile information now precedes optional category details.

## Validation

- 156 distinct fixture-based browser checks across 320/390/810/1440 widths passed across the full run and targeted reruns. Reruns corrected an old inquiry-copy assertion and awaited completion of the service-area save before asserting its request.
- 45 backend integration/domain checks passed using disposable PostgreSQL-compatible PGlite with all migrations applied. Includes draft privacy, publish rejection without an address, older-client echo protection, chosen-address preservation, invalid input, content creation and stale versions.
- 13 frontend client/formatting checks passed. Type checks, architecture boundaries and changed backend lint passed. Android/iOS/web exports passed.
- Reviewed small-phone grouped category and business-contact screenshots. Physical-device keyboard, image picker and screen-reader acceptance remains pending.

## Backend dependency

Requires Core commit d4503c25830a345c28d91ccb29db7b0906d1181f and migration 20260921100000_deferred_presence_address before the updated frontend is used with the shared staging API. No Core identity schema changes.

## Release status

Core and frontend changes are published on main. The existing staging API was updated and the private draft workflow verified live before the Batch 2 Expo preview was refreshed. Public pages and public launch remain deferred.
