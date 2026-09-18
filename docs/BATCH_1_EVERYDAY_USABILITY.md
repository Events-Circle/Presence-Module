# Batch 1 — Everyday usability

Implemented 18 September 2026 after the screen-by-screen UX audit.

## Delivered

- Dashboard removes future-feature placeholders and moves sharing access to Profile. Readiness actions open relevant sections; complete profiles say Review profile. Missing imagery uses a compact business initial and Add brand images action.
- Profile clearly labels business editing and account/business controls.
- All business, profile, category and content editors use the shared persistent save footer inside the keyboard-avoiding layout. Footer reports unsaved and saving states; existing discard confirmation, request versions and save behavior remain.
- Name/email/password keyboard progression and field errors before authentication requests. Unavailable social sign-in removed.
- Shared form focus registry supports next-field navigation and focuses invalid controls. Added inline title, page-name, accessibility-description and price validation; existing business/category errors participate.
- Dragging the editor dismisses the keyboard. Multiline inputs preserve newline entry.

## Verification

- TypeScript checks and pinned API contract integrity passed.
- 13 client/formatting checks passed.
- 148 distinct browser checks across 320, 390, 810 and 1440 pixel viewports passed across the initial run and targeted rerun. Eight old sharing-navigation tests initially failed because the overview shortcut was intentionally removed; updated them to enter through Profile. Targeted rerun also rechecked save visibility, first-error focus, retained drafts and authentication keyboard progression.
- Android, iOS and web Expo exports passed.
- Visually inspected small-phone editor and phone overview captures. Browser tests use API fixtures, not customer records. No native-device keyboard or screen-reader acceptance claimed.

## Scope and next work

No backend/database changes or public website deployment. Expo is a development preview. Password recovery, service areas, inquiry availability, profile creation without a public slug, grouped category fields, content search, media workflows and broader visual refinement remain subsequent work. Public pages, sharing improvements and public deployment remain last by user direction.
