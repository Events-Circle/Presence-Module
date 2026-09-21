import React, { memo, useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { presence as P } from "./tokens";
import { usePresenceMotion } from "./Motion";
const examples = [
  { label: "Venues", title: "Spaces to celebrate", kind: 0, tint: "#E8DBC7" },
  { label: "Suppliers", title: "Creative details", kind: 1, tint: "#C7E4DC" },
  { label: "Listings", title: "Made for the moment", kind: 2, tint: "#CEDAF2" },
  { label: "Events", title: "Moments together", kind: 3, tint: "#CFDBEC" },
  {
    label: "Suppliers",
    title: "A different perspective",
    kind: 4,
    tint: "#D8E5EF",
  },
  {
    label: "Listings",
    title: "Thoughtfully arranged",
    kind: 5,
    tint: "#F0E3D5",
  },
] as const;
// Original vector scenes over the existing approved blue artwork; these are not real suppliers.
const Scene = memo(function Scene({ kind }: { kind: number }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 160 140">
      {kind === 0 && (
        <>
          <Path d="M0 140V48L80 5L160 48V140" fill="#EEE3D1" />
          <Path d="M39 140V69A41 41 0 0 1 121 69V140" fill="#8CAFB9" />
          <Path d="M53 140V72A27 27 0 0 1 107 72V140" fill="#D7EBEC" />
          <Path d="M80 46V140M53 85H107" stroke="#FDF9F0" strokeWidth="3" />
          <Ellipse cx="80" cy="131" rx="64" ry="10" fill="#CBB99C" />
          <Path
            d="M10 122L17 86L24 122M135 122L144 76L152 122"
            fill="#668C7B"
          />
        </>
      )}
      {kind === 1 && (
        <>
          <Ellipse
            cx="80"
            cy="132"
            rx="54"
            ry="7"
            fill="#75A699"
            opacity="0.3"
          />
          <Path d="M67 80L63 128Q80 139 97 128L93 80" fill="#F7F0E3" />
          <Path
            d="M80 95L43 41M80 98L119 42M80 101V24M78 84L31 72M84 81L129 72"
            stroke="#447664"
            strokeWidth="3"
          />
          {[
            [42, 40],
            [116, 42],
            [80, 26],
            [31, 70],
            [128, 70],
            [63, 57],
            [96, 62],
          ].map(([x, y], i) => (
            <React.Fragment key={i}>
              <Circle
                cx={x}
                cy={y}
                r="15"
                fill={i % 2 ? "#F3D9C4" : "#FFF5E8"}
              />
              <Circle cx={x} cy={y} r="5" fill="#D4AD80" />
            </React.Fragment>
          ))}
        </>
      )}
      {kind === 2 && (
        <>
          <Ellipse
            cx="80"
            cy="124"
            rx="69"
            ry="9"
            fill="#849ABF"
            opacity="0.3"
          />
          <Rect x="35" y="94" width="90" height="22" rx="5" fill="#FDF9F1" />
          <Rect x="48" y="64" width="64" height="30" rx="5" fill="#FDF9F1" />
          <Rect x="62" y="39" width="36" height="25" rx="5" fill="#FDF9F1" />
          <Path
            d="M35 101H125M48 73H112M62 46H98"
            stroke="#C7AD7C"
            strokeWidth="3"
          />
          <Path d="M80 39V22" stroke="#AA8855" strokeWidth="2" />
          <Circle cx="80" cy="20" r="5" fill="#DEC08D" />
        </>
      )}
      {kind === 3 && (
        <>
          <Path d="M0 0H160V140H0Z" fill="#21385A" />
          <Path
            d="M0 12Q80 58 160 12M0 42Q80 82 160 42"
            fill="none"
            stroke="#D1B77F"
            strokeWidth="2"
          />
          {[15, 42, 70, 98, 125, 149].map((x, i) => (
            <Circle
              key={x}
              cx={x}
              cy={i < 3 ? 20 + i * 7 : 41 - (i - 3) * 7}
              r="4"
              fill="#F4D9A2"
            />
          ))}
          <Ellipse cx="80" cy="107" rx="61" ry="23" fill="#DCE7E8" />
          <Ellipse cx="80" cy="105" rx="49" ry="17" fill="#F6EFE0" />
          <Path d="M80 100V75" stroke="#6D8B6B" strokeWidth="3" />
          <Circle cx="80" cy="73" r="10" fill="#D9B6A0" />
        </>
      )}
      {kind === 4 && (
        <>
          <Ellipse
            cx="83"
            cy="126"
            rx="60"
            ry="8"
            fill="#789AAE"
            opacity="0.3"
          />
          <Rect x="23" y="46" width="114" height="68" rx="12" fill="#2B4160" />
          <Rect x="45" y="34" width="39" height="19" rx="6" fill="#2B4160" />
          <Circle cx="82" cy="81" r="28" fill="#98B2C6" />
          <Circle cx="82" cy="81" r="21" fill="#162A43" />
          <Circle cx="82" cy="81" r="12" fill="#54859D" />
          <Circle cx="75" cy="74" r="5" fill="#E0EFF4" opacity="0.8" />
          <Rect x="117" y="56" width="11" height="7" rx="2" fill="#F1DFC0" />
        </>
      )}
      {kind === 5 && (
        <>
          <Ellipse
            cx="80"
            cy="120"
            rx="71"
            ry="14"
            fill="#C6B5A1"
            opacity="0.4"
          />
          <Ellipse cx="80" cy="103" rx="65" ry="28" fill="#F9F5EE" />
          <Ellipse cx="80" cy="101" rx="46" ry="20" fill="#C8DCD7" />
          <Ellipse cx="80" cy="101" rx="31" ry="14" fill="#F9F5EE" />
          <Path
            d="M27 74V118M21 74V88H33V74M137 74V118"
            fill="none"
            stroke="#AE8C55"
            strokeWidth="3"
          />
          <Path
            d="M80 89V49M80 73L61 57M80 70L100 52"
            stroke="#739785"
            strokeWidth="2"
          />
          <Ellipse cx="63" cy="56" rx="13" ry="6" fill="#739785" />
          <Ellipse cx="98" cy="53" rx="13" ry="6" fill="#739785" />
        </>
      )}
    </Svg>
  );
});
const PreviewCard = memo(function PreviewCard({
  index,
  width,
}: {
  index: number;
  width: number;
}) {
  const item = examples[index % examples.length]!;
  const [failed, setFailed] = useState(false);
  return (
    <View style={[s.card, { width }]}>
      <View
        style={[s.image, { height: width * 0.96, backgroundColor: item.tint }]}
      >
        {!failed && (
          <Image
            source={require("../../assets/welcome-blue-folds.png")}
            style={[StyleSheet.absoluteFill, { opacity: 0.14 }]}
            resizeMode="cover"
            onError={() => setFailed(true)}
           
          />
        )}
        <Scene kind={item.kind} />
      </View>
      <View style={s.caption}>
        <Text allowFontScaling={false} style={s.category}>
          {item.label}
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={s.captionText}>
          {item.title}
        </Text>
        <View style={s.detail} />
      </View>
    </View>
  );
});
function Column({
  index,
  width,
  height,
}: {
  index: number;
  width: number;
  height: number;
}) {
  const { active, reduced, ready } = usePresenceMotion();
  const phase = useSharedValue(index * 0.17);
  const [period, setPeriod] = useState(0);
  const copies = period > 0 ? Math.ceil(height / period) + 1 : 2;
  useEffect(() => {
    cancelAnimation(phase);
    if (period && ready && active && !reduced) {
      const start = phase.get();
      phase.set(
        withRepeat(
          withTiming(start + 1, {
            duration: P.motion.columns[index]!,
            easing: Easing.linear,
            reduceMotion: ReduceMotion.System,
          }),
          -1,
          false,
        ),
      );
    }
    return () => cancelAnimation(phase);
  }, [active, reduced, ready, period, index, phase]);
  const animated = useAnimatedStyle(() => {
    const part = phase.get() % 1;
    return {
      transform: [
        { translateY: index === 1 ? (part - 1) * period : -part * period },
      ],
    };
  });
  return (
    <View style={{ width, height, overflow: "hidden" }}>
      <Animated.View testID={`collage-column-${index}`} style={animated}>
        {Array.from({ length: copies }, (_, copy) => (
          <View
            key={copy}
            onLayout={
              copy === 0
                ? (event) => {
                    const measured = event.nativeEvent.layout.height;
                    setPeriod((old) =>
                      Math.abs(old - measured) > 0.5 ? measured : old,
                    );
                  }
                : undefined
            }
          >
            {[0, 1, 2].map((row) => (
              <View key={row} style={{ paddingBottom: P.space.md }}>
                <PreviewCard width={width} index={index * 2 + row} />
              </View>
            ))}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}
export function PresenceCollage({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  // Inverse-rotated clipping rectangle bounds, plus overscan: every corner stays covered.
  const radians = (Math.abs(P.motion.tilt) * Math.PI) / 180;
  const coverWidth = Math.ceil(
    width * Math.cos(radians) + height * Math.sin(radians) + 48,
  );
  const coverHeight = Math.ceil(
    height * Math.cos(radians) + width * Math.sin(radians) + 48,
  );
  const columnWidth = (coverWidth - 2 * P.space.md) / 3;
  return (
    <View
      testID="presence-collage"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={{ height, overflow: "hidden", backgroundColor: P.color.mist }}
    >
      <View
        style={{
          position: "absolute",
          width: coverWidth,
          height: coverHeight,
          left: (width - coverWidth) / 2,
          top: (height - coverHeight) / 2,
          flexDirection: "row",
          gap: P.space.md,
          transform: [{ rotate: `${P.motion.tilt}deg` }],
        }}
      >
        {[0, 1, 2].map((index) => (
          <Column
            key={index}
            index={index}
            width={columnWidth}
            height={coverHeight}
          />
        ))}
      </View>
      <LinearGradient
        colors={["#F5F8FE00", P.color.bg]}
        locations={[0, 1]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: Math.min(120, height * 0.5),
        }}
      />
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: P.color.paper,
    borderRadius: P.radius.card,
    padding: 5,
    ...P.shadow,
  },
  image: { borderRadius: 14, overflow: "hidden" },
  caption: { padding: 8, gap: 4 },
  category: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: P.color.turquoise,
    textTransform: "uppercase",
  },
  captionText: { fontSize: 11, fontWeight: "600", color: P.color.ink },
  detail: {
    height: 3,
    width: 30,
    borderRadius: 2,
    backgroundColor: P.color.champagne,
  },
});
