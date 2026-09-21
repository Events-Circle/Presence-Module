# Batch 3 — Content management

Implemented 21 September 2026. Uses the existing Core API contract at d4503c25830a345c28d91ccb29db7b0906d1181f. No backend, database, dependency or public website changes.

## Delivered

- Search portfolio, listings and galleries by title, summary, description or service area. Trimmed, case-insensitive search combines with listing type and draft/published status; archived content remains explicitly separate. Sort by most recently updated or title. Clear filters recovers empty searches. Filters reset between collections and businesses.
- Search stays visible; status and sort controls expand on demand. Cards without images use a compact explanation instead of a large empty image. Saved items have a details view available to owners, editors and read-only viewers.
- Portfolio editors expose an optional calendar-based project date and searchable Core location catalog. Existing timestamps are preserved when the date is unchanged; clearing sends null. Failed catalogs offer retry and retain the saved selection without showing raw IDs.
- Listing editors expose optional listing-specific service areas and availability notes. Pending typed areas are included in save, duplicates are avoided, and clearing persists. These fields do not change the supplier's shared business identity or pretend to provide booking functionality.
- Images can move earlier/later, become the cover, be removed, and have their last removal undone before saving. Reordering preserves each image's description and caption and maintains exactly one cover. Uploads are limited to 50 images and existing Core media limits apply.
- New uploads require a meaningful accessibility description; generic title-based descriptions are no longer inserted. Optional captions are separate from accessibility text. Details views and the in-app page preview show descriptions, project context, listing details, all images and captions; image accessibility labels use saved descriptions.
- Persistent save controls, unsaved-change confirmation, role restrictions, version checks, API ownership boundaries and published-item warnings remain in place.

## Verification

- 180 distinct browser checks across 320/390/810/1440 widths passed across the full regression run and targeted reruns. The full run passed 175/176; the remaining existing Batch 2 assertion was corrected to await save completion. A final 28-check rerun covered that flow and all six new Batch 3 journeys, including location-catalog failure and retry.
- 13 existing client/formatting tests passed. Frontend TypeScript and pinned contract integrity checks passed. Android, iOS and web Expo exports passed.
- Reviewed small-phone and phone captures of collection search, project fields and media controls. Reduced filter height and shortened image-order button text after visual review.
- Live staging API checks passed for project date/location save and clearing, listing service-area/availability save and clearing, and unchanged business service areas. Synthetic content remained private, was archived, and the test session signed out.
- Browser fixtures verify interaction and persistence payloads. Native keyboard, photo picker and screen-reader acceptance still require physical-device testing.

## Scope and next work

Code is intended for Presence-Module main and the existing Codespace Expo testing preview. Core owns storage, authorization and business rules. Search operates on the complete collection snapshot loaded by the existing paginated client; exceeding its existing safety limit produces a load error rather than silently incomplete results.

Batch 4 visual refinement and device acceptance remain separate work. Public pages, public sharing improvements and public launch remain last.
