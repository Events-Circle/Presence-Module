export default {
  expo: {
    name: "Events Circle · Presence",
    slug: "events-circle-presence",
    version: "0.2.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    scheme: "events-circle-presence",
    ios: { supportsTablet: true },
    android: { edgeToEdgeEnabled: true },
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
