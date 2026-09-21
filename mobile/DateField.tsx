import React, { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { Button, C, s } from "./ui";
const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function DateField({
  value,
  onChange,
  label = "Offer expiry",
  actionLabel = "expiry date",
  hint = "Leave blank for no end date. An expiry date ends at 23:59 UTC; your local time may differ.",
}: {
  label?: string;
  actionLabel?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date());
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>
        {label} <Text style={{ color: C.muted }}>(optional)</Text>
      </Text>
      <Button
        secondary
        label={
          value
            ? `${label}: ${new Date(value + "T12:00:00").toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" })}`
            : `Choose ${actionLabel}`
        }
        onPress={() => {
          setMonth(value ? new Date(value + "T12:00:00") : new Date());
          setOpen(true);
        }}
      />
      <Text style={s.body}>{hint}</Text>
      {!!value && (
        <Button
          label={`Clear ${actionLabel}`}
          secondary
          onPress={() => onChange("")}
        />
      )}
      <Modal
        visible={open}
        transparent
        onRequestClose={() => setOpen(false)}
        animationType={Platform.OS === "web" ? "none" : "fade"}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 16,
            backgroundColor: "rgba(16,34,73,0.4)",
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              backgroundColor: "white",
              borderRadius: 22,
              padding: 16,
              gap: 16,
              width: "100%",
              maxWidth: 420,
              alignSelf: "center",
            }}
          >
            <Text accessibilityRole="header" style={s.h2}>
              Choose {actionLabel}
            </Text>
            <View style={s.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                onPress={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
                style={{ padding: 12 }}
              >
                <Text style={s.link}>‹</Text>
              </Pressable>
              <Text style={s.label}>
                {month.toLocaleDateString("en", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next month"
                onPress={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
                style={{ padding: 12 }}
              >
                <Text style={s.link}>›</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: "row" }}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <Text
                  key={i}
                  style={{
                    width: "14.285%",
                    textAlign: "center",
                    color: C.muted,
                  }}
                >
                  {d}
                </Text>
              ))}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {Array.from({ length: first.getDay() }, (_, i) => (
                <View key={`blank-${i}`} style={{ width: "14.285%" }} />
              ))}
              {Array.from({ length: days }, (_, i) => {
                const date = new Date(
                    month.getFullYear(),
                    month.getMonth(),
                    i + 1,
                  ),
                  key = iso(date);
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={key}
                    accessibilityState={{ selected: value === key }}
                    onPress={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                    style={{
                      width: "14.285%",
                      minHeight: 44,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: value === key ? "#E7E5FF" : "white",
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: C.ink }}>{i + 1}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              label="Cancel date selection"
              secondary
              onPress={() => setOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
