import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { Icon } from "./ui";
import { WelcomeRoot, WelcomeButton } from "./WelcomeUI";
import { PresenceMotion, PresenceEntrance } from "./design/Motion";
import { PresenceCollage } from "./design/PresenceCollage";
import { presence as P } from "./design/tokens";
export function WelcomeScreen({
  entranceEnabled = true,
  onEmail,
  onLogin,
  error,
}: {
  entranceEnabled?: boolean;
  onEmail: () => void;
  onLogin: () => void;
  error: string;
}) {
  const {
    width: windowWidth,
    height: windowHeight,
    fontScale,
  } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [layout, setLayout] = useState({
    width: windowWidth,
    height: windowHeight - insets.top - insets.bottom,
  });
  const width = Math.min(layout.width, 480);
  const compact = layout.height < 650 || fontScale > 1.25;
  const artHeight = compact
    ? Math.max(120, Math.min(210, layout.height * 0.28))
    : Math.min(420, layout.height * 0.46);
  return (
    <PresenceMotion enabled={entranceEnabled}>
      <WelcomeRoot>
        <View
          style={s.root}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setLayout((old) =>
              old.width === width && old.height === height
                ? old
                : { width, height },
            );
          }}
        >
          <ScrollView
            testID="landing-scroll"
            bounces={false}
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={[s.canvas, { minHeight: layout.height }]}>
              <PresenceEntrance order={0} translate={false}>
                <PresenceCollage width={width} height={artHeight} />
              </PresenceEntrance>
              <View style={s.brand}>
                <PresenceEntrance order={1}>
                  <View style={s.brandMark}>
                    <Svg width={30} height={30} viewBox="0 0 40 40">
                      <Path
                        d="M11 4 H29 L38 20 L29 36 H11 L2 20 Z"
                        fill="none"
                        stroke={P.color.ink}
                        strokeWidth="2.5"
                      />
                      <Circle cx="20" cy="20" r="10" fill={P.color.ink} />
                    </Svg>
                    <View style={s.champagneLine} />
                  </View>
                  <Text
                    accessibilityRole="header"
                    style={[
                      s.title,
                      {
                        fontSize: width < 350 ? 34 : P.type.title,
                        lineHeight: width < 350 ? 39 : P.type.titleLine,
                      },
                    ]}
                  >
                    {"Events Circle\nPresence."}
                  </Text>
                </PresenceEntrance>
                <PresenceEntrance order={2}>
                  <Text style={s.description}>
                    Your work deserves to be seen.
                  </Text>
                </PresenceEntrance>
              </View>
              <View
                style={{ flexGrow: 1, minHeight: P.space.xl, maxHeight: 48 }}
              />
              <PresenceEntrance order={3} style={s.actions}>
                <Text style={s.prompt}>Don’t have an account?</Text>
                <WelcomeButton
                  accessibilityLabel="Sign up with email"
                  onPress={onEmail}
                  style={s.email}
                >
                  <Text style={s.emailText}>Sign up with email</Text>
                  <Icon name="arrow-forward" size={21} color={P.color.paper} />
                </WelcomeButton>
                <WelcomeButton
                  accessibilityLabel="Continue with Google, coming soon"
                  disabled
                  style={s.google}
                >
                  <View style={s.googleLabel}>
                    <Icon name="logo-google" size={20} color={P.color.ink} />
                    <Text style={s.socialText}>Continue with Google</Text>
                  </View>
                  <Text style={s.unavailable}>Coming soon</Text>
                </WelcomeButton>
                <WelcomeButton
                  accessibilityLabel="Login"
                  variant="ghost"
                  onPress={onLogin}
                  style={s.login}
                >
                  <Text style={s.loginText}>
                    Already a member? <Text style={s.link}>Login</Text>
                  </Text>
                </WelcomeButton>
                {!!error && (
                  <Text accessibilityRole="alert" style={s.error}>
                    {error}
                  </Text>
                )}
              </PresenceEntrance>
            </View>
          </ScrollView>
        </View>
      </WelcomeRoot>
    </PresenceMotion>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.color.bg },
  scroll: { flexGrow: 1, alignItems: "center" },
  canvas: { width: "100%", maxWidth: 480 },
  brand: { paddingHorizontal: P.space.xl, paddingTop: P.space.sm },
  brandMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: P.space.md,
    marginBottom: P.space.md,
  },
  champagneLine: { width: 32, height: 2, backgroundColor: P.color.champagne },
  title: { fontWeight: "700", letterSpacing: -1.2, color: P.color.ink },
  description: {
    fontSize: P.type.body,
    lineHeight: P.type.bodyLine,
    color: P.color.body,
    marginTop: P.space.md,
  },
  actions: { paddingHorizontal: P.space.xl, paddingBottom: P.space.lg },
  prompt: {
    fontSize: 14,
    lineHeight: 21,
    color: P.color.body,
    marginBottom: P.space.md,
  },
  email: {
    minHeight: 56,
    paddingVertical: P.space.lg,
    paddingHorizontal: P.space.xl,
    borderRadius: P.radius.pill,
    backgroundColor: P.color.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: P.space.md,
  },
  emailText: {
    fontSize: P.type.label,
    lineHeight: 24,
    fontWeight: "600",
    color: P.color.paper,
    flexShrink: 1,
  },
  google: {
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: P.radius.pill,
    backgroundColor: P.color.paper,
    borderWidth: 1,
    borderColor: P.color.line,
    marginTop: P.space.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
    opacity: 1,
  },
  googleLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  socialText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    color: P.color.ink,
    flexShrink: 1,
  },
  unavailable: {
    fontSize: P.type.caption,
    lineHeight: 18,
    color: P.color.body,
  },
  login: {
    minHeight: 48,
    paddingVertical: P.space.md,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: 4,
  },
  loginText: {
    fontSize: 14,
    lineHeight: 22,
    color: P.color.body,
    flexShrink: 1,
  },
  link: { color: P.color.blue, fontWeight: "700" },
  error: {
    color: P.color.error,
    fontSize: 14,
    lineHeight: 21,
    marginTop: P.space.sm,
  },
});
