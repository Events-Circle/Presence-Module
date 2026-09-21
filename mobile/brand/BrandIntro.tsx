import React, { useEffect, useId, useRef, useState } from "react";
import {
  AccessibilityInfo,
  AppState,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { symbolPaths, fullPaths } from "./artwork";
import { brushStrokes } from "./brushStrokes";
import { presence as P } from "../design/tokens";
const APath = Animated.createAnimatedComponent(Path),
  AG = Animated.createAnimatedComponent(G);
export const INTRO = {
  draw: 750,
  fillAt: 550,
  fill: 250,
  moveAt: 700,
  move: 300,
  eventsAt: 1000,
  letter: 110,
  circleAt: 1800,
  holdUntil: 2700,
  end: 2900,
};
let completedThisLaunch = false;
export const introAlreadyCompleted = () => completedThisLaunch;
const clamp = (n: number) => {
  "worklet";
  return Math.max(0, Math.min(1, n));
};
const smooth = (n: number) => {
  "worklet";
  const p = clamp(n);
  return p * p * (3 - 2 * p);
};
function Dot({
  item,
  time,
}: {
  item: (typeof symbolPaths)[number];
  time: SharedValue<number>;
}) {
  const props = useAnimatedProps(() => {
    const draw = smooth((time.get() - item.start * 0.7) / 295),
      fill = smooth((time.get() - INTRO.fillAt) / INTRO.fill);
    return {
      strokeDashoffset: item.length * (1 - draw),
      strokeOpacity: time.get() < item.start ? 0 : 1 - fill,
      fillOpacity: fill,
    };
  });
  return (
    <APath
      d={item.d}
      fill={item.fill}
      stroke={item.fill}
      strokeWidth={0.7}
      strokeDasharray={[item.length, item.length]}
      animatedProps={props}
    />
  );
}
// Boundaries follow the joins of the connected source path; not equal-width slices.
const cuts = [
  [
    [440, 0],
    [440, 126],
    [451, 133],
    [441, 146],
    [430, 172],
    [430, 420],
  ],
  [
    [492, 0],
    [492, 138],
    [499, 145],
    [492, 161],
    [492, 420],
  ],
  [
    [549, 0],
    [549, 129],
    [540, 153],
    [538, 173],
    [538, 420],
  ],
  [
    [615, 0],
    [615, 145],
    [619, 160],
    [619, 420],
  ],
];
const polygon = (left: number[][], right: number[][]) =>
  "M" +
  [...left, ...[...right].reverse()].map((p) => p.join(" ")).join("L") +
  "Z";
const borders = [
  [
    [0, 0],
    [0, 420],
  ],
  ...cuts,
  [
    [1085, 0],
    [1085, 420],
  ],
];
type BrushStroke = {
  d: string;
  length: number;
  offset: number;
  portion: number;
};
function BrushTrace({
  stroke,
  time,
  at,
  duration,
  width,
  color,
  order,
  count,
}: {
  stroke: BrushStroke;
  time: SharedValue<number>;
  at: number;
  duration: number;
  width: number;
  color: string;
  order: number;
  count: number;
}) {
  // Blend distance weighting with equal pen-lift time so short serifs cannot flash in one frame.
  const offset = (stroke.offset + order / count) / 2;
  const portion = (stroke.portion + 1 / count) / 2;
  const props = useAnimatedProps(() => {
    const p = clamp(
      (time.get() - at - duration * offset) / (duration * portion),
    );
    return { strokeDashoffset: stroke.length * (1 - p), opacity: clamp(p * 6) };
  });
  return (
    <APath
      d={stroke.d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={[stroke.length, stroke.length]}
      animatedProps={props}
    />
  );
}
function PaintedPath({
  pathIndex,
  index,
  time,
  prefix,
}: {
  pathIndex: number;
  index: number;
  time: SharedValue<number>;
  prefix: string;
}) {
  const brush = brushStrokes[index]!;
  const source = fullPaths[pathIndex]!;
  const at =
    index < 6
      ? INTRO.eventsAt + index * INTRO.letter
      : INTRO.circleAt + (index - 6) * 95;
  const duration = index < 6 ? 240 : 280;
  return (
    <G clipPath={`url(#${prefix}-source-${pathIndex})`}>
      {brush.strokes.map((stroke, i) => (
        <BrushTrace
          key={i}
          stroke={stroke}
          time={time}
          at={at}
          duration={duration}
          width={brush.width}
          color={source.fill}
          order={i}
          count={brush.strokes.length}
        />
      ))}
    </G>
  );
}
function Composition({ time }: { time: SharedValue<number> }) {
  const prefix = "brand" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const dots = useAnimatedProps(() => ({
    opacity: smooth((time.get() - 850) / 150),
  }));
  // Add the exact finished contours gently; never switch off the painted layers.
  const complete = useAnimatedProps(() => ({
    opacity: smooth((time.get() - 2560) / 100),
  }));
  return (
    <>
      <Defs>
        {fullPaths.slice(0, 10).map((p, i) => (
          <ClipPath id={`${prefix}-source-${i}`} key={i}>
            <Path d={p.d} />
          </ClipPath>
        ))}
        {borders.slice(0, -1).map((left, i) => (
          <ClipPath id={`${prefix}-letter-${i}`} key={i}>
            <Path d={polygon(left, borders[i + 1]!)} />
          </ClipPath>
        ))}
      </Defs>
      <AG animatedProps={dots}>
        {fullPaths.slice(10).map((p, i) => (
          <Path key={i} {...p} />
        ))}
      </AG>
      {[0, 1, 2, 3, 4].map((i) => (
        <G key={i} clipPath={`url(#${prefix}-letter-${i})`}>
          <PaintedPath pathIndex={1} index={i} time={time} prefix={prefix} />
        </G>
      ))}
      {[8, 2].map((i) => (
        <PaintedPath
          key={i}
          pathIndex={i}
          index={4}
          time={time}
          prefix={prefix}
        />
      ))}
      <PaintedPath pathIndex={9} index={5} time={time} prefix={prefix} />
      {[4, 7, 0, 5, 6, 3].map((p, i) => (
        <PaintedPath
          key={p}
          pathIndex={p}
          index={i + 6}
          time={time}
          prefix={prefix}
        />
      ))}
      <AG animatedProps={complete}>
        {fullPaths.slice(0, 10).map((p, i) => (
          <Path key={i} {...p} />
        ))}
      </AG>
    </>
  );
}
function IntroArtwork({ onComplete }: { onComplete: () => void }) {
  const { width, height } = useWindowDimensions();
  const [preference, setPreference] = useState<boolean | null>(null);
  const time = useSharedValue(0);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const done = useRef(false);
  useEffect(() => {
    let live = true;
    const update = (value: boolean) => {
      if (live) setPreference(value);
    };
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(update)
      .catch(() => update(true));
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      update,
    );
    return () => {
      live = false;
      listener.remove();
    };
  }, []);
  useEffect(() => {
    let live = true;
    const finish = () => {
      if (!live || done.current) return;
      done.current = true;
      completedThisLaunch = true;
      callback.current();
    };
    const watchdog = setTimeout(finish, 4500);
    const state = AppState.addEventListener("change", (s) => {
      if (s !== "active") finish();
    });
    if (preference !== null) {
      time.set(preference ? INTRO.holdUntil : 0);
      time.set(
        withTiming(
          INTRO.end,
          {
            duration: preference ? 230 : INTRO.end,
            easing: Easing.linear,
            reduceMotion: ReduceMotion.Never,
          },
          (finished) => {
            if (finished) runOnJS(finish)();
          },
        ),
      );
    }
    return () => {
      live = false;
      clearTimeout(watchdog);
      state.remove();
      cancelAnimation(time);
    };
  }, [preference, time]);
  const fullWidth = Math.min(width - 48, 560),
    scale = fullWidth / 1085,
    fullHeight = 420 * scale;
  const startSize = Math.min(width * 0.58, 250),
    startScale = startSize / 418;
  const finalX = (width - fullWidth) / 2,
    finalY = (height - fullHeight) / 2;
  const symbol = useAnimatedStyle(() => {
    const raw = clamp((time.get() - INTRO.moveAt) / INTRO.move),
      p = raw * raw * (3 - 2 * raw);
    return {
      transform: [
        { translateX: (finalX + 209 * scale - width / 2) * p },
        { translateY: 0 },
        { scale: startScale + (scale - startScale) * p },
      ],
      opacity: 1 - clamp((time.get() - 850) / 150),
    };
  });
  const fade = useAnimatedStyle(() => ({
    opacity:
      1 -
      smooth((time.get() - INTRO.holdUntil) / (INTRO.end - INTRO.holdUntil)),
  }));
  return (
    <View
      accessibilityLabel="Events Circle"
      accessibilityRole="image"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: P.color.bg, zIndex: 100 },
      ]}
    >
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden
        style={[StyleSheet.absoluteFill, fade]}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              width: 418,
              height: 420,
              left: (width - 418) / 2,
              top: (height - 420) / 2,
            },
            symbol,
          ]}
        >
          <Svg width={418} height={420}>
            {symbolPaths.map((item, i) => (
              <Dot key={i} item={item} time={time} />
            ))}
          </Svg>
        </Animated.View>
        <Svg width={width} height={height}>
          <G transform={`translate(${finalX} ${finalY}) scale(${scale})`}>
            <Composition time={time} />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

export class BrandIntro extends React.Component<
  { onComplete: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    completedThisLaunch = true;
    this.props.onComplete();
  }
  render() {
    return this.state.failed ? null : (
      <IntroArtwork onComplete={this.props.onComplete} />
    );
  }
}
