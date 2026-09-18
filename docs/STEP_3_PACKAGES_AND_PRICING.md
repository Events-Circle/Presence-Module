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

GitHub publishing access has been restored under accesslap1. The backend is published on main at `f3accdf7d621cf42f130e4cf2594629b7dc8d9f3`; the frontend contract is pinned to that commit. Railway deployment remains pending: the connected Railway account reports that it lacks the required member role on the Events Circle Staging project. Do not claim live API or Expo acceptance until the new backend is deployed.

## Agreed remaining roadmap

4. Working public pages and sharing.
5. Structured inquiries.
6. Customer reviews.
7. Portfolio organization and video support.

Start each later step only after the user authorizes it.
