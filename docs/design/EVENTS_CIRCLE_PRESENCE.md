# Events Circle Presence — mobile design foundation

## Product and scope

Presence helps suppliers present their business, portfolio, gallery and listings. Sources: the supplied Growth OS V1 sections 18–24, the repository README, STEP_1_PROFILE_EXPERIENCE.md and UI_UX_REVIEW_STANDARD.md. The PDF describes a broader future product; only existing routes and capabilities are active. This landing is the app's welcome/authentication entry, not an individual supplier's public website.

Inspection found Expo 57.0.23, React Native 0.86.3, React 19.2.3, pnpm 10.30.3, a pnpm v9 lockfile, local-state navigation in App.tsx, existing StyleSheet components in mobile/ui.tsx, and a small welcome-screen adoption of HeroUI. No complete Presence design system was present. This document establishes it. No navigation, authentication, API, schema or package upgrade accompanies this change.

## Single source of shared values

`mobile/design/tokens.ts` owns the established C palette, re-exported unchanged by mobile/ui.tsx, and its Presence extension. Existing consumers retain identical colors. Continue using StyleSheet; use Uniwind only where required by HeroUI. Do not introduce another palette, styling engine or navigation system.

| Role                             | Value                                                 |
| -------------------------------- | ----------------------------------------------------- |
| Background / surface             | #F5F8FE / #FFFFFF                                     |
| Ink / body / existing muted      | #102249 / #425471 / #667797                           |
| Primary blue / turquoise         | #235AFF / #087F8C                                     |
| Border / decorative mist         | #E2E9F5 / #DDEFF0                                     |
| Champagne detail / champagne ink | #EBDCC2 / #79603C                                     |
| Success / error                  | #13845B / #9D2838                                     |
| Spacing                          | 4, 8, 12, 16, 24, 32 points                           |
| Radii                            | 12 small, 18 card, 999 primary action                 |
| Title / body / button / caption  | 40/44, 16/24, 16/24, 12/18 points                     |
| Card shadow                      | navy, 8% opacity, radius 10, y 4; Android elevation 2 |

Use platform fonts, navy headings, white or light backgrounds, restrained turquoise/blue accents and decorative champagne rules. Champagne is not a low-contrast text color. Main content scales with system text size. Decorative collage labels alone do not scale because the entire collage is excluded from accessibility.

## Components and platform behavior

- `WelcomeRoot` provides the native HeroUI raw provider and Gesture Handler root for the current screen; it reuses the outer application's SafeAreaProvider/SafeAreaView. Do not double-apply safe-area insets.
- `WelcomeButton` uses HeroUI Native 1.0.9 on Android/iOS, with its built-in 0.98 press scale. No second scale wrapper is added. Navigation runs directly in onPress without waiting for animation. Button layout targets remain at least 56 points (48 for the text login action), and labels wrap at large text sizes.
- The web QA adapter uses React Native Pressable with restrained feedback; browser results do not verify native HeroUI rendering. Reanimated handles collage/entrances on both platforms.
- `PresenceMotion` observes AccessibilityInfo and AppState; Android focus/blur pauses motion under system overlays. It supports a focused prop for future retained screens. Current local-state navigation unmounts this screen on signup/login, cleaning up its animations.
- `PresenceEntrance` starts once per screen mount, not on ordinary re-renders. Groups are collage, title, supporting text and actions, using 380 ms ease-out and 65 ms stagger. Travel is 16 points. Controls are never disabled; the action group stays partly visible throughout. Reduced motion uses the final static layout; backgrounding completes a pending entrance without replay on return.

## Landing layout and images

The only approved repository image is `assets/welcome-blue-folds.png`. The collage combines that image as a low-opacity texture with six original vector illustrations for venues, suppliers, listings and events. These are decorative conceptual previews, not real businesses or live screens. Do not add fabricated names, reviews, verified badges, prices or testimonials. Replace illustrations with licensed/approved media only when explicitly provided. The illustrations remain visible while the local texture loads or fails. No external image requests occur.

