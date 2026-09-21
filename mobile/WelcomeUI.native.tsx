import "../global.css";
import React, { type PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HeroUINativeProviderRaw } from "heroui-native/provider-raw";
import { Button } from "heroui-native/button";
import { usePresenceMotion } from "./design/Motion";
import { presence as P } from "./design/tokens";
import type { WelcomeButtonProps } from "./WelcomeUI";
export function WelcomeRoot({ children }: PropsWithChildren) {
  const { reduced } = usePresenceMotion();
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
export function WelcomeButton({
  children,
  disabled,
  variant,
  ...props
}: WelcomeButtonProps) {
  const { reduced } = usePresenceMotion();
  return (
    <Button
      {...props}
      isDisabled={!!disabled}
      className="h-auto"
      variant={variant ?? (disabled ? "secondary" : "primary")}
      animation={
        reduced ? "disable-all" : { scale: { value: P.motion.pressScale } }
      }
    >
      {children}
    </Button>
  );
}
