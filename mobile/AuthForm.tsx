import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "./ui";

type Props = {
  register: boolean;
  busy: boolean;
  initializing?: boolean;
  error: string;
  name: string;
  email: string;
  password: string;
  setName: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  onBack: () => void;
  onSwitch: () => void;
  onSubmit: () => void;
};
export function AuthForm(p: Props) {
  const inputs = useRef<
    Partial<Record<"name" | "email" | "password", TextInput | null>>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = () => {
    const next: Record<string, string> = {};
    if (p.register && !p.name.trim()) next.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim()))
      next.email = "Enter a valid email address.";
    if (!p.password) next.password = "Enter your password.";
    else if (p.register && (p.password.length < 12 || p.password.length > 128))
      next.password = "Use 12–128 characters.";
    setErrors(next);
    const first = (["name", "email", "password"] as const).find(
      (key) => next[key],
    );
    if (first) inputs.current[first]?.focus();
    else p.onSubmit();
  };
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState("");
  const disabled =
    p.busy ||
    p.initializing ||
    !p.email.trim() ||
    !p.password ||
    (p.register && !p.name.trim());
  const field = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    kind: "name" | "email" | "password",
  ) => (
    <View style={{ gap: 6 }}>
      <View
        style={[
          s.field,
          focused === kind && s.focused,
          !!errors[kind] && { borderColor: "#B42318" },
        ]}
      >
        <Text style={s.label}>{label} *</Text>
        <TextInput
          ref={(input) => {
            inputs.current[kind] = input;
          }}
          aria-invalid={!!errors[kind]}
          accessibilityLabel={label}
          aria-required
          accessibilityHint={
            kind === "password" && p.register
              ? "Use 12 to 128 characters. You can show or hide your password."
              : "Required"
          }
          value={value}
          onChangeText={(value) => {
            onChange(value);
            setErrors((current) => ({ ...current, [kind]: "" }));
          }}
          editable={!p.busy}
          onFocus={() => setFocused(kind)}
          onBlur={() => setFocused("")}
          secureTextEntry={kind === "password" && !visible}
          keyboardType={kind === "email" ? "email-address" : "default"}
          autoCapitalize={kind === "name" ? "words" : "none"}
          autoCorrect={false}
          autoComplete={
            kind === "name"
              ? "name"
              : kind === "email"
                ? "email"
                : p.register
                  ? "new-password"
                  : "current-password"
          }
          placeholder={
            kind === "name"
              ? "Your name"
              : kind === "email"
                ? "you@example.com"
                : "Enter your password"
          }
          placeholderTextColor="#8993A4"
          style={[s.input, kind === "password" && { paddingRight: 52 }]}
          returnKeyType={kind === "password" ? "go" : "next"}
          onSubmitEditing={
            kind === "name"
              ? () => inputs.current.email?.focus()
              : kind === "email"
                ? () => inputs.current.password?.focus()
                : !p.busy
                  ? submit
                  : undefined
          }
        />
        {kind === "password" && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            onPress={() => setVisible(!visible)}
            style={s.eye}
          >
            <Icon
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={21}
              color="#596A85"
            />
          </Pressable>
        )}
      </View>
      {!!errors[kind] && (
        <Text accessibilityRole="alert" style={[s.error, { marginTop: 0 }]}>
          {errors[kind]}
        </Text>
      )}
    </View>
  );
  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={s.canvas}>
          <View style={s.art}>
            <Image
              source={require("../assets/welcome-blue-folds.png")}
              style={s.image}
              resizeMode="cover"
              accessible={false}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to welcome"
              disabled={p.busy}
              onPress={p.onBack}
              style={s.back}
            >
              <Icon name="arrow-back" color="#142B55" />
            </Pressable>
          </View>
          <View style={s.panel}>
            <Text accessibilityRole="header" style={s.title}>
              {p.register ? "Create your account" : "Welcome back"}
            </Text>
            <Text style={s.description}>
              {p.register
                ? "One account for the Events Circle ecosystem."
                : "Sign in to manage your business presence."}
            </Text>
            <Text style={s.note}>All fields are required.</Text>
            <View style={s.fields}>
              {p.register && field("Your name", p.name, p.setName, "name")}
              {field("Email address", p.email, p.setEmail, "email")}
              {field(
                p.register ? "Password · 12–128 characters" : "Password",
                p.password,
                p.setPassword,
                "password",
              )}
            </View>
            {p.register && (
              <Text style={s.note}>
                Use 12–128 characters for your password. Spaces are allowed.
              </Text>
            )}
            {p.initializing && (
              <Text accessibilityLiveRegion="polite" style={s.note}>
                Checking your saved session…
              </Text>
            )}
            {disabled && !p.busy && !p.initializing && (
              <Text style={s.note}>Complete the fields above to continue.</Text>
            )}
            {!!p.error && (
              <Text accessibilityRole="alert" style={s.error}>
                {p.error}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                p.busy
                  ? "Connecting…"
                  : p.register
                    ? "Create account"
                    : "Sign in"
              }
              accessibilityState={{ disabled, busy: p.busy }}
              disabled={disabled}
              onPress={submit}
              style={({ pressed }) => [
                s.submit,
                { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
              ]}
            >
              <LinearGradient
                colors={["#1947ED", "#2636CE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.gradient}
              >
                {p.busy ? <ActivityIndicator color="#FFFFFF" /> : null}
                <Text style={s.submitText}>
                  {p.busy
                    ? "Connecting…"
                    : p.register
                      ? "Create account"
                      : "Sign in"}
                </Text>
                {!p.busy && (
                  <Icon name="arrow-forward" color="#FFFFFF" size={20} />
                )}
              </LinearGradient>
            </Pressable>
            <View style={s.footer}>
              <Pressable
                accessibilityRole="button"
                disabled={p.busy}
                onPress={() => {
                  setVisible(false);
                  setErrors({});
                  p.onSwitch();
                }}
                style={s.switch}
              >
                <Text style={s.switchText}>
                  {p.register ? "Already have an account? " : "New here? "}
                  <Text style={s.link}>
                    {p.register ? "Sign in" : "Create an account"}
                  </Text>
                </Text>
              </Pressable>
              <Text style={s.note}>Events Circle · Staging preview</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#D6E7EE" },
  scroll: { flexGrow: 1, alignItems: "center" },
  canvas: { flexGrow: 1, width: "100%", maxWidth: 480 },
  art: { height: 230, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  back: {
    position: "absolute",
    top: 16,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F9FD",
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    flexGrow: 1,
    marginTop: -30,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 26,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    color: "#193AD0",
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.7,
  },
  description: {
    color: "#65728A",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 32,
  },
  fields: { gap: 24 },
  field: {
    borderWidth: 1,
    borderColor: "#BAC5D4",
    borderRadius: 13,
    position: "relative",
  },
  focused: { borderColor: "#235AFF", backgroundColor: "#FAFCFF" },
  label: {
    position: "absolute",
    top: -9,
    left: 12,
    paddingHorizontal: 5,
    backgroundColor: "#FFFFFF",
    color: "#42516B",
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: "#172847",
    fontSize: 15,
  },
  eye: {
    position: "absolute",
    right: 4,
    top: 6,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: "#AA2944", fontSize: 13, lineHeight: 20, marginTop: 20 },
  submit: { borderRadius: 13, overflow: "hidden", marginTop: 28 },
  gradient: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 14,
  },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  footer: { marginTop: "auto", paddingTop: 32 },
  switch: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  switchText: {
    color: "#66738A",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },
  link: { color: "#193AD0", fontWeight: "600" },
  note: { color: "#7C8799", fontSize: 11, textAlign: "center", marginTop: 8 },
});
