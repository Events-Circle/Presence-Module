# Events Circle — Presence

An Expo / React Native supplier app for Android and iOS, using the existing shared Events Circle API on Railway. The first frontend implements the Cobalt Workspace direction with blue/cyan gradients, real account data, and accessible empty states. Business backend code, PostgreSQL and image storage stay in Main Core.

## Run on a phone

Requires Node 22.12+ and pnpm 10.30.3.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm start
```

This app targets **Expo SDK 55**, matching the Core mobile foundation. Use an SDK-55-compatible Expo Go client or a development/internal build. The current store version of Expo Go may target a newer SDK. Android can use the matching Expo Go download from expo.dev/go. A native build is the stable route for ongoing testing without a developer running Metro.

The API defaults to `https://events-circle-api-production.up.railway.app`. Override only with a reviewed HTTPS origin using `EXPO_PUBLIC_API_URL`. API paths already include `/api/v1`. Never put database, storage or signing secrets in this app.

Create an account, set up a business, then complete the Presence profile. New accounts show empty portfolios and listings; the app does not seed illustrative supplier data. Registration requires a 12–128 character password.

## Included flows

- Sign in, registration, SecureStore persistence on native, refresh-token rotation, sign out.
- Business onboarding and owner-only identity/contact editing; organization switching.
- Overview: actual readiness, profile, four listing counts, projects, contact status and gallery.
- Profile description/tagline/slug, logo/cover upload, public contact visibility, readiness, publish/unpublish.
- Portfolio, gallery and listing create/edit, image selection/upload, image descriptions and cover selection.
- Draft/publish/unpublish/archive/restore with version checks and role-sensitive controls.
- All listing types, pricing modes, offer expiry. Amount input is explicitly in minor currency units.
- Saved-content preview; published preview uses the public aggregate (up to six per collection).
- Public link/QR/share/copy when the backend has a configured public website and the profile is published.
- Explicit planned states for Circle AI, Content posts, Hosted Events, Presence reviews, WhatsApp and consultations.

## EAS distribution

`eas.json` includes an internal Android APK preview profile and production profile. **No EAS project has been linked and no installable build has been generated yet.** Linking must use the correct Events Circle Expo account/project; do not reuse the unrelated Fitness project.

After account linking, set unique Android package/iOS bundle identifiers in `app.config.ts` and the EAS project ID provided by `eas init`, then run `eas build --platform android --profile preview`. EAS supplies a downloadable APK when the build passes. This runs against Railway without a local Metro server. iOS signing/device testing follows once the Apple Developer account is ready.

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
