# Mobile UI stack setup

## Scope and baseline

Setup branch is based on `ef17326` (the latest welcome-screen work). No repository AGENTS.md was present. The application uses pnpm 10.30.3 with pnpm-lock.yaml v9, Expo 57.0.23, React Native 0.86.3 and React 19.2.3. It is managed Expo with no committed native projects. App.tsx handles navigation with local state; there is no Expo Router or React Navigation migration. Existing shared components and colors are in mobile/ui.tsx and screens use StyleSheet. The existing Metro resolver for Node-style .js imports of TypeScript sources is retained.

## Installed application packages

- heroui-native 1.0.9
- uniwind 1.12.0
- tailwindcss 4.3.3
- tailwind-variants 3.3.1
- tailwind-merge 3.7.0
- react-native-reanimated 4.5.1
- react-native-worklets 0.10.1
- react-native-gesture-handler 2.32.0 (SDK range ~2.32.0)
- Existing react-native-safe-area-context 5.7.0 and react-native-svg 15.15.4 satisfy HeroUI peers.

Native versions were selected by the project's Expo installer and bundledNativeModules.json, not npm latest. HeroUI's installed worklets peer is >=0.5.1; its quickstart's older ^0.5.1 example is not the correct Worklets version for this SDK. Expo's Babel preset auto-configures the Worklets plugin; no extra Babel config is required. No SDK upgrade was performed.

## Configuration and isolation

Uniwind wraps the existing Metro configuration, with global.css as its stylesheet and mobile/uniwind-types.d.ts as its generated type entry. The generated declarations must be committed so a clean checkout can type-check before starting Metro.

The development preview is under mobile/preview. It imports global.css, wraps its content with GestureHandlerRootView, SafeAreaProvider, and the documented HeroUINativeProviderRaw, and uses granular Card and Button imports. The raw provider deliberately avoids installing optional toast, overlay, blur, or bottom-sheet packages. Install Expo-compatible react-native-screens and any other required peers before adopting those components.

Existing App.tsx, screens, authentication, API integration, shared components and business logic are not migrated. HeroUI providers and global styles are loaded only for the isolated preview. Existing StyleSheet styling remains authoritative until individual screens are deliberately migrated.

index.ts selects the preview only when **DEV** and EXPO_PUBLIC_UI_PREVIEW=1. Production bundles always select App. The preview only changes local state; it does not access accounts or the API. A platform-specific web file explains that native-device testing is required; it is not a substitute HeroUI rendering.

## Try the preview

Use the repository's pinned pnpm via Corepack. Ensure child processes also resolve the same pnpm (some Codespace images have a different global pnpm).

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm preview:ui
```

Scan the Metro QR in Expo Go compatible with SDK 57. Test counter increments/reset, press feedback, drag and snap-back, reset position, reduced motion, and large text on Android and iOS. For Codespaces use the previously configured HTTPS proxy and public preview port; visibility can revert to Private on restart. Verify it after each restart.

Stop the preview and run `corepack pnpm start` to return to the existing application. Do not set EXPO_PUBLIC_UI_PREVIEW in production environments.

## Agent skills are separate

Official Expo sources inspected at 39708666ce7014def1f8e34f3d8c93e8d3f588bb; HeroUI skill sources at eaea1e543ffa553b8c50a827dfc2ecbc542e749e.

This ChatGPT Work environment requires personal skills to be saved through its managed skill store. Official HeroUI Native, Expo overview, animation, native UI and design-system files were copied and validated in that environment's personal skill checkout. Expo's top-level version metadata was normalized into metadata.version for the local validator; instruction bodies were retained. The save service returned HTTP 422, and the remote skill store remained empty. These copies can be read explicitly in this session but are NOT confirmed permanent installations and are not present in the agent's discoverable skill catalog. Application dependency installation succeeded independently.

The Expo plugin was not returned by this environment's plugin directory. In supported Codex CLI environments the official command is `codex plugin add expo@openai-curated`; this environment does not expose that CLI. HeroUI documents `npx skills add heroui-inc/heroui` or its installer; these are not substitutes for a successful managed Work skill installation.

## Official references

- https://github.com/expo/skills
- https://heroui.com/en/docs/native/getting-started/agent-skills
- https://heroui.com/en/docs/native/getting-started/quick-start
- https://heroui.com/en/docs/native/getting-started/provider
- https://docs.uniwind.dev/quickstart
- https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/
- https://docs.expo.dev/versions/v57.0.0/sdk/gesture-handler/
- https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/

HeroUI currently does not recommend its Native package for web. Browser checks validate the existing app and the preview's explanatory web screen, not native animation or gesture correctness.

## Verification notes

The existing Codespace tsconfig extends expo/tsconfig.base, which sets noEmit. The build command now explicitly uses `tsc --noEmit false` so tests load current generated files instead of stale or missing dist files. The existing local tsconfig edit is preserved and excluded from this setup commit.

`expo install --check` accepts the newly installed native packages but flags pre-existing versions: Expo 57.0.23 (expects ~57.0.24), expo-image-picker 57.0.18 (expects ~57.0.19), @types/react 19.3.0 (expects ~19.2.4), and TypeScript 5.9.3 (expects ~6.0.3). These unrelated updates were not applied.

Prepared skill copies are under `/root/.codex/skills/remote-skills/{heroui-native,expo-overview,expo-animation,expo-native-ui,expo-design-system}` in the agent environment, not in the application repository. Their permanent installation and automatic discovery remain blocked.

After the build-command correction, `pnpm check` passed: pinned contract verification, both TypeScript checks, build, and all 18 tests. The isolated development preview exported successfully for Android and iOS. No physical device or emulator was available, so native rendering, touch gestures, animation, and reduced-motion behavior still require device verification.

The normal application also exported for Android, iOS, and web. Metro launched, and browser verification confirmed the existing welcome screen and navigation to the email signup form. Native React Native DevTools could not install in this Codespace because libatk-1.0.so.0 is absent; Metro and app loading continued successfully. No account was created during verification.

## First screen adoption: welcome

The welcome screen now uses native HeroUI buttons and a Reanimated title entrance through WelcomeUI.native.tsx. Its provider and gesture root are scoped to that screen; existing auth handlers are unchanged. Reduced-motion preferences disable the entrance/press animations. WelcomeUI.tsx retains a React Native web fallback because HeroUI Native is not used for web. The existing artwork, shared left alignment, and bottom action group are retained, with 56-point rounded buttons and larger labels.

Verification: both TypeScript checks passed; Android and iOS development bundles returned HTTP 200; browser welcome rendering and email signup/login navigation passed. Native visual/press feedback remains for phone testing. The running Expo session uses EXPO_PUBLIC_UI_PREVIEW=0 to show the actual app.
