# Presence web UX audit — 18 September 2026

## Result and scope

The existing Presence app was reviewed page by page in source, exercised through automated Chromium journeys, and checked at 320×640, 390×844, 810×1080 and 1440×900. Selected generated screenshots were inspected, including the small-phone dashboard/editor and desktop listings.

**92 browser checks passed (23 scenarios across four viewports), 10 client/formatting tests passed, TypeScript and pinned-contract checks passed, formatting passed, and Android/iOS/web exports succeeded.** The current CI workflow runs the expanded browser suite.

This is not a claim that every planned ecosystem feature is implemented, nor an exhaustive manual/device acceptance sign-off. The interactive cloud browser could not access localhost (ERR_BLOCKED_BY_CLIENT). The browser journeys use the repository's Playwright test runner with controlled API responses. The separate live Railway smoke check passed database readiness, Presence activation, category availability, and unauthenticated-route protection. No real customer data was edited.

## Changes shipped

- Replaced native-only archive alerts with a cross-platform confirmation dialog. Cancel and restore paths are covered.
- Added unsaved-editor protection and disabled closing during save/upload.
- Hid background controls from accessibility navigation while dialogs are open, added selected-tab semantics and labels to contact switches.
- Added visible loading, saved and copied-link feedback; web users now have a Refresh data action.
- Corrected empty-state guidance for archived lists, filtered lists, missing profiles and view-only access.
- Profile publication guidance now distinguishes missing profiles, ready drafts and already-published pages.
- Published preview errors no longer fall back to private management content presented as a public preview.
- Web sharing offers copy-to-share and displays success/failure explicitly.
- Private web images are fetched with authorization and organization headers, displayed through object URLs, and released on unmount. Failed images have a readable fallback.
- Added Core category selection to portfolio, listings and gallery. This closes a real publishing blocker: Core requires a category, but the form previously supplied null for new items.
- Normal price input (e.g. 25.50) is converted to integer minor units; editing converts it back. Excess precision, invalid currency and unsafe amounts are rejected rather than rounded silently.
- Currency options match the current supported Core list. Currency fractional digits follow the runtime's Intl currency metadata, as existing display formatting does.
- Starting-price listings display “From”. Listing/pricing choices use readable labels.
- Offer expiry accepts a validated YYYY-MM-DD date and converts a changed date to the end of that UTC day. Changing an offer to another listing type clears offer dates. Existing unchanged timestamps are preserved.
- Added client-side email/password, public-address, text-length, image-description and price/date validation with actionable messages.
- Translated publication blocker field identifiers to readable labels.
- Kept existing backend boundaries, session behavior, and role authorization.

## Flow coverage

| Area                   | Exercised behavior                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Welcome/authentication | Login, signup, invalid email/password, password visibility, failed login, logout, expired-session recovery          |
| First use              | Registration, business creation, real empty-dashboard response shape, disabled publication/preview before setup     |
| Business identity      | Required fields, contact-email validation, save payload, owner-only access                                          |
| Overview/navigation    | Main section presence, tab switching, four viewport widths, no document horizontal overflow                         |
| Portfolio/gallery      | Create drafts, editor cancellation, discard confirmation, collection navigation                                     |
| Images                 | File chooser/upload, authenticated image fetch, upload failure, make-cover, remove, saved media order               |
| Listings               | Category selection, price conversion/edit round trip, starting-price label, filtering, price/date rejection         |
| Lifecycle              | Publish, unpublish, archive confirmation/cancel, archived filter, restore draft                                     |
| Profile                | Save, optimistic version conflicts preserving edits, public-address validation, readiness guidance                  |
| Preview/share          | Draft warning, public-data rendering, failed public preview, unavailable share service, successful link copy        |
| Permissions            | Owner, editor, viewer presentation; view-only guidance; business switching and selected organization header         |
| Failure recovery       | Initial load failure/retry, category-load retry preserving input, missing publication requirements, expired session |
| Client contract        | Origin safety, authorization, refresh rotation/replay handling, write behavior, generated contract integrity        |

## Limits and follow-up acceptance

1. The browser writes and public/share responses are controlled fixtures, not an authenticated live-database end-to-end test. Real media storage, real account delivery and actual public-site reachability still need a staging account walkthrough.
2. The generated Android/iOS bundles compile; no physical-device keyboard, camera/gallery permissions, screen-reader or native share-sheet acceptance was performed in this audit.
3. Social sign-in, password recovery, reviews, hosted events, Content Studio posts, WhatsApp integration, consultations and Circle AI integration are not made functional by this patch. Existing planned-state messaging must not be mistaken for an implemented backend flow.
4. Public sharing still depends on deployment of the public website and its configured URL.
5. Web sessions intentionally remain in memory; reloading the page requires sign-in again. Persistent web login requires a separate session-security design decision.
6. Core category/catalog availability is an external dependency. If it fails, the app explains the problem, permits drafts, and offers retry.
7. The pinned Core contract remains c5d62eb528d18630b6f734678cc27dcd3993eb45. Parallel Core/module work should deliberately update contracts and rerun integration checks.
8. Existing management screens do not expose every optional Core field (for example SEO, opening hours and social links); this audit does not add those product flows.
9. Complete keyboard-only/screen-reader audits and every supported browser engine remain separate acceptance work; the executable checks here use Chromium.

## Reproduce

Use the repository-pinned pnpm version (10.30.3):

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm format:check
pnpm exec expo export --platform all --output-dir mobile-dist
pnpm exec playwright install chromium
pnpm test:ui
pnpm smoke:staging
```

The browser suite's service runs only on localhost. Mock responses are confined to tests/browser and are never included in the production app. Screenshots are generated under test-results.

## See the update in Expo Go

Stop the old development server, pull main, and start a fresh tunnel:

```bash
git pull --ff-only origin main
npx pnpm@10.30.3 install --frozen-lockfile
npx pnpm@10.30.3 exec expo start --go --tunnel --clear
```

Scan the new QR code.
