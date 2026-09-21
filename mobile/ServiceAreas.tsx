import React, { useState } from "react";
import { Text, View } from "react-native";
import { Button, s } from "./ui";
import { SetupField } from "./business-fields";
export function ServiceAreas({
  areas,
  onChange,
  pending,
  onPending,
  hint = "Optional. Add cities or regions where you work. This is separate from your base city and is shared across Events Circle.",
}: {
  hint?: string;
  areas: string[];
  onChange: (areas: string[]) => void;
  pending: string;
  onPending: (value: string) => void;
}) {
  const [error, setError] = useState("");
  function add() {
    const value = pending.trim();
    if (!value) return;
    if (areas.some((area) => area.toLowerCase() === value.toLowerCase())) {
      setError("This area is already listed.");
      return;
    }
    if (areas.length >= 30) {
      setError("You can add up to 30 service areas.");
      return;
    }
    onChange([...areas, value]);
    onPending("");
    setError("");
  }
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.h2}>Areas you serve</Text>
      <Text style={s.body}>{hint}</Text>
      {areas.map((area, i) => (
        <View key={i} style={s.row}>
          <Text style={[s.body, { flex: 1 }]}>{area}</Text>
          <Button
            label={`Remove ${area}`}
            secondary
            onPress={() => {
              onChange(areas.filter((_, index) => index !== i));
              setError("");
            }}
          />
        </View>
      ))}
      <SetupField
        label="Add a service area"
        value={pending}
        onChange={(value) => {
          onPending(value);
          setError("");
        }}
        placeholder="e.g. Mount Lebanon"
        maxLength={100}
        error={error}
      />
      <Button
        label="Add area"
        secondary
        disabled={!pending.trim() || areas.length >= 30}
        onPress={add}
      />
      <Text style={s.body}>
        {areas.length} / 30 areas. A typed area is also included when you save.
      </Text>
    </View>
  );
}
