import React, { type PropsWithChildren } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
export type WelcomeButtonProps = PropsWithChildren<{
  accessibilityLabel: string;
  onPress?: () => void;
  disabled?: boolean;
  style: StyleProp<ViewStyle>;
}>;
export function WelcomeRoot({ children }: PropsWithChildren) {
  return <View style={{ flex: 1 }}>{children}</View>;
}
export function WelcomeEntrance({ children }: PropsWithChildren) {
  return <View style={{ alignSelf: "stretch" }}>{children}</View>;
}
export function WelcomeButton({
  children,
  style,
  disabled,
  ...props
}: WelcomeButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={!!disabled}
      style={({ pressed }) => [style, pressed && { opacity: 0.8 }]}
    >
      {children}
    </Pressable>
  );
}
