import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button, Card, Field, s } from "./ui";
import { SearchSelect } from "./business-fields";
import { explain, request, type Models } from "./service";
import type { Snapshot } from "./data";
type Details = Models["CategoryDetailsDto"];
type DetailType = Models["DetailTypeDto"];
type Values = Details["values"];
function useDetailTypes() {
  const [types, setTypes] = useState<DetailType[]>([]);
  const [error, setError] = useState("");
  const [attempt, retry] = useState(0);
  useEffect(() => {
    let current = true;
    setError("");
    request<DetailType[]>("/api/v1/presence/detail-types", { public: true })
      .then((result) => {
        if (current) setTypes(result);
      })
      .catch((e) => {
        if (current) setError(explain(e));
      });
    return () => {
      current = false;
    };
  }, [attempt]);
  return { types, error, retry: () => retry((x) => x + 1) };
}
export function CategoryDetailsForm({
  data,
  org,
  onSaved,
  onState,
}: {
  data: Snapshot;
  org: string;
  onSaved: () => Promise<void>;
  onState: (state: { dirty: boolean; busy: boolean }) => void;
}) {
  const { types, error: loadError, retry } = useDetailTypes();
  const original = data.profile?.categoryDetails;
  const [type, setType] = useState(original?.type || "");
  const [drafts, setDrafts] = useState<Record<string, Values>>(
    original ? { [original.type]: original.values } : {},
  );
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const initialized = useRef(false);
  useEffect(() => {
    if (!types.length || initialized.current) return;
    initialized.current = true;
    if (
      !original ||
      (original.type === "GENERAL" && !Object.keys(original.values).length)
    )
      setType(
        types.find((t) =>
          t.categories.includes(data.supplier.category.trim().toLowerCase()),
        )?.id || "GENERAL",
      );
  }, [types, original, data.supplier.category]);
  useEffect(() => {
    onState({ dirty: touched, busy });
  }, [touched, busy, onState]);
  const schema = types.find((t) => t.id === type);
  const values = drafts[type] || {};
  const setValue = (key: string, value: Values[string] | undefined) => {
    setTouched(true);
    setErrors({});
    setError("");
    const next = { ...values };
    if (value === undefined) delete next[key];
    else next[key] = value;
    setDrafts((prev) => ({ ...prev, [type]: next }));
  };
  async function save() {
    if (!schema || !data.profile) return;
    const cleaned: Values = {};
    const invalid: Record<string, string> = {};
    for (const field of schema.fields) {
      const v = values[field.key];
      if (
        v === undefined ||
        v === "" ||
        (typeof v === "string" && !v.trim()) ||
        (Array.isArray(v) && !v.length)
      )
        continue;
      if (field.kind === "number") {
        const raw = String(v).trim();
        const n = Number(raw);
        if (
          !/^\d+$/.test(raw) ||
          !Number.isInteger(n) ||
          n < field.min! ||
          n > field.max!
        )
          invalid[field.key] =
            `Enter a whole number from ${field.min} to ${field.max}.`;
        else cleaned[field.key] = n;
      } else cleaned[field.key] = typeof v === "string" ? v.trim() : v;
    }
    if (
      typeof cleaned.minimumGuests === "number" &&
      typeof cleaned.maximumGuests === "number" &&
      cleaned.minimumGuests > cleaned.maximumGuests
    )
      invalid.maximumGuests =
        "Maximum guest count must be at least the minimum guest count.";
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      setError("Check the highlighted fields before saving.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const p = data.profile;
      await request("/api/v1/presence/profile", {
        org,
        method: "PUT",
        body: {
          slug: p.slug,
          description: p.description,
          published: p.published,
          version: p.version,
          categoryDetails: { type, values: cleaned },
        },
      });
      await onSaved();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  if (loadError)
    return (
      <Card>
        <Text accessibilityRole="alert" style={s.error}>
          {loadError}
        </Text>
        <Button label="Retry loading details" onPress={retry} />
      </Card>
    );
  if (!types.length)
    return <ActivityIndicator accessibilityLabel="Loading category fields" />;
  if (!data.profile)
    return (
      <Card>
        <Text style={s.body}>
          Create your profile and page address first, then add category details.
        </Text>
      </Card>
    );
  return (
    <View pointerEvents={busy ? "none" : "auto"} style={{ gap: 16 }}>
      <Card>
        <Text style={s.h2}>Help clients find the right fit</Text>
        <Text style={s.body}>
          Add practical details about your business. All fields are optional.
          Only answered fields appear on your public page.
        </Text>
        <SearchSelect
          label="Details for your business"
          value={type}
          options={types.map((t) => ({ value: t.id, label: t.label }))}
          onSelect={(v) => {
            setType(v);
            setTouched(true);
            setErrors({});
            setError("");
          }}
        />
        <Text style={s.body}>
          Your business category stays {data.supplier.category}. Choose the form
          that best fits your services.
        </Text>
        {original &&
          type !== original.type &&
          Object.keys(original.values).length > 0 && (
            <Text style={s.error}>
              Saving this form replaces your previously saved category details.
              Switch back before saving to keep them.
            </Text>
          )}
      </Card>
      <View pointerEvents={busy ? "none" : "auto"} style={{ gap: 12 }}>
        {schema?.fields.map((f) => (
          <Card key={`${type}-${f.key}`}>
            {f.kind === "number" || f.kind === "text" ? (
              <Field
                label={f.label}
                hint={`${f.hint}${f.unit ? ` Enter ${f.unit}.` : ""}`}
                value={String(values[f.key] ?? "")}
                onChange={(v) => setValue(f.key, v)}
                keyboard={f.kind === "number" ? "decimal-pad" : "default"}
                multiline={f.kind === "text"}
                {...(f.kind === "text" ? { maxLength: f.max } : {})}
              />
            ) : (
              <>
                <Text style={s.label}>{f.label}</Text>
                <Text style={s.body}>{f.hint}</Text>
                {f.kind === "select" ? (
                  <SearchSelect
                    label={`Choose ${f.label.toLowerCase()}`}
                    value={String(values[f.key] ?? "")}
                    options={[
                      { value: "", label: "Not specified" },
                      ...(f.options || []).map((o) => ({ value: o, label: o })),
                    ]}
                    onSelect={(v) => setValue(f.key, v || undefined)}
                  />
                ) : f.kind === "boolean" ? (
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {[
                      { label: "Yes", value: true },
                      { label: "No", value: false },
                      { label: "Not specified", value: undefined },
                    ].map((o) => (
                      <Button
                        key={o.label}
                        label={o.label}
                        selected={values[f.key] === o.value}
                        secondary={values[f.key] !== o.value}
                        onPress={() => setValue(f.key, o.value)}
                      />
                    ))}
                  </View>
                ) : (
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {(f.options || []).map((o) => {
                      const selected = Array.isArray(values[f.key])
                        ? (values[f.key] as string[])
                        : [];
                      return (
                        <Button
                          key={o}
                          label={o}
                          selected={selected.includes(o)}
                          secondary={!selected.includes(o)}
                          onPress={() =>
                            setValue(
                              f.key,
                              selected.includes(o)
                                ? selected.filter((v) => v !== o)
                                : [...selected, o],
                            )
                          }
                        />
                      );
                    })}
                  </View>
                )}
              </>
            )}
            {!!errors[f.key] && (
              <Text accessibilityRole="alert" style={s.error}>
                {errors[f.key]}
              </Text>
            )}
          </Card>
        ))}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Button
        label={busy ? "Saving…" : "Save category details"}
        disabled={busy || !schema}
        onPress={() => void save()}
      />
      <Text style={s.body}>
        {data.profile.published
          ? "Saved changes appear on your published page immediately."
          : "Saved details stay in your draft until you publish your page."}
      </Text>
    </View>
  );
}
export function CategoryDetailsPreview({ details }: { details?: Details }) {
  // Mount only when there are answers, so older and empty profiles make no request.
  if (!details || !Object.keys(details.values).length) return null;
  return <AnsweredDetails details={details} />;
}
function AnsweredDetails({ details }: { details: Details }) {
  const { types, error, retry } = useDetailTypes();
  const schema = types.find((t) => t.id === details.type);
  return (
    <Card>
      <Text style={s.h2}>Business details</Text>
      {error ? (
        <>
          <Text style={s.body}>Could not load business details.</Text>
          <Button label="Retry business details" secondary onPress={retry} />
        </>
      ) : !types.length ? (
        <ActivityIndicator />
      ) : !schema ? (
        <Text style={s.body}>
          These details are not available in this version.
        </Text>
      ) : (
        schema.fields.map((f) => {
          const v = details.values[f.key];
          if (v === undefined || v === "" || (Array.isArray(v) && !v.length))
            return null;
          return (
            <View key={f.key} style={{ gap: 4 }}>
              <Text style={s.label}>{f.label}</Text>
              <Text style={s.body}>
                {typeof v === "boolean"
                  ? v
                    ? "Yes"
                    : "No"
                  : Array.isArray(v)
                    ? v.join(", ")
                    : `${v}${f.unit ? ` ${f.unit}` : ""}`}
              </Text>
            </View>
          );
        })
      )}
    </Card>
  );
}
