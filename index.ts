import { registerRootComponent } from "expo";
// Explicitly opt in during development; release builds always load the real app.
const Root =
  __DEV__ && process.env.EXPO_PUBLIC_UI_PREVIEW === "1"
    ? require("./mobile/preview/ui-stack-preview").default
    : require("./App").default;
registerRootComponent(Root);