Three columns are rotated -10 degrees inside a clipped decorative region. Left travels up in 26 seconds, center down in 32, right up in 29. One group of three cards is measured with onLayout; the exact group height is the travel period. Copies = ceil(rotated coverage height / measured period) + 1. Each repeated group includes the identical trailing gap, making the modulo phase wrap geometrically identical. Rotation coverage uses inverse-rotated bounds plus 48 points of overscan. Columns use UI-thread transforms, with no frame-by-frame React state updates. Backgrounding cancels the animation at its current phase; resuming starts a full constant-speed period from that phase. Unmount cancels it completely.

The lower gradient matches the page background. The entire collage is pointerEvents=none, aria-hidden, accessibilityElementsHidden and importantForAccessibility=no-hide-descendants. Screen readers encounter only the actual title and actions.

The content width is bounded to 480 points. The decorative area uses 46% of available safe height up to 420 points; below 650 points of available height or above 1.25 system font scale it reduces to 28%, bounded to 120–210 points. Title, subtitle and actions share 24-point gutters. A flexible 24–48-point gap separates copy and actions; taller screens may retain a small trailing breathing space rather than a very large gap. Content scrolls if it exceeds the safe viewport. No fixed-height text containers or absolute-positioned actions.

## Accessibility and behavior contracts

- Preserve wording: “Events Circle Presence.”, “Your work deserves to be seen.”, “Don’t have an account?”, “Sign up with email”, “Continue with Google”, “Coming soon”, and “Already a member? Login”.
- Email signup and login use existing callbacks and forms. Google remains present and disabled because no working provider exists; never pretend OAuth works.
- The opening brand intro below precedes the landing. No artificial authentication delay, haptics, sign-in transitions or backend changes.
- Respect live reduced-motion changes and default to static until preference is known. Reduced motion disables movement and scale without hiding content.
- This screen has no text inputs. Existing AuthForm keyboard/focus/validation behavior remains unchanged; future input work must follow UI_UX_REVIEW_STANDARD.md.
- Test narrow screens, 200% text, safe-area bottom spacing, orientation changes, image failure, background/foreground and both authentication destinations. Native screen reader behavior, runtime frame rate and device touch feedback require actual device verification.

## Setup status and official references

Application packages remain HeroUI Native 1.0.9, Uniwind 1.12.0, Reanimated 4.5.1, Worklets 0.10.1 and Gesture Handler 2.32.0. Installed TypeScript definitions were checked against official Button docs before customizing feedback. Expo's Babel preset supplies Worklets configuration.

Official Expo and HeroUI skill sources are readable in this agent session, but the managed skill save previously failed with HTTP 422. A fresh discovery check still found neither in the installed skill catalog. Do not claim those skills are permanently installed or auto-discoverable. No dependency reinstall is necessary.

- https://heroui.com/en/docs/native/components/button
- https://docs.swmansion.com/react-native-reanimated/docs/animations/withRepeat/
- https://docs.swmansion.com/react-native-reanimated/docs/animations/withTiming/
- https://docs.swmansion.com/react-native-reanimated/docs/core/cancelAnimation/
- https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/
- https://reactnative.dev/docs/appstate

## Phone preview

Run the existing app, not the component playground, with EXPO_PUBLIC_UI_PREVIEW=0. In Codespaces set EXPO_PACKAGER_PROXY_URL to the actual HTTPS forwarded address and start Expo with --go. The matching phone link must use exps://, and port 8081 must be public. Recheck these after Codespace restarts; stopped Codespaces cannot serve the QR. Verify the current manifest and bundle before supplying a new QR. Expo Go confirms development behavior, not release performance.

## Implementation verification (2026-09-21)

