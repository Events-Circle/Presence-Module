import React, { type PropsWithChildren } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { usePresenceMotion } from "./design/Motion";
import { presence as P } from "./design/tokens";
export type WelcomeButtonProps = PropsWithChildren<{
  accessibilityLabel: string;
  accessibilityState?: import("react-native").AccessibilityState;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  style: StyleProp<ViewStyle>;
}>;
export function WelcomeRoot({ children }: PropsWithChildren) {
  return <View style={{ flex: 1 }}>{children}</View>;
}
export function WelcomeButton({
  children,
  style,
  disabled,
  variant: _variant,
  ...props
}: WelcomeButtonProps) {
  const { reduced } = usePresenceMotion();
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ ...props.accessibilityState, disabled: !!disabled }}
      disabled={!!disabled}
      style={({ pressed }) => [
        style,
        pressed && {
          opacity: 0.86,
          transform: [{ scale: reduced ? 1 : P.motion.pressScale }],
        },
      ]}
    >
      {children}
    </Pressable>
  );
}
