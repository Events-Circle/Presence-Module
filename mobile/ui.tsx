import { useFieldFocus } from "./FormFocus";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { authorization, origin } from "./service";
export const C = {
  ink: "#102249",
  muted: "#667797",
  blue: "#235AFF",
  line: "#E2E9F5",
  bg: "#F5F8FE",
  green: "#13845B",
};
export function Icon({
  name,
  size = 21,
  color = C.blue,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  selected,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  selected?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      aria-pressed={selected}
      accessibilityState={{
        disabled,
        ...(selected !== undefined ? { selected } : {}),
      }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        secondary ? s.secondary : s.primary,
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[s.buttonText, { color: secondary ? C.blue : "#fff" }]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Heading({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={s.heading}>
      <Text style={s.h2}>{title}</Text>
      {action && onPress && (
        <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}>
          <Text style={s.link}>{action} ›</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Field({
  label,
  value,
  onChange,
  secret = false,
  multiline = false,
  keyboard = "default",
  required = false,
  hint,
  maxLength,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  secret?: boolean;
  multiline?: boolean;
  keyboard?: "default" | "email-address" | "decimal-pad";
  required?: boolean;
  hint?: string;
  maxLength?: number;
  placeholder?: string;
  error?: string | undefined;
}) {
  const focus = useFieldFocus(error);
  return (
    <View style={{ gap: 7 }}>
      <Text style={s.label}>
        {label}
        {required && <Text style={{ color: "#6741CE" }}> *</Text>}
      </Text>
      {!!hint && <Text style={[s.body, { fontSize: 13 }]}>{hint}</Text>}
      <TextInput
        ref={focus.ref}
        onSubmitEditing={multiline ? undefined : focus.onSubmitEditing}
        returnKeyType={multiline ? "default" : "next"}
        aria-invalid={!!error}
        accessibilityLabel={label}
        accessibilityHint={hint}
        aria-required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secret}
        multiline={multiline}
        keyboardType={keyboard}
        autoCapitalize={
          keyboard === "email-address" || secret ? "none" : "sentences"
        }
        autoCorrect={!secret && keyboard !== "email-address"}
        style={[
          s.input,
          { backgroundColor: "#F8F9FC", borderRadius: 14 },
          !!error && { borderColor: "#B42318" },
          multiline && { minHeight: 105, textAlignVertical: "top" },
        ]}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      {!!maxLength && (
        <Text style={{ color: C.muted, fontSize: 12, alignSelf: "flex-end" }}>
          {value.length} / {maxLength}
        </Text>
      )}
    </View>
  );
}
export function Tag({ text }: { text: string }) {
  return <Text style={s.tag}>{text}</Text>;
}
export function Planned({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <Heading title={title} />
      <Card>
        <View style={s.row}>
          <Icon name="layers-outline" />
          <Tag text="Coming later" />
        </View>
        <Text style={s.body}>{description}</Text>
      </Card>
    </>
  );
}
export function Photo({
  id,
  org,
  height = 150,
  alt = "Business image",
}: {
  id?: string | null;
  org: string;
  height?: number;
  alt?: string;
}) {
  const [headers, setHeaders] = useState<Record<string, string>>();
  const [failed, setFailed] = useState(false);
  const [webUri, setWebUri] = useState<string>();
  useEffect(() => {
    let current = true;
    let objectUrl: string | undefined;
    const controller = new AbortController();
    setHeaders(undefined);
    setWebUri(undefined);
    setFailed(false);
    if (id)
      authorization()
        .then(async (value) => {
          const imageHeaders = {
            Authorization: value,
            "X-Organization-Id": org,
          };
          if (Platform.OS === "web") {
            const response = await fetch(
              `${origin}/api/v1/core/media/${id}/file`,
              {
                headers: imageHeaders,
                credentials: "omit",
                signal: controller.signal,
              },
            );
            if (!response.ok) throw new Error("Image unavailable");
            const blob = await response.blob();
            if (!current) return;
            objectUrl = URL.createObjectURL(blob);
            setWebUri(objectUrl);
          }
          if (current) setHeaders(imageHeaders);
        })
        .catch(() => {
          if (current) setFailed(true);
        });
    return () => {
      current = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, org]);
  if (!id || failed)
    return (
      <LinearGradient
        colors={["#E7EEFF", "#E4F8F8"]}
        style={{
          height,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
        }}
      >
        <Icon name="image-outline" size={28} color="#8399BD" />
        {failed && (
          <Text style={{ color: C.muted, fontSize: 11, textAlign: "center" }}>
            Image unavailable
          </Text>
        )}
      </LinearGradient>
    );
  if (!headers)
    return (
      <View style={{ height, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  return (
    <Image
      accessibilityLabel={alt}
      source={
        Platform.OS === "web"
          ? { uri: webUri }
          : { uri: `${origin}/api/v1/core/media/${id}/file`, headers }
      }
      onError={() => setFailed(true)}
      style={{ height, width: "100%", borderRadius: 12 }}
    />
  );
}
export const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  page: {
    padding: 22,
    gap: 18,
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    paddingBottom: 35,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  h1: { fontSize: 30, fontWeight: "800", color: C.ink, letterSpacing: -0.9 },
  h2: { fontSize: 18, fontWeight: "700", color: C.ink },
  body: { fontSize: 14, lineHeight: 21, color: C.muted },
  label: { fontSize: 13, fontWeight: "600", color: C.ink },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 5,
  },
  link: { color: C.blue, fontSize: 13, fontWeight: "600" },
  card: {
    padding: 17,
    gap: 13,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 19,
    backgroundColor: "#fff",
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  primary: { backgroundColor: C.blue },
  secondary: {
    backgroundColor: "#EEF3FF",
    borderColor: "#DCE6FF",
    borderWidth: 1,
  },
  buttonText: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#D4DEEF",
    borderRadius: 12,
    padding: 13,
    minHeight: 48,
    fontSize: 16,
    color: C.ink,
    backgroundColor: "#fff",
  },
  tag: {
    fontSize: 11,
    color: "#49618E",
    backgroundColor: "#EDF2FB",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    overflow: "hidden",
  },
  error: {
    color: "#9E263E",
    backgroundColor: "#FFF0F2",
    padding: 13,
    borderRadius: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "48%", flexGrow: 1 },
  divider: { height: 1, backgroundColor: C.line },
});
