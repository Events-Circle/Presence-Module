import "../../global.css";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ReduceMotion,
  useReducedMotion,
} from "react-native-reanimated";
import { HeroUINativeProviderRaw } from "heroui-native/provider-raw";
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";

function Preview() {
  const [count, setCount] = useState(0);
  const reducedMotion = useReducedMotion();
  const offset = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate((event) => {
      offset.set(Math.max(-80, Math.min(80, event.translationX)));
    })
    .onFinalize(() => {
      offset.set(
        withSpring(0, {
          duration: 400,
          dampingRatio: 1,
          reduceMotion: ReduceMotion.System,
        }),
      );
    });
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }));
  return (
    <HeroUINativeProviderRaw
      config={{ animation: reducedMotion ? "disable-all" : undefined }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
          <Text
            accessibilityRole="header"
            className="text-2xl font-semibold text-foreground"
          >
            Mobile UI preview
          </Text>
          <Text className="text-muted">
            Isolated component checks. No account or business data is used.
          </Text>
          <Card>
            <Card.Body>
              <Card.Title>HeroUI Native</Card.Title>
              <Card.Description>
                Tap the button to verify local interaction and press feedback.
              </Card.Description>
            </Card.Body>
            <Card.Footer className="mt-4 flex-col items-stretch gap-3">
              <Button onPress={() => setCount((value) => value + 1)}>
                Test button
              </Button>
              <Text
                accessibilityLiveRegion="polite"
                className="text-foreground"
              >
                Presses: {count}
              </Text>
              <Button variant="secondary" onPress={() => setCount(0)}>
                Reset counter
              </Button>
            </Card.Footer>
          </Card>
          <Text className="text-foreground">
            Drag the square sideways and release. It returns to the center.
          </Text>
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <GestureDetector gesture={pan}>
              <Animated.View
                accessibilityLabel="Draggable preview square"
                style={[
                  {
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: "#235AFF",
                  },
                  animatedStyle,
                ]}
              />
            </GestureDetector>
          </View>
          <Button variant="outline" onPress={() => offset.set(0)}>
            Reset position
          </Button>
        </ScrollView>
      </SafeAreaView>
    </HeroUINativeProviderRaw>
  );
}

export default function UiStackPreview() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <SafeAreaProvider>
          <Preview />
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}
