import React, { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";
import { C, Icon, s } from "./ui";

export function SetupField({
  label,
  value,
  onChange,
  required,
  error,
  placeholder,
  keyboard = "default",
  maxLength = 100,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string | undefined;
  placeholder?: string;
  keyboard?: "default" | "email-address" | "phone-pad";
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>
        {label}
        <Text style={{ color: required ? "#6741CE" : C.muted, fontSize: 12 }}>
          {required ? "  *" : "  (optional)"}
        </Text>
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error || (required ? "Required" : "Optional")}
        aria-required={required}
        aria-invalid={!!error}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#788499"
        maxLength={maxLength}
        keyboardType={keyboard}
        autoCapitalize={keyboard === "default" ? "words" : "none"}
        autoCorrect={keyboard === "default"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          s.input,
          {
            backgroundColor: "#F8F9FC",
            borderRadius: 14,
            borderColor: error ? "#B42318" : focused ? "#6741CE" : "#DEE3EC",
          },
        ]}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
export function SearchSelect({
  label,
  value,
  options,
  onSelect,
  custom = false,
  required = false,
  error,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  custom?: boolean;
  required?: boolean;
  error?: string | undefined;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const trigger = useRef<View>(null);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const close = () => {
    setOpen(false);
    setTimeout(() => (trigger.current as any)?.focus?.(), 0);
  };
  const choose = (v: string) => {
    onSelect(v);
    close();
  };
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>
        {label}
        {required && <Text style={{ color: "#6741CE" }}> *</Text>}
      </Text>
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={
          required
            ? "Required. Opens searchable choices"
            : "Opens searchable choices"
        }
        accessibilityState={{ expanded: open }}
        onPress={() => {
          setQuery("");
          setOpen(true);
        }}
        style={[
          s.input,
          {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#F8F9FC",
            borderRadius: 14,
            borderColor: error ? "#B42318" : "#DEE3EC",
          },
        ]}
      >
        <Text style={{ flex: 1, color: value ? C.ink : C.muted, fontSize: 15 }}>
          {options.find((o) => o.value === value)?.label ||
            value ||
            `Choose ${label.toLowerCase()}`}
        </Text>
        <Icon name="chevron-down" size={18} />
      </Pressable>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(16,34,73,0.4)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              backgroundColor: "white",
              borderRadius: 24,
              padding: 20,
              gap: 14,
              width: "100%",
              maxWidth: 500,
              maxHeight: "80%",
              alignSelf: "center",
            }}
          >
            <View style={s.row}>
              <Text accessibilityRole="header" style={s.h2}>
                {label}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Close ${label.toLowerCase()} choices`}
                onPress={close}
                style={{ padding: 12 }}
              >
                <Icon name="close" />
              </Pressable>
            </View>
            <TextInput
              autoFocus
              accessibilityLabel={`Search ${label.toLowerCase()}`}
              placeholder={
                custom
                  ? "Search or type your own"
                  : "Search country or calling code"
              }
              value={query}
              maxLength={100}
              onChangeText={setQuery}
              style={s.input}
            />
            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.map((o) => (
                <Pressable
                  key={o.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: value === o.value }}
                  onPress={() => choose(o.value)}
                  style={{
                    paddingVertical: 15,
                    paddingHorizontal: 10,
                    borderBottomWidth: 1,
                    borderColor: C.line,
                    backgroundColor: value === o.value ? "#EEF0FF" : "white",
                  }}
                >
                  <Text style={{ color: C.ink, fontSize: 16 }}>
                    {o.label}
                    {value === o.value ? " ✓" : ""}
                  </Text>
                </Pressable>
              ))}
              {!filtered.length && (
                <Text style={[s.body, { padding: 10 }]}>
                  No matching {custom ? "categories" : "countries"}.
                </Text>
              )}
              {custom &&
                !!query.trim() &&
                !options.some(
                  (o) => o.label.toLowerCase() === query.trim().toLowerCase(),
                ) && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => choose(query.trim())}
                    style={{
                      padding: 16,
                      backgroundColor: "#EEF0FF",
                      borderRadius: 12,
                    }}
                  >
                    <Text style={s.link}>Add “{query.trim()}”</Text>
                  </Pressable>
                )}
            </ScrollView>
            {custom && (
              <Text style={[s.body, { fontSize: 13 }]}>
                Your new category will be saved for this business.
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
const names = new Intl.DisplayNames(["en"], { type: "region" });
export const countryOptions = getCountries()
  .map((code) => ({
    value: code,
    label: `${names.of(code) || code} (+${getCountryCallingCode(code)})`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));
export const businessCategories = [
  "Event planner",
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Florist",
  "Decoration",
  "Entertainment",
  "Sound & lighting",
  "Beauty & styling",
  "Transport",
  "Equipment rental",
].map((label) => ({ value: label, label }));
export type { CountryCode };
