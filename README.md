# Events Circle — Presence app

Separate Presence application using the shared Events Circle backend. This first delivery is the API integration foundation. It contains no screens, no second backend, no database schema and no server secrets. UI design and the Expo application shell come next.

## Backend connection

- Core source: https://github.com/Events-Circle/Event-Circle-Main-Core
- Staging API origin: https://events-circle-api-production.up.railway.app
- API paths already contain `/api/v1`; do not append it to the origin.
- Auth, organization permissions, supplier identity, media, Presence and Leads run in Core on Railway.
- The uploaded Core/Common/Presence ZIP was reviewed: all 50 files matched Core. None were copied here because the app accesses that implementation over HTTPS.

## Included

- Type-safe OpenAPI client for Core, Presence and inquiry/Leads endpoints.
- Pinned API specification/types, source commit and SHA-256 integrity checks.
- Session adapter with login, registration, explicit single-flight refresh and logout.
- Per-request authorization and organization headers; public clients without credentials.
- Tests, CI and an explicit read-only staging smoke check.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm smoke:staging
```

The smoke command reads health, module activation and catalogs, and checks that a protected route rejects anonymous access. It does not create any data. CI runs deterministic tests without depending on Railway uptime.

## Layout

- `src/api/`: client, configuration, session handling and generated types.
- `contracts/`: reviewed Core OpenAPI snapshot and source metadata.
- `tests/`: client/session behavior tests.
- `scripts/`: contract verification and read-only staging check.
- `docs/backend-integration.md`: endpoint usage, ownership, media and frontend handoff.

## Next phase

Add the Expo/React Native app for Android and iOS after UI discussion. Bind SessionStore to Expo SecureStore, link the correct EAS project, choose app identifiers, and create native builds. The current in-memory store does not persist login across app restarts. Browser credential persistence needs a separate reviewed design; never store refresh tokens in localStorage.

No EAS project, native build, public Presence website or new Railway service is created by this repository foundation. The existing Core database and private bucket remain the only sources of persistent business data.