- Shared and mobile TypeScript checks passed; project check suite passed all 18 tests. No dependency versions changed.
- Public Expo SDK 57 manifests and current Android/iOS bundles returned HTTP 200. This verifies bundling, not native-device behavior.
- Actual React Native Web render inspected at 320x568, 390x844 and 430x932; a browser-only 200% text stress check kept email and login actions reachable through the scroll container.
- Email opens Create your account; Login opens Welcome back. Google remains disabled/coming soon. Authentication was not submitted and backend behavior was not changed.
- Live reduced-motion and background visibility simulations stopped the column transforms; foregrounding resumed them. Native screen-reader, font scaling, safe-area insets, touch feedback and frame pacing still require a phone.
- Loop distance is measured from a full repeated group including trailing spacing; every column uses periodic translations and enough copies to cover its viewport. Native loop smoothness remains a device acceptance check.
- Only the approved blue artwork is available; original vector event illustrations keep cards meaningful while the texture loads or fails. No supplier identities or social proof are invented.
- Official Expo/HeroUI skill sources were consulted, but the environment skill catalog does not list them as installed/discoverable; do not confuse working app dependencies with installed agent skills.
- Sign-in transitions remain outside this change.

## Opening brand intro

The user-supplied `assets/brand/symbol.svg` (163 paths, 418x420) and `full-logo.svg` (147 paths, 1085x420) are authoritative. Their exact d/fill values are embedded in mobile/brand/artwork.ts for native rendering without a new SVG loader. The paths are traced shapes, not replacement circles or fonts. Original files are retained unchanged. Path-perimeter lengths were computed from the original curves, and outline start times follow each shape's angular position.

BrandIntro.tsx plays the approved sequence over 4 seconds. The 2900-unit internal timeline below is stretched proportionally to 4000 ms, preserving stroke overlap and movement. Dot outlines overlap color fill at 550–800 ms; the symbol settles at 700–1000 ms. Events starts at 1000 ms, CIRCLE at 1800 ms; painted strokes remain mounted while exact final contours blend in from 2560–2660 ms. Exit runs from 2700–2900 ms.

`brushStrokes.ts` supplies brush trajectories, clipped through static ClipPaths made from the original SVG lettering. Source colors and geometry are preserved. Avoid animated alpha masks: they require per-frame offscreen compositing and produced user-reported glitches. Do not hard-switch the brush layers off at completion. Timing blends stroke length with equal pen-lift allocation, preventing tiny serifs from flashing through in a single frame.

The two supplied SVGs have different traced symbol path sets. A short crossfade from the standalone symbol to the full-logo symbol at the end of positioning preserves the final artwork exactly. No new geometry, colors, lettering or black rectangular background is introduced. Width is capped at 560 points with 24-point phone margins, preserving the complete SVG aspect ratio.

AppBody mounts immediately for session restoration and prepares its authorized destination as soon as session readiness is known, underneath the four-second brand overlay. It no longer returns null for the duration of the intro. The underlying SafeAreaView is covered by the opaque intro, inaccessible to screen readers and non-interactive until intro completion, but remains laid out so the landing page can prepare its local assets and SVG collage. `entranceEnabled` flows through AuthScreen and WelcomeScreen to PresenceMotion. During preload, motion readiness and activity stay false; the entrance is not consumed and the collage does not animate. Completion reveals the prepared layout and starts the existing coordinated entrance once. Authentication restoration and membership gates are preserved; an unresolved session leaves the public landing visible while authorized routing remains gated.

Reduced motion shows the complete wordmark with a 230 ms fade. Backgrounding finishes/skips the decorative sequence. A 5.5-second watchdog and React error boundary release the app if animation preference resolution, callbacks or rendering fail. Unmount cancels work and removes subscriptions. All frame changes use shared values, SVG animated props or transforms; React state is not updated per frame.

The configured native splash and app background are #F5F8FE, matching the in-app intro. The custom sequence runs in React Native after native splash dismissal. Expo Go cannot establish release splash behavior: rebuild the native app to apply app.config.ts and verify Android/iOS cold starts, screen readers, frame pacing, restored sessions and platform deep links on a device. No native dependency changes were needed.

