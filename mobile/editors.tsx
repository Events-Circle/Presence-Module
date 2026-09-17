import React, { useState } from "react";
import { ScrollView, Switch, Text, View, Pressable } from "react-native";
import { Button, Card, Field, Photo, s, C } from "./ui";
import {
  explain,
  pickImage,
  request,
  type Models,
  type Content,
  type Collection,
  HttpError,
} from "./service";
import type { Snapshot } from "./data";
export function BusinessForm({
  supplier,
  org,
  onSaved,
}: {
  supplier?: Models["SupplierResponseDto"];
  org?: string;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(supplier?.businessName || "");
  const [category, setCategory] = useState(supplier?.category || "");
  const [city, setCity] = useState(supplier?.city || "");
  const [email, setEmail] = useState(supplier?.contactEmail || "");
  const [phone, setPhone] = useState(supplier?.contactPhone || "");
  const [inquiries, setInquiries] = useState(supplier?.acceptInquiries ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setBusy(true);
    setError("");
    try {
      if (!name.trim() || !category.trim() || !city.trim())
        throw new HttpError(
          400,
          "Business name, category and city are required.",
        );
      await request("/api/v1/core/suppliers" + (supplier ? "/current" : ""), {
        method: supplier ? "PUT" : "POST",
        ...(org ? { org } : {}),
        body: {
          businessName: name.trim(),
          category: category.trim(),
          city: city.trim(),
          contactEmail: email.trim() || null,
          contactPhone: phone.trim() || null,
          acceptInquiries: inquiries,
          serviceAreas: supplier?.serviceAreas || [],
        },
      });
      await onSaved();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 16 }}>
      <Text style={s.h2}>
        {supplier ? "Business identity" : "Set up your business"}
      </Text>
      <Text style={s.body}>
        Your business identity is shared across Events Circle.
      </Text>
      <Field label="Business name" value={name} onChange={setName} />
      <Field
        label="Category · e.g. Event planner"
        value={category}
        onChange={setCategory}
      />
      <Field label="City" value={city} onChange={setCity} />
      <Field
        label="Contact email"
        value={email}
        onChange={setEmail}
        keyboard="email-address"
      />
      <Field
        label="Phone · international format, e.g. +961…"
        value={phone}
        onChange={setPhone}
      />
      <View style={s.row}>
        <Text style={s.label}>Accept inquiries</Text>
        <Switch value={inquiries} onValueChange={setInquiries} />
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Button
        label={busy ? "Saving…" : "Save business"}
        disabled={busy}
        onPress={() => void save()}
      />
    </View>
  );
}
export function ProfileForm({
  data,
  org,
  onSaved,
}: {
  data: Snapshot;
  org: string;
  onSaved: () => Promise<void>;
}) {
  const p = data.profile;
  const [slug, setSlug] = useState(p?.slug || "");
  const [description, setDescription] = useState(p?.description || "");
  const [tagline, setTagline] = useState(p?.tagline || "");
  const [logo, setLogo] = useState(p?.logoMediaId || null);
  const [cover, setCover] = useState(p?.coverMediaId || null);
  const [showEmail, setShowEmail] = useState(p?.showEmail || false);
  const [showPhone, setShowPhone] = useState(p?.showPhone || false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(kind: "logo" | "cover") {
    setBusy(true);
    setError("");
    try {
      const media = await pickImage(org);
      if (media) (kind === "logo" ? setLogo : setCover)(media.id);
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      await request("/api/v1/presence/profile", {
        org,
        method: "PUT",
        body: {
          slug: slug.trim().toLowerCase(),
          description,
          tagline,
          logoMediaId: logo,
          coverMediaId: cover,
          showEmail,
          showPhone,
          published: p?.published || false,
          ...(p ? { version: p.version } : {}),
        },
      });
      await onSaved();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 16 }}>
      <Text style={s.h2}>Edit your presence</Text>
      <Field
        label="Public slug · lowercase words with hyphens"
        value={slug}
        onChange={setSlug}
      />
      <Field label="Tagline" value={tagline} onChange={setTagline} />
      <Field
        label="About your business"
        value={description}
        onChange={setDescription}
        multiline
      />
      <View style={s.grid}>
        {(["logo", "cover"] as const).map((kind) => (
          <View key={kind} style={s.tile}>
            <Photo id={kind === "logo" ? logo : cover} org={org} />
            <Button
              label={`Choose ${kind}`}
              secondary
              disabled={busy}
              onPress={() => void upload(kind)}
            />
          </View>
        ))}
      </View>
      <Text style={s.body}>
        JPEG, PNG or WebP · up to 5 MB. Your changes go live immediately if the
        profile is already published.
      </Text>
      <View style={s.row}>
        <Text style={s.label}>Show contact email publicly</Text>
        <Switch value={showEmail} onValueChange={setShowEmail} />
      </View>
      <View style={s.row}>
        <Text style={s.label}>Show phone publicly</Text>
        <Switch value={showPhone} onValueChange={setShowPhone} />
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
      <Button
        label={busy ? "Working…" : "Save profile"}
        disabled={busy}
        onPress={() => void save()}
      />
    </View>
  );
}
export function ContentForm({
  collection,
  item,
  org,
  onSaved,
}: {
  collection: Collection;
  item?: Content;
  org: string;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(item?.title || "");
  const [summary, setSummary] = useState(item?.summary || "");
  const [description, setDescription] = useState(item?.description || "");
  const [type, setType] = useState<NonNullable<Content["type"]>>(
    item?.type || "SERVICE",
  );
  const [pricing, setPricing] = useState<NonNullable<Content["pricingMode"]>>(
    item?.pricingMode || "ON_REQUEST",
  );
  const [amount, setAmount] = useState(item?.amountMinor?.toString() || "");
  const [currency, setCurrency] = useState(item?.currency || "USD");
  const [until, setUntil] = useState(item?.validUntil || "");
  const [media, setMedia] = useState<Models["MediaReferenceDto"][]>(
    item?.media || [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload() {
    setBusy(true);
    setError("");
    try {
      const m = await pickImage(org);
      if (m)
        setMedia([
          ...media,
          {
            mediaId: m.id,
            role: media.length ? "GALLERY" : "COVER",
            altText: title || "Business portfolio image",
          },
        ]);
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      if (!title.trim()) throw new HttpError(400, "Add a title.");
      if (
        collection === "listings" &&
        ["FIXED", "FROM"].includes(pricing) &&
        (!/^\d+$/.test(amount) || !Number.isSafeInteger(Number(amount)))
      )
        throw new HttpError(
          400,
          "Enter a whole number of minor currency units (for USD, cents).",
        );
      const body = {
        title: title.trim(),
        summary,
        description,
        categoryId: item?.categoryId || null,
        locationId: item?.locationId || null,
        occurredAt: item?.occurredAt || null,
        serviceAreas: item?.serviceAreas || [],
        availabilityNote: item?.availabilityNote || "",
        featured: item?.featured || false,
        media,
        ...(item ? { version: item.version } : {}),
        ...(collection === "listings"
          ? {
              type,
              pricingMode: pricing,
              amountMinor: ["FIXED", "FROM"].includes(pricing)
                ? Number(amount)
                : null,
              currency: ["FIXED", "FROM"].includes(pricing)
                ? currency.toUpperCase()
                : null,
              validFrom: item?.validFrom || null,
              validUntil: until.trim() || null,
            }
          : {}),
      };
      await request(
        `/api/v1/presence/collections/${collection}${item ? "/" + item.id : ""}`,
        { org, method: item ? "PUT" : "POST", body },
      );
      await onSaved();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 16 }}>
      <Text style={s.h2}>
        {item ? "Edit" : "Add"}{" "}
        {collection === "portfolio"
          ? "project"
          : collection === "gallery"
            ? "gallery"
            : "listing"}
      </Text>
      <Field label="Title" value={title} onChange={setTitle} />
      <Field label="Short summary" value={summary} onChange={setSummary} />
      <Field
        label="Description"
        value={description}
        onChange={setDescription}
        multiline
      />
      {collection === "listings" && (
        <>
          <Text style={s.label}>Listing type</Text>
          <View style={s.grid}>
            {(["PRODUCT", "SERVICE", "PACKAGE", "OFFER"] as const).map((t) => (
              <Button
                key={t}
                label={t}
                secondary={type !== t}
                onPress={() => setType(t)}
              />
            ))}
          </View>
          <Text style={s.label}>Pricing</Text>
          <View style={s.grid}>
            {(["ON_REQUEST", "FREE", "FROM", "FIXED"] as const).map((t) => (
              <Button
                key={t}
                label={t.replace("_", " ")}
                secondary={pricing !== t}
                onPress={() => setPricing(t)}
              />
            ))}
          </View>
          {["FIXED", "FROM"].includes(pricing) && (
            <>
              <Field
                label="Amount in minor units · USD 25.00 = 2500"
                value={amount}
                onChange={setAmount}
                keyboard="decimal-pad"
              />
              <Field
                label="Currency · 3-letter code"
                value={currency}
                onChange={setCurrency}
              />
            </>
          )}
          {type === "OFFER" && (
            <Field
              label="Offer expiry · ISO date, e.g. 2026-12-31T23:59:00Z"
              value={until}
              onChange={setUntil}
            />
          )}
        </>
      )}
      <Text style={s.label}>Images · first image is the cover</Text>
      {media.map((m, i) => (
        <Card key={m.mediaId}>
          <Photo id={m.mediaId} org={org} />
          <Field
            label="Image description for accessibility"
            value={m.altText}
            onChange={(altText) =>
              setMedia(media.map((x, j) => (i === j ? { ...x, altText } : x)))
            }
          />
          <View style={s.row}>
            {i > 0 && (
              <Pressable
                onPress={() =>
                  setMedia(
                    [m, ...media.filter((_, j) => j !== i)].map((x, j) => ({
                      ...x,
                      role: j ? "GALLERY" : "COVER",
                    })),
                  )
                }
              >
                <Text style={s.link}>Make cover</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() =>
                setMedia(
                  media
                    .filter((_, j) => j !== i)
                    .map((x, j) => ({ ...x, role: j ? "GALLERY" : "COVER" })),
                )
              }
            >
              <Text style={s.link}>Remove</Text>
            </Pressable>
          </View>
        </Card>
      ))}
      <Button
        label="Add image"
        secondary
        disabled={busy || media.length >= 50}
        onPress={() => void upload()}
      />
      <Text style={s.body}>
        {item?.status === "PUBLISHED"
          ? "Saving updates this published item immediately."
          : "Saved as a draft. You can publish it from the collection."}
      </Text>
      {!!error && <Text style={s.error}>{error}</Text>}
      <Button
        label={busy ? "Working…" : "Save"}
        disabled={busy}
        onPress={() => void save()}
      />
    </View>
  );
}
