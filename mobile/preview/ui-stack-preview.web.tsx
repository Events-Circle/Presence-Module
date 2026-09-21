import React from "react";
import { Text, View } from "react-native";
export default function UiStackPreview() {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text accessibilityRole="header">Mobile UI preview</Text>
      <Text>
        Open this preview in Expo Go on Android or iOS. HeroUI Native is not
        enabled on the web QA surface.
      </Text>
    </View>
  );
}
