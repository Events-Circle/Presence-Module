# Presence: second usability review

## Review method

Applied the user's screen-by-screen standard in `UI_UX_REVIEW_STANDARD.md`: assess understandable field requirements, realistic inputs, meaningful choices, clear consequences, recovery, and visual hierarchy. This is a review of implemented Presence flows, not a claim that planned ecosystem features are complete.

## Screens and decisions

| Screen / process                       | Usability finding                                                                        | Change or verified behavior                                                                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Welcome                                | Working email routes and unavailable social choices must be distinguishable.             | Reviewed the single-title artwork layout and existing coming-soon labels; retained working email/signup routes.                                                                       |
| Login and signup                       | Required inputs and disabled submit buttons need an explanation.                         | Added required cues, completion guidance, and password guidance; retained reveal/hide, autocomplete, input preservation, and failed-login recovery.                                   |
| Business setup and editing             | Users need meaningful controls, not raw text for every input.                            | Rechecked required labels, custom category selection, searchable country codes, country-aware phone normalization, inquiries explanation, and contact grouping from the prior change. |
| Overview                               | A percentage and “Make it yours” do not explain what completion means.                   | Renamed the metric Profile completion and show the missing requirements next to the existing edit action. Reviewed empty content and navigation.                                      |
| Portfolio / projects                   | A generic Save button does not explain publication state.                                | Explicit Save draft action, draft guidance, title requirement, contextual editor heading, descriptive placeholders, and text limits.                                                  |
| Gallery                                | Generic publishing instructions incorrectly demand project/listing requirements.         | Explain the gallery rule: at least one image. Category/description guidance is optional for galleries. Image descriptions and cover selection remain explicit.                        |
| Listings                               | Opening Add from an Offer or Product filter should honor that choice.                    | New items inherit the active listing-type filter. Listing types and pricing modes have plain-language explanations.                                                                   |
| Category selection                     | A long collection of buttons is hard to search.                                          | Searchable content-category picker, loading/failure/retry guidance. Only business categories allow custom text; content categories retain the shared catalog IDs expected by Core.    |
| Pricing                                | Currency choices and amount units should be clear.                                       | Searchable currency picker; explicit currency/unit hint; required price cue for fixed/from pricing; existing decimal validation retained.                                             |
| Offers                                 | Typing a technical date string is error-prone.                                           | Calendar with month navigation, readable selected date, clear/cancel controls, no-expiry explanation, and exact UTC end-of-day semantics.                                             |
| Images                                 | Users need to understand cover selection and accessibility descriptions.                 | Cover/image labels, descriptive example, required description cue, 300-character limit, format/size guidance; upload, removal and cover reordering checked.                           |
| Public profile editor                  | URL field, image purpose and text lengths are unclear.                                   | Explain the page-name format, add limits/counters, tagline/about guidance, and distinct logo/cover guidance.                                                                          |
| Contact visibility                     | A switch may expose data without explaining its source or consequence.                   | Explain public visibility, disable switches when corresponding contact data is missing, and point to business contact editing.                                                        |
| Editors and choices                    | Repeated generic headings and visual-only selected state reduce orientation.             | Contextual editor headings, consistent form cards, selected-state announcements on choice buttons, preserved close/discard confirmation.                                              |
| Publication / preview / sharing        | A draft preview or unconfigured public website must not imply a live public destination. | Checked publish/unpublish, archive/restore, stale edits, failed preview and unavailable sharing; backend remains authoritative for publishing.                                        |
| Business switching, roles and sessions | Avoid mixing data between businesses and avoid controls users cannot operate.            | Existing role-sensitive controls, switch scoping, refresh recovery, expiry and sign-out journeys checked.                                                                             |

## Validation and boundaries

- Full browser journey suite runs at 320px, 390px, 810px and 1440px. Journey APIs use controlled responses; visual screenshots are inspected separately.
- Client tests cover session behavior, money conversion and formatted international phones.
- TypeScript and Android/iOS/web bundle exports checked.
- Live read-only Railway smoke covers database readiness, Presence activation, category availability and protection of authenticated routes.
- Full live-account mutation acceptance and physical-device keyboard, picker, screen-reader and image-upload acceptance remain outstanding. Browser viewport checks are not native-device certification.
- Social sign-in, password recovery, future modules, a deployed public supplier website, and inquiry inbox/delivery are not made functional by these UI changes. Existing limitations remain visible; none is represented as a completed journey.

## Final results

- 100 browser journey checks passed across the four viewport sizes.
- 11 client/unit checks passed. Both TypeScript configurations and the pinned API contract check passed.
- Android, iOS and web exports succeeded. Live read-only backend smoke passed.
- Inspected rendered phone and desktop forms, calendar and contact-visibility controls. Web dialogs open without transition overlap; native transitions remain enabled.
