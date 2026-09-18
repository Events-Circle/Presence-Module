import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Circle,
} from "react-native-svg";
import { Icon } from "./ui";

const slides = [
  {
    title: "Events\nCircle\nPresence.",
    description: "Your work deserves to be seen.",
  },
  {
    title: "Your work.\nBeautifully\npresented.",
    description: "A home for your business and portfolio.",
  },
  {
    title: "Be seen.\nMake new\nconnections.",
    description: "Turn your presence into possibility.",
  },
];

function Artwork({ ribbon = false }: { ribbon?: boolean }) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={ribbon ? "0 0 400 230" : "0 0 400 300"}
      preserveAspectRatio="xMidYMid slice"
      accessible={false}
    >
      <Defs>
        <LinearGradient id="blue" x1="0%" y1="0%" x2="95%" y2="100%">
          <Stop offset="0" stopColor="#102D94" />
          <Stop offset=".36" stopColor="#426AE5" />
          <Stop offset=".7" stopColor="#8CE5F8" />
          <Stop offset="1" stopColor="#E3FAFF" />
        </LinearGradient>
        <LinearGradient id="cyan" x1="0%" y1="0%" x2="100%" y2="90%">
          <Stop offset="0" stopColor="#B3F9FF" />
          <Stop offset=".45" stopColor="#62D3EF" />
          <Stop offset="1" stopColor="#5D7BDD" />
        </LinearGradient>
        <LinearGradient id="ribbon" x1="0%" y1="30%" x2="100%" y2="70%">
          <Stop offset="0" stopColor="#3C54BB" />
          <Stop offset=".5" stopColor="#6385E8" />
          <Stop offset="1" stopColor="#A5C6FF" />
        </LinearGradient>
      </Defs>
      {ribbon ? (
        <>
          <Path
            d="M40 175 C105 212 173 101 242 139 S340 207 430 215 L430 54 C277 71 164 233 40 175"
            fill="#536C7A"
            opacity=".12"
            transform="translate(0 13)"
          />
          <Path
            d="M43 162 C17 130 49 81 115 102 C155 114 178 130 204 123 C127 166 70 197 43 162"
            fill="url(#cyan)"
            stroke="#64C5DE"
            strokeWidth="1.5"
          />
          <Path
            d="M40 160 C105 198 215 48 407 0 L420 202 C291 174 233 100 182 128 C121 161 70 194 40 160"
            fill="url(#ribbon)"
          />
          <Path
            d="M40 160 C105 198 215 48 407 0"
            fill="none"
            stroke="#4966D1"
            strokeWidth="5"
          />
          <Path
            d="M45 160 C112 191 217 48 407 4"
            fill="none"
            stroke="#A8C4FF"
            strokeWidth="1.7"
          />
        </>
      ) : (
        <>
          <Path
            d="M-30 -60 L450 -60 L440 80 C338 163 244 282 141 257 C58 238 2 151 -30 52 Z"
            fill="#536C7A"
            opacity=".14"
            transform="translate(0 15)"
          />
          <Path
            d="M-30 -60 L450 -60 L440 70 C338 150 244 271 141 247 C58 228 2 141 -30 42 Z"
            fill="url(#blue)"
          />
          <Path
            d="M24 -45 C35 60 65 152 145 163 C233 174 326 51 390 -30"
            fill="url(#cyan)"
            stroke="#AFF2FF"
            strokeWidth="1"
          />
          <Path
            d="M65 -44 C90 41 132 90 187 76 C245 60 271 3 284 -40"
            fill="url(#blue)"
            stroke="#B5EFFF"
            strokeWidth="1"
          />
          <Path
            d="M5 25 C33 129 74 219 145 233 C229 254 339 130 402 89"
            fill="none"
            stroke="#C1E7FF"
            strokeOpacity=".35"
          />
        </>
      )}
    </Svg>
  );
}

