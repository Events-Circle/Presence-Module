# Step 1: supplier profile experience

## Delivered

The Profile tab now groups business information, introduction, brand images, public contact details and page address into focused cards. Each card summarizes saved values and exposes an appropriately permissioned editor. An optional Edit all profile details action remains available for bulk edits and initial setup.

Focused editors retain the other profile values and the server version. Published-profile editors explain that saving updates the published record immediately. Page-name availability is confirmed by the save API; the UI does not claim a separate availability check. Logo and cover have distinct shape guidance, previews and removal actions.

The saved-content preview now presents business identity, introduction, services/packages with pricing, portfolio, gallery and approved email/phone actions. Empty sections are omitted. Published previews use public response fields without falling back to private management content. Draft previews remain explicitly labeled and show saved management content with item statuses.

## Contract and ownership

Core remains responsible for shared supplier identity and contact data. Presence owns public presentation. The existing profile PUT and optimistic version check remain unchanged. Unedited optional server fields continue to be retained by the backend merge. Existing permissions, readiness checks and publication endpoints remain authoritative. No database migration or backend deployment is required.

## Validation

- 108 browser checks passed at 320, 390, 810 and 1440 pixels.
- Four additional customer-preview checks passed, including currency display and contact visibility.
- 12 client/unit tests passed, including the unsupported Intl.DisplayNames regression.
- Both TypeScript configurations and the pinned contract verification passed.
- Android, iOS and web exports succeeded.
- Inspected phone section/editor layouts and desktop brand-image layout; inspected the customer preview separately.

Browser journeys use controlled API responses. Native bundle exports do not verify physical-device keyboard, image picker, screen reader or contact-app behavior; those still need device acceptance.

## Scope boundaries

This step redesigns supplier management and the in-app saved preview. A separately hosted public website, customer inquiry capture, reviews and category-specific fields remain later steps. Sharing still depends on the backend providing a configured public destination. No planned action is simulated as complete.
