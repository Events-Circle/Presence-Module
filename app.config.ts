export default {
  expo: {
    name: "Events Circle · Presence",
    slug: "events-circle-presence",
    owner: "omarb121s-team",
    extra: {
      eas: { projectId: "f4b3a932-55cb-4120-acf8-1938dd5ac421" },
    },
    version: "0.2.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    scheme: "events-circle-presence",
    ios: { supportsTablet: true, bundleIdentifier: "com.eventscircle.presence" },
    android: { edgeToEdgeEnabled: true, package: "com.eventscircle.presence" },
    plugins: [
      "expo-secure-store",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Choose photos for your business profile and portfolio.",
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
    ],
    web: { bundler: "metro" },
  },
};
