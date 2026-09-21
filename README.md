# Events Circle — Presence

An Expo / React Native supplier app for Android and iOS, using the existing shared Events Circle API on Railway. The first frontend implements the Cobalt Workspace direction with blue/cyan gradients, real account data, and accessible empty states. Business backend code, PostgreSQL and image storage stay in Main Core.

## Run on a phone

Requires Node 22.12+ and pnpm 10.30.3.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm start
```

This app targets **Expo SDK 57**. Use Expo Go for SDK 57, or an SDK 57 internal build. Native iOS builds require iOS 16.4 or later. The mobile SDK is independent of the shared Core backend. A native build is the stable route for ongoing testing without a developer running Metro.

In GitHub Codespaces, use `pnpm exec expo start --go --tunnel` and scan the QR code. Keep the Codespace running for this preview. A tunnel failure is separate from SDK compatibility; desktop DevTools also requires Linux GUI libraries that may not be present in Codespaces.

After pulling an SDK upgrade, stop Metro, run `pnpm install --frozen-lockfile`, and restart with `pnpm exec expo start --go --tunnel --clear`. Keep only `pnpm-lock.yaml`; do not create an npm or Yarn lockfile.

The API defaults to `https://events-circle-api-production.up.railway.app`. Override only with a reviewed HTTPS origin using `EXPO_PUBLIC_API_URL`. API paths already include `/api/v1`. Never put database, storage or signing secrets in this app.

Create an account, set up a business, then complete the Presence profile. New accounts show empty portfolios and listings; the app does not seed illustrative supplier data. Registration requires a 12–128 character password.

## Included flows

- Sign in, registration, SecureStore persistence on native, refresh-token rotation, sign out.
- Business onboarding and owner-only identity/contact/service-area editing; organization switching.
- Private profile setup without choosing a public address; an address is required before publishing. Category details use grouped sections with confirmation before replacing saved answers.
- Overview: actionable readiness checklist, compact business identity, four listing counts, projects and gallery.
- Profile description/tagline/slug, logo/cover upload, public contact visibility, readiness, publish/unpublish.
- Optional category details for venues, photography/video, catering, entertainment and other event services. Forms use server-provided fields; saved answers appear in the public preview. Changing the details form replaces its saved answers without changing Core business identity.
- Portfolio, gallery and listing create/edit, image selection/upload, image descriptions and cover selection.
- Draft/publish/unpublish/archive/restore with version checks and role-sensitive controls.
- Optional structured listing inclusions, explicit price units and pricing conditions, with a live unsaved customer preview.
- All listing types, pricing modes, offer expiry. Price input uses normal currency amounts (for example, USD 25.00); the app converts to API minor units.
- Saved-content preview; published preview uses the public aggregate (up to six per collection).
- Public link/QR/share/copy when the backend has a configured public website and the profile is published.
- Persistent editor save controls, unsaved-change guidance, inline input errors and keyboard field navigation. Unavailable social sign-in and future-feature dashboard placeholders are hidden.

## EAS distribution

`eas.json` includes an internal Android APK preview profile and production profile. The app is linked to `@omarb121s-team/events-circle-presence`, project ID `f4b3a932-55cb-4120-acf8-1938dd5ac421`. Android and iOS identifiers are `com.eventscircle.presence`.

Run `eas build --platform android --profile preview` using the existing EAS-managed signing key. EAS supplies a downloadable APK when the build passes. Each SDK upgrade requires a new native build; an already uploaded build retains its original SDK. The installed APK runs against Railway without a Metro server. iOS signing/device testing follows once the Apple Developer account is ready.

## Content management improvements

Collections support search, draft/published filters, archived items and sorting. Portfolio projects have optional date and location fields. Listings have their own service areas and availability notes. Image editing supports order, cover selection, captions and undo for the last removal. Saved-content details are available to read-only team members too.

See [Batch 3 implementation and verification](docs/BATCH_3_CONTENT_MANAGEMENT.md).

## Verification

```sh
pnpm check
pnpm exec expo export --platform all --output-dir mobile-dist
pnpm exec playwright install chromium
pnpm test:ui
pnpm smoke:staging
```

UI tests use deterministic mocked API responses, never customer records. The staging smoke is read-only. Browser QA does not establish native-device compatibility: image picker, native SecureStore, Android installation and iOS native behavior still need device validation.

## Boundaries and limitations

The browser build is a QA surface; browser sessions are memory-only. Railway CORS must explicitly allow a future web host before live web sign-in works. Native apps are the intended first delivery.

The public supplier website is a separate surface and is not deployed here. QR/sharing stays unavailable until its URL is configured in Core. Public preview is not an independently deployed website. Notification, AI, review and booking behavior is not fabricated.

Later refinement includes SEO/social links/hours editors, ordering whole collections, inquiry inbox/capture screens, richer image management, password recovery (requires backend support), and public website delivery. Leaving an editor discards unsaved changes; uploaded but unused images remain private and need backend retention/cleanup policy. Mutation timeouts are not automatically retried; refresh before trying again.

## Code layout

- `App.tsx`: app/session orchestration, tabs, overview, authentication, previews.
- `mobile/`: UI primitives, forms, live-data transport and snapshot loading.
- `src/api/`: shared generated API types and tested session/client foundation.
- `contracts/`: pinned Core contract and integrity metadata.
- `tests/`: client/session tests and browser journey checks.
- `docs/backend-integration.md`: backend handoff and ownership.

Core: https://github.com/Events-Circle/Event-Circle-Main-Core
