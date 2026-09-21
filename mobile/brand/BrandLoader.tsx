import React, { useEffect, useState } from "react";
import { AccessibilityInfo, AppState, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { symbolPaths } from "./artwork";

const AG = Animated.createAnimatedComponent(G);
// Twelve static sectors bound animation work regardless of the SVG's path count.
const sectors = Array.from({ length: 12 }, (_, sector) =>
  symbolPaths.filter(
    (p) => Math.min(11, Math.floor((p.start / 650) * 12)) === sector,
  ),
);
function Sector({
  index,
  phase,
  still,
}: {
  index: number;
  phase: SharedValue<number>;
  still: boolean;
}) {
  const props = useAnimatedProps(() => ({
    opacity: still
      ? 1
      : 0.35 +
        0.65 * (0.5 + 0.5 * Math.cos(2 * Math.PI * (phase.get() - index / 12))),
  }));
  return (
    <AG animatedProps={props}>
      {sectors[index]!.map((p, i) => (
        <Path key={i} d={p.d} fill={p.fill} />
      ))}
    </AG>
  );
}
/** Mount only while a real request is pending. Never impose a minimum wait. */
export function BrandLoader({
  size = 48,
  label = "Loading",
  active = true,
}: {
  size?: number;
  label?: string;
  active?: boolean;
}) {
  const phase = useSharedValue(0);
  const [reduced, setReduced] = useState(true);
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (live) setReduced(v);
      })
      .catch(() => {});
    const motion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    const state = AppState.addEventListener("change", (s) =>
      setForeground(s === "active"),
    );
    return () => {
      live = false;
      motion.remove();
      state.remove();
    };
  }, []);
  const still = reduced || !foreground || !active;
  useEffect(() => {
    if (!still)
      phase.set(
        withRepeat(
          withTiming(phase.get() + 1, {
            duration: 2200,
            easing: Easing.linear,
            reduceMotion: ReduceMotion.Never,
          }),
          -1,
          false,
        ),
      );
    return () => cancelAnimation(phase);
  }, [phase, still]);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: active }}
      style={{ width: size, height: size }}
    >
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden
      >
        <Svg width={size} height={size} viewBox="0 0 418 420">
          {sectors.map((_, i) => (
            <Sector key={i} index={i} phase={phase} still={still} />
          ))}
        </Svg>
      </View>
    </View>
  );
}
