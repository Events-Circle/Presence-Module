import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  AccessibilityInfo,
  AppState,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { presence as P } from "./tokens";
const MotionContext = createContext({
  reduced: true,
  ready: false,
  active: true,
});
export const usePresenceMotion = () => useContext(MotionContext);
export function PresenceMotion({
  children,
  focused = true,
  enabled = true,
}: PropsWithChildren<{ focused?: boolean; enabled?: boolean }>) {
  const [reduced, setReduced] = useState(true);
  // Render immediately with a safe static preference; native preference lookup is never a visibility gate.
  const [ready, setReady] = useState(true);
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    let mounted = true;
    const update = (value: boolean) => {
      if (mounted) {
        setReduced(value);
        setReady(true);
      }
    };
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(update)
      .catch(() => update(true));
    const preference = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      update,
    );
    const state = AppState.addEventListener("change", (value) =>
      setActive(value === "active"),
    );
    const blur =
      Platform.OS === "android"
        ? AppState.addEventListener("blur", () => setActive(false))
        : undefined;
    const focus =
      Platform.OS === "android"
        ? AppState.addEventListener("focus", () =>
            setActive(AppState.currentState === "active"),
          )
        : undefined;
    return () => {
      mounted = false;
      preference.remove();
      state.remove();
      blur?.remove();
      focus?.remove();
    };
  }, []);
  return (
    <MotionContext.Provider
      value={{
        reduced,
        ready: ready && enabled,
        active: active && focused && enabled,
      }}
    >
      {children}
    </MotionContext.Provider>
  );
}
export function PresenceEntrance({
  children,
  order = 0,
  translate = true,
  style,
}: PropsWithChildren<{
  order?: number;
  translate?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const { reduced, ready, active } = usePresenceMotion();
  const played = useRef(false);
  const progress = useSharedValue(1);
  useEffect(() => {
    if (!ready) return;
    if (reduced || !active) {
      cancelAnimation(progress);
      progress.set(1);
      played.current = true;
      return;
    }
    if (played.current) return;
    played.current = true;
    progress.set(0);
    progress.set(
      withDelay(
        order * P.motion.stagger,
        withTiming(1, {
          duration: P.motion.entrance,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );
  }, [ready, reduced, active, order, progress]);
  useEffect(() => () => cancelAnimation(progress), [progress]);
  const animated = useAnimatedStyle(() => ({
    // Actions remain visible and pressable even during their short entrance.
    opacity: 0.85 + 0.15 * progress.get(),
    transform: [
      { translateY: translate ? (1 - progress.get()) * P.motion.travel : 0 },
    ],
  }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
