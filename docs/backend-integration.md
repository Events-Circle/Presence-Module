# Shared backend integration contract

## Ownership

Presence is a separate app, sharing the same Core user identity and database as the other ecosystem apps. All backend changes, migrations, permissions and business rules belong in Main Core. This repository owns client orchestration and future screens. The contracts include other Core modules because they are generated from the shared API; their inclusion does not activate those modules or require screens for them.

## Session and tenant context

Create one AuthSession per app and use its current identity for each authenticated request. Pick organization IDs from the signed-in user's memberships/supplier result, not from arbitrary user input. Core enforces membership; the header is not an authorization grant.

```ts
import {
  AuthSession,
  createPresenceApi,
  memorySessionStore,
  STAGING_API_ORIGIN,
} from "../src/index.js";

// Development only. Replace with an Expo SecureStore adapter for the native app.
const session = new AuthSession(
  { origin: STAGING_API_ORIGIN },
  memorySessionStore(),
);
let selectedOrganization: string | undefined;
const api = createPresenceApi({
  origin: STAGING_API_ORIGIN,
  identity: () => session.identity(selectedOrganization),
});
const publicApi = createPresenceApi({ origin: STAGING_API_ORIGIN });
```

Login/register store access and refresh tokens through SessionStore. Refresh is explicit and concurrent callers share one rotation request. Do not automatically retry refresh: if a response is lost after server rotation, replaying the old token revokes the session. Any refresh failure clears local tokens and requires sign-in. Logout waits for pending session mutations and clears local tokens even if remote revocation fails; a failed remote revocation is surfaced to the caller.

Account/organization switches must reset screen caches and selection in the future UI. In-flight business requests are not cancelled by this foundation. Do not show a previous organization's results after switching. No automatic mutation retry or silent account switching is provided.

Credentials are injected at request time, restricted to the configured HTTPS origin, and never forwarded through redirects. The client does not use ambient browser cookies. The supplied default store is memory-only; no refresh token is persisted until the native secure-storage adapter is implemented. Do not put database, bucket or signing secrets in EXPO_PUBLIC variables.

## Endpoint groups

| Purpose                                | Shared API path                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Register/login/refresh/logout          | `/api/v1/core/auth/*`                                                                              |
| Current user and memberships           | `/api/v1/core/me`, `/api/v1/core/memberships`                                                      |
| Supplier identity                      | `/api/v1/core/suppliers`, `/api/v1/core/suppliers/current`                                         |
| Categories and locations               | `/api/v1/core/catalogs/categories`, `/api/v1/core/catalogs/locations`                              |
| Media upload, picker and private reads | `/api/v1/core/media`, `/api/v1/core/media/{id}/file`                                               |
| Presence profile/readiness             | `/api/v1/presence/profile`, `/api/v1/presence/readiness`                                           |
| Portfolio/listings/gallery             | `/api/v1/presence/collections/{collection}`                                                        |
| Publication, restore, archive, reorder | Generated collection/profile operation paths                                                       |
| Public profile and content             | `/api/v1/presence/public/{slug}` and its child routes                                              |
| Inquiry capture                        | `inquiryPath` returned by the public profile; current endpoint `/api/v1/leads/public/{supplierId}` |

Use the generated client methods and DTO types rather than constructing a competing server model. For example, client.GET('/api/v1/presence/profile', { params: { header: { 'X-Organization-Id': selectedOrganization } } }) requires a selected organization; the authenticated identity callback supplies the authoritative header at send time. Public clients must be separate and have no identity callback.

## Media, publication and errors

Uploads go to Core as multipart field `file`; let FormData set its boundary. Do not upload directly to the bucket or pass object keys. Core accepts JPEG/PNG/WebP up to 5 MB, processes to WebP and returns a READY media ID. Store and attach that ID. The future native file-picker/FormData adapter must be tested on Android and iOS; this foundation does not claim native upload testing.

Preserve version fields when editing or publishing; a 409 requires reloading current data. Display 422 readiness details such as missing logo instead of pretending publication succeeded. Public content/image access is revoked on unpublish. Cache invalidation belongs to the future UI. X-Next-Cursor headers provide pagination; response headers remain accessible through the generated client's `response` property.

The client returns `{ data, error, response }` for API responses; check response.ok. AuthSession throws ApiFailure with status and requestId without copying potentially sensitive server bodies. Network errors propagate. Pass cancellation signals to individual generated client operations as needed. There is no generic automatic retry policy.

## Contract updates

Current source commit is recorded in contracts/source.json. The OpenAPI JSON and generated TypeScript are API contracts, not copied server implementation. To update, retrieve both files from one reviewed Main Core commit, update source.json hashes/commit, run pnpm contracts:generate, pnpm check and review the diff. Do not fetch a moving main branch during normal builds.

Backend currently lacks a public frontend URL, so share-link generation is unavailable until that website exists. This app foundation does not configure CORS for a future browser host, EAS credentials, native storage or navigation. Those belong to the next agreed frontend phase.