export function WelcomeScreen({
  onEmail,
  onLogin,
  error,
}: {
  onEmail: () => void;
  onLogin: () => void;
  error: string;
}) {
  const [slide, setSlide] = useState(0);
  const { height } = useWindowDimensions();
  const current = slides[slide] ?? slides[0]!;
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      bounces={false}
    >
      <View style={[styles.canvas, { minHeight: Math.max(700, height - 60) }]}>
        <View pointerEvents="none" style={styles.topArt}>
          <Artwork />
        </View>
        <View style={styles.brand}>
          <Svg width={38} height={38} viewBox="0 0 40 40" accessible={false}>
            <Path
              d="M11 4 H29 L38 20 L29 36 H11 L2 20 Z"
              fill="none"
              stroke="#111B29"
              strokeWidth="2.5"
            />
            <Circle cx="20" cy="20" r="10" fill="#111B29" />
          </Svg>
          <Text accessibilityRole="header" style={styles.title}>
            {current.title}
          </Text>
          <Text style={styles.description}>{current.description}</Text>
        </View>
        <View pointerEvents="none" style={styles.ribbon}>
          <Artwork ribbon />
        </View>
        <View style={styles.actions}>
          <View style={styles.dots}>
            {slides.map((item, index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={`Introduction ${index + 1}: ${item.description}`}
                accessibilityState={{ selected: slide === index }}
                onPress={() => setSlide(index)}
                style={styles.dotTarget}
              >
                <View
                  style={[styles.dot, slide === index && styles.activeDot]}
                />
              </Pressable>
            ))}
          </View>
          <Text style={styles.prompt}>Don’t have an account?</Text>
          <View style={styles.socialRow}>
            <View
              accessibilityLabel="Facebook sign-up, coming soon"
              style={styles.social}
            >
              <Icon name="logo-facebook" color="#1877F2" size={22} />
              <Text style={styles.socialText}>Facebook</Text>
            </View>
            <View
              accessibilityLabel="Google sign-up, coming soon"
              style={styles.social}
            >
              <Icon name="logo-google" color="#4285F4" size={20} />
              <Text style={styles.socialText}>Google</Text>
            </View>
          </View>
          <Text style={styles.unavailable}>
            Google & Facebook sign-up coming soon
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign up with email"
            onPress={onEmail}
            style={({ pressed }) => [styles.email, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.emailText}>Sign up with email</Text>
            <Icon name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Login"
            onPress={onLogin}
            style={styles.login}
          >
            <Text style={styles.loginText}>
              Already a member? <Text style={styles.link}>Login</Text>
            </Text>
          </Pressable>
          {!!error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#D6E7EE" },
  scroll: { flexGrow: 1, alignItems: "center" },
  canvas: {
    width: "100%",
    maxWidth: 480,
    overflow: "hidden",
    backgroundColor: "#D6E7EE",
  },
  topArt: {
    position: "absolute",
    top: -48,
    left: -15,
    right: -15,
    height: 320,
  },
  brand: {
    marginTop: 278,
    paddingHorizontal: 40,
    zIndex: 1,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1.2,
    fontWeight: "700",
    color: "#101921",
    marginTop: 16,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: "#3E5360",
    marginTop: 12,
    maxWidth: 220,
  },
  ribbon: { position: "absolute", left: 0, right: -50, top: 360, height: 235 },
  actions: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingTop: 42,
    paddingBottom: 12,
    zIndex: 2,
  },
  dots: { flexDirection: "row", justifyContent: "center", marginBottom: 12 },
  dotTarget: {
    width: 32,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#A7BCE3" },
  activeDot: {
    backgroundColor: "#557BE5",
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  prompt: {
    fontSize: 13,
    color: "#28343E",
    textAlign: "center",
    marginBottom: 14,
  },
  socialRow: { flexDirection: "row", gap: 12 },
  social: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 46,
    borderRadius: 7,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 2,
    borderColor: "#BACCD7",
  },
  socialText: { fontSize: 13, color: "#333A48" },
  unavailable: {
    color: "#536674",
    fontSize: 10,
    textAlign: "center",
    marginVertical: 8,
  },
  email: {
    minHeight: 50,
    backgroundColor: "#292739",
    borderColor: "#171626",
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emailText: { fontSize: 14, fontWeight: "500", color: "#FFFFFF" },
  login: { minHeight: 48, justifyContent: "center", alignItems: "center" },
  loginText: { fontSize: 13, color: "#34414B" },
  link: { color: "#365CBD", fontWeight: "600" },
  error: { color: "#9D2838", fontSize: 13, textAlign: "center" },
});