Verification: both TypeScript projects and 18 project tests passed. Generated paths/colors were compared against both SVGs (163/147 exact matches). Browser inspection used normal, slowed, and held diagnostic frames to inspect outlines, cursive reveals and full composition; only normal timing remains in code. Reduced-motion completion and existing Login/signup navigation were checked. No real account credentials were submitted, and no native device run or reliable frame-rate recording was available.

Public Android and iOS Expo manifests and current bundles returned HTTP 200 after normal timing was restored.


## Shared brand loading convention

User-approved direction: the **symbol without lettering** is the app-wide loading identity. Reuse `mobile/brand/BrandLoader.tsx` for future loading states; do not replay the full opening wordmark for requests. The reusable loader is available now; existing request controls are not globally replaced in this change.

The original 163 dots remain fixed in position, size and color. A soft opacity wave travels around twelve angular sectors over 2.2 seconds, without rotating or scattering the logo. Use 48 points by default, retain an accessible contextual label, and mount only while a real request is pending. Never delay completion to finish a loop. Pass active=false when a retained screen loses focus. Backgrounding pauses animation, unmount cancels it, and reduced motion uses the static complete symbol. The loader uses twelve animated groups rather than one animation per dot. No new dependencies or backend changes.

Brush update verification: pinned pnpm 10.30.3 project checks passed (contract integrity, TypeScript, 18 tests). Browser inspection of temporarily slowed playback showed partial cursive and serif brush strokes; normal 3430 ms timing was restored before delivery. Normal playback returned to the existing landing screen. Current Android/iOS manifests and bundles returned HTTP 200. No native frame-pacing or loader device test was performed. Loader adoption across existing request controls remains future work.


### Faster phone-preview workflow

For user performance previews, run `EXPO_PUBLIC_UI_PREVIEW=0 pnpm exec expo start --go --no-dev --minify --port 8081 --max-workers 2` with the existing EXPO_PACKAGER_PROXY_URL. Keep normal Metro caches; use --clear only to resolve a concrete cache problem. Request both current manifest launch assets before sharing a QR, checking dev=false and minify=true. This warms compilation but does not guarantee device download or launch time. The preview still requires a running Codespace and network; a standalone preview build embeds JavaScript for later testing without Metro.

The brush fix passed the project checks (18 tests and TypeScript). Android optimized bundle measured 8.8 MB versus 11.9 MB in development mode. Native smoothness still requires user phone verification. Session restoration remains concurrent with the intro; authentication routing was not changed.

User-approved slower opening: four seconds of continuous animation, no separate added hold. Session restoration remains concurrent; reduced-motion playback stays brief. Slower animation does not guarantee readiness on slow connections.


### Startup visibility fix

The public Welcome/Auth shell mounts before saved-session restoration finishes. Network refresh and membership checks no longer gate the public Presence landing page. Existing restored-session destination selection is preserved. Auth submission is disabled and guarded until restoration settles, preventing concurrent sign-in/session mutation. The auth error is synchronized when startup completes. No backend or token-expiry policy changes.

Motion preferences default to a ready, reduced-motion static state while the native lookup resolves. Entrance progress begins complete and uses a subtle 85–100% opacity range so a delayed or interrupted animation cannot hide the content. The intro still controls when entrance motion starts. Public text and actions do not depend on animation callbacks or preference promise completion.


Startup regression verification: an isolated production web export of the previous flow with a 60-second restoration fixture reproduced the post-intro full-screen spinner. With the fix, the same delay plus a never-resolving motion-preference lookup showed the full landing page before restoration finished. Login, registration and Back navigation worked during the delay; valid-form submission remained disabled until restoration completed. No credentials were submitted. Test-only delays were removed before native bundle verification; mobile/service.ts is unchanged. TypeScript and all 18 project tests passed. These are controlled browser results, not native device performance measurements.
