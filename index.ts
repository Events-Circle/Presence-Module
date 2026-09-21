import { registerRootComponent } from "expo";
// Explicit development previews; release builds always load the real app.
const Root = __DEV__ && process.env.EXPO_PUBLIC_AUTH_SAMPLE === "1"
  ? require("./mobile/samples/auth/AuthAnimationSample").default
  : __DEV__ && process.env.EXPO_PUBLIC_UI_PREVIEW === "1"
    ? require("./mobile/preview/ui-stack-preview").default
    : require("./App").default;
registerRootComponent(Root);
