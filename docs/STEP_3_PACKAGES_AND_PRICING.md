# Step 3: service packages and pricing

## Delivered code

- Listing type comes before the listing fields, with a package-specific title example.
- Pricing is grouped with explanatory text for quote, starting, fixed and free modes.
- Explicit units: per event, hour, person, package or item, or total. Existing listings remain unspecified rather than receiving an assumed unit.
- Up to 20 ordered inclusions, each up to 200 characters. Empty editor lines are omitted; duplicate entries are rejected with a contextual error. Users can remove and clear all inclusions.
- Optional pricing details explain minimum quantities, travel fees or conditions, up to 500 characters.
- The unsaved customer preview updates with the price, unit, inclusions and conditions. Invalid prices show a correction prompt rather than an invented price.
- Saved listing cards and public-profile previews use the same price formatter. Full public previews include all inclusions and the listing description. Management cards summarize the first three inclusions.
- Free/quote modes submit no amount, currency or price unit. Monetary conversion preserves currency precision and rejects values exceeding the database integer range.
- Current permissions, unsaved-change confirmation, version checks and publication rules remain in force.

## Backend and compatibility

The Main Core repository contains the Presence-owned additive migration, DTOs, validation and public response fields. Core supplier identity, other modules, payment processing and booking are unchanged.

New fields: `priceUnit`, `inclusions`, `pricingNote`. Omission preserves existing new-field values, while explicit null/[]/empty string clears the respective field. Switching to quote/free clears the unit. Portfolio and gallery cannot write listing-only details. The frontend contract is pinned to the prepared backend commit in `contracts/source.json`.

## Verification

- 44 backend tests passed, including migrations, field limits, duplicate handling, old-client compatibility, stale writes, tenant boundaries and public serialization.
- 13 client tests passed, including currency precision, integer bounds, all unit labels and free/quote modes.
- 140 browser checks passed across 320, 390, 810 and 1440-pixel viewports. New journeys cover creation, save/reopen, public preview, invalid price correction, duplicate inclusion correction, blank-line omission, removal, free/quote transitions and conflict recovery.
- TypeScript checks and Android/iOS/web exports passed. Phone pricing and public-package screenshots were visually inspected.
- Browser checks use controlled API fixtures; backend integration tests use a disposable migrated database. These do not establish physical-device keyboard or Expo-device behavior.

## Release status

GitHub and Railway access were restored under accesslap1. The backend is published on main at `f3accdf7d621cf42f130e4cf2594629b7dc8d9f3`, with successful Railway deployment `0a9cc1c5-bac2-427e-8a21-ed9108f40950` on 18 September 2026. The frontend implementation was published at `56939491fa96a93ebc0c98db3c3882031862abc3` and pulled into the existing Codespace.

Live staging checks passed: health, authenticated package creation and reloading, inclusion normalization, omission preservation, duplicate rejection, stale-version conflicts, free-mode unit clearing and unpublished-profile privacy. The synthetic QA listing was archived and its profile remains unpublished. No customer records were edited.

Ngrok tunnel startup repeatedly failed. The working fallback uses the Codespace's public port 8081 and `EXPO_PACKAGER_PROXY_URL` set to its HTTPS forwarded URL before starting Expo with `--go --lan --port 8081`. The Android Expo manifest is publicly accessible and advertises HTTPS asset URLs. Use the `exps://` version of that host in Expo Go to require HTTPS. Port 4040 remains private. The Codespace must stay running; this is a development preview, not a standalone production website. Physical-device acceptance remains with the tester.

## Agreed remaining roadmap

4. Working public pages and sharing.
5. Structured inquiries.
6. Customer reviews.
7. Portfolio organization and video support.

Start each later step only after the user authorizes it.
