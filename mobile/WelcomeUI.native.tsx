import "../global.css";
import React, { type PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  ReduceMotion,
  useReducedMotion,
} from "react-native-reanimated";
import { HeroUINativeProviderRaw } from "heroui-native/provider-raw";
import { Button } from "heroui-native/button";
import type { WelcomeButtonProps } from "./WelcomeUI";
export function WelcomeRoot({ children }: PropsWithChildren) {
  const reduced = useReducedMotion();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProviderRaw
        config={{ animation: reduced ? "disable-all" : undefined }}
      >
        {children}
      </HeroUINativeProviderRaw>
    </GestureHandlerRootView>
  );
}
export function WelcomeEntrance({ children }: PropsWithChildren) {
  return (
    <Animated.View
      entering={FadeInDown.duration(380).reduceMotion(ReduceMotion.System)}
      style={{ alignSelf: "stretch" }}
    >
      {children}
    </Animated.View>
  );
}
export function WelcomeButton({
  children,
  disabled,
  ...props
}: WelcomeButtonProps) {
  return (
    <Button
      {...props}
      isDisabled={!!disabled}
      className="h-auto"
      variant={disabled ? "secondary" : "primary"}
    >
      {children}
    </Button>
  );
}
