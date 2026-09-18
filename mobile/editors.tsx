import { DateField } from "./DateField";
import React, { useState, useEffect, useRef } from "react";
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
import {
  amountToMinor,
  displayAmount,
  listingCurrencies,
} from "../src/formatting";
import { LinearGradient } from "expo-linear-gradient";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { businessPhone } from "../src/business-phone";
import {
  SetupField,
  SearchSelect,
  countryOptions,
  businessCategories,
  type CountryCode,
} from "./business-fields";
import type { Snapshot } from "./data";
type EditorState = (state: { dirty: boolean; busy: boolean }) => void;
function useEditorState(value: unknown, busy: boolean, onState?: EditorState) {
  const serialized = JSON.stringify(value);
  const initial = useRef(serialized);
  useEffect(() => {
    onState?.({ dirty: serialized !== initial.current, busy });
  }, [serialized, busy, onState]);
}
export function BusinessForm({
  supplier,
  org,
  onSaved,
  onState,
}: {
  supplier?: Models["SupplierResponseDto"];
  org?: string;
  onSaved: () => Promise<void>;
  onState?: EditorState;
}) {
  const [name, setName] = useState(supplier?.businessName || "");
  const [category, setCategory] = useState(supplier?.category || "");
  const [city, setCity] = useState(supplier?.city || "");
  const [email, setEmail] = useState(supplier?.contactEmail || "");
  const initialPhone = supplier?.contactPhone
    ? parsePhoneNumberFromString(supplier.contactPhone)
    : undefined;
  const [country, setCountry] = useState<CountryCode>(
    initialPhone?.country || "LB",
  );
  const [phone, setPhone] = useState(
    initialPhone?.formatNational() || supplier?.contactPhone || "",
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [inquiries, setInquiries] = useState(supplier?.acceptInquiries ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEditorState(
    { name, category, city, email, phone, country, inquiries },
    busy,
    onState,
  );
  async function save() {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Enter your business name.";
    if (!category.trim())
      errors.category = "Choose a category or add your own.";
    if (!city.trim())
      errors.city = "Enter the city where your business is based.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.email = "Enter a valid contact email, or leave it blank.";
    let normalizedPhone: string | null = null;
    try {
      normalizedPhone = businessPhone(phone, country);
    } catch (e) {
      errors.phone = (e as Error).message;
    }
    setFieldErrors(errors);
    setError("");
    if (Object.keys(errors).length) {
      setError("Please check the highlighted fields above.");
      return;
    }
    setBusy(true);
    try {
      await request("/api/v1/core/suppliers" + (supplier ? "/current" : ""), {
        method: supplier ? "PUT" : "POST",
        ...(org ? { org } : {}),
        body: {
          businessName: name.trim(),
          category: category.trim(),
          city: city.trim(),
          contactEmail: email.trim() || null,
          contactPhone: normalizedPhone,
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
  const change =
    (key: string, setter: (value: string) => void) => (value: string) => {
      setter(value);
      setFieldErrors((current) => ({ ...current, [key]: "" }));
    };
  return (
    <View style={{ gap: 22 }}>
      <View
        style={{
          gap: 8,
          backgroundColor: "#E6EBFF",
          padding: 22,
          borderRadius: 22,
        }}
      >
        <Text style={s.h2}>
          {supplier ? "Business identity" : "Set up your business"}
        </Text>
        <Text style={s.body}>
          Add the essentials so people know who you are and how to reach you.
          This identity is shared across Events Circle.
        </Text>
      </View>
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 24,
          padding: 22,
          gap: 22,
          borderWidth: 1,
          borderColor: "#E1E5F0",
        }}
      >
        <Text style={{ color: C.muted, fontSize: 13 }}>
          Fields marked * are required.
        </Text>
        <SetupField
          label="Business name"
          required
          value={name}
          onChange={change("name", setName)}
          error={fieldErrors.name}
          placeholder="Your business or studio name"
          maxLength={160}
        />
        <SearchSelect
          label="Category"
          required
          value={category}
          options={businessCategories}
          onSelect={change("category", setCategory)}
          custom
          error={fieldErrors.category}
        />
        <SetupField
          label="City"
          required
          value={city}
          onChange={change("city", setCity)}
          error={fieldErrors.city}
          placeholder="e.g. Beirut"
        />
        <View style={{ height: 1, backgroundColor: C.line }} />
        <View style={{ gap: 5 }}>
          <Text style={s.h2}>Contact details</Text>
          <Text style={[s.body, { fontSize: 14 }]}>
            Optional. You can choose what appears publicly in your profile
            settings.
          </Text>
        </View>
        <SetupField
          label="Contact email"
          value={email}
          onChange={change("email", setEmail)}
          error={fieldErrors.email}
          keyboard="email-address"
          placeholder="hello@yourbusiness.com"
          maxLength={254}
        />
        <SearchSelect
          label="Country code"
          value={country}
          options={countryOptions}
          onSelect={(value) => {
            setCountry(value as CountryCode);
            setFieldErrors((current) => ({ ...current, phone: "" }));
          }}
        />
        <SetupField
          label="Phone number"
          value={phone}
          onChange={change("phone", setPhone)}
          error={fieldErrors.phone}
          keyboard="phone-pad"
          placeholder={country === "LB" ? "01 234 567" : "Local phone number"}
          maxLength={40}
        />
        <Text style={[s.body, { fontSize: 13, marginTop: -12 }]}>
          Enter your local number. Spaces, brackets and dashes are fine. You can
          also paste a full number beginning with +.
        </Text>
        <View style={{ height: 1, backgroundColor: C.line }} />
        <View
          style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}
        >
          <View style={{ flex: 1, gap: 7 }}>
            <Text style={s.label}>Accept inquiries</Text>
            <Text style={[s.body, { fontSize: 14 }]}>
              Let potential clients send your business questions about your
              services or availability. Turning this off stops new inquiries; it
              does not hide your profile.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Accept inquiries"
            accessibilityHint="Allow new client questions about services or availability"
            value={inquiries}
            onValueChange={setInquiries}
            trackColor={{ false: "#CFD5E2", true: "#7353ED" }}
          />
        </View>
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save business"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={() => void save()}
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        <LinearGradient
          colors={["#7939EE", "#285BEB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 18, borderRadius: 18, alignItems: "center" }}
        >
          <Text style={[s.buttonText, { color: "white" }]}>
            {busy ? "Saving…" : "Save business"}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export function ProfileForm({
  data,
  org,
  onSaved,
  onState,
}: {
  data: Snapshot;
  org: string;
  onSaved: () => Promise<void>;
  onState?: EditorState;
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
  useEditorState(
    { slug, description, tagline, logo, cover, showEmail, showPhone },
    busy,
    onState,
  );
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
      if (
        slug.trim().length < 3 ||
        slug.trim().length > 80 ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim().toLowerCase())
      )
        throw new HttpError(
          400,
          "Choose a 3–80 character public page address using letters, numbers and single hyphens.",
        );
      if (description.length > 4000 || tagline.length > 200)
        throw new HttpError(
          400,
          "Keep your tagline within 200 characters and business description within 4,000 characters.",
        );
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
    <View
      style={{
        gap: 20,
        backgroundColor: "white",
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: C.line,
      }}
    >
      <Text style={s.h2}>Edit your presence</Text>
      <Text style={s.body}>
        Build the page clients will see. Fields marked * are required to save.
        You can finish your images and description before publishing.
      </Text>
      <Field
        label="Public page address · e.g. ever-after-events"
        required
        maxLength={80}
        hint="This is your unique page name, not a full website URL. Use lowercase letters, numbers and hyphens."
        value={slug}
        onChange={(value) => setSlug(value.toLowerCase())}
      />
      <Field
        label="Tagline"
        value={tagline}
        onChange={setTagline}
        maxLength={200}
        hint="Optional. A short sentence that describes what makes your business different."
        placeholder="Thoughtful celebrations, beautifully planned"
      />
      <Field
        label="About your business"
        maxLength={4000}
        hint="Tell clients what you offer, who you work with and where you operate. Required before publishing."
        value={description}
        onChange={setDescription}
        multiline
      />
      <View style={s.grid}>
        {(["logo", "cover"] as const).map((kind) => (
          <View key={kind} style={s.tile}>
            <Text style={s.label}>
              {kind === "logo" ? "Business logo" : "Cover image"}
            </Text>
            <Text style={[s.body, { fontSize: 12 }]}>
              {kind === "logo"
                ? "A simple square image works best."
                : "Choose a wide image of your work."}
            </Text>
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
      <Text style={s.h2}>Public contact details</Text>
      <Text style={s.body}>
        These switches show your business contact details on your published
        page. Turning them off keeps those details private.
      </Text>
      <View style={s.row}>
        <Text style={[s.label, { flex: 1 }]}>Show contact email publicly</Text>
        <Switch
          accessibilityLabel="Show contact email publicly"
          disabled={!data.supplier.contactEmail}
          value={showEmail}
          onValueChange={setShowEmail}
        />
      </View>
      <View style={s.row}>
        <Text style={[s.label, { flex: 1 }]}>Show phone publicly</Text>
        <Switch
          accessibilityLabel="Show phone publicly"
          disabled={!data.supplier.contactPhone}
          value={showPhone}
          onValueChange={setShowPhone}
        />
      </View>
      {(!data.supplier.contactEmail || !data.supplier.contactPhone) && (
        <Text style={s.body}>
          Missing contact details? An owner can add them in Profile → Edit
          business identity & contact.
        </Text>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Button
        label={busy ? "Saving profile…" : "Save profile"}
        disabled={busy}
        onPress={() => void save()}
      />
    </View>
  );
}
export function ContentForm({
  collection,
  item,
  initialType,
  org,
  onSaved,
  onState,
}: {
  collection: Collection;
  item?: Content;
  initialType?: NonNullable<Content["type"]> | undefined;
  org: string;
  onSaved: () => Promise<void>;
  onState?: EditorState;
}) {
  const [categoryId, setCategoryId] = useState(item?.categoryId || "");
  const [categories, setCategories] = useState<Models["CatalogResponseDto"][]>(
    [],
  );
  const [catalogError, setCatalogError] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);
  async function loadCategories() {
    setCatalogLoading(true);
    setCatalogError("");
    try {
      setCategories(
        (
          await request<Models["CatalogResponseDto"][]>(
            "/api/v1/core/catalogs/categories",
            { public: true },
          )
        ).filter((c) => c.active),
      );
    } catch {
      setCatalogError(
        "Categories could not be loaded. You can save a draft and choose a category later.",
      );
    } finally {
      setCatalogLoading(false);
    }
  }
  useEffect(() => {
    void loadCategories();
  }, []);
  const [title, setTitle] = useState(item?.title || "");
  const [summary, setSummary] = useState(item?.summary || "");
  const [description, setDescription] = useState(item?.description || "");
  const [type, setType] = useState<NonNullable<Content["type"]>>(
    item?.type || initialType || "SERVICE",
  );
  const [pricing, setPricing] = useState<NonNullable<Content["pricingMode"]>>(
    item?.pricingMode || "ON_REQUEST",
  );
  const [amount, setAmount] = useState(
    displayAmount(item?.amountMinor, item?.currency),
  );
  const [currency, setCurrency] = useState(item?.currency || "USD");
  const [until, setUntil] = useState(item?.validUntil?.slice(0, 10) || "");
  const [media, setMedia] = useState<Models["MediaReferenceDto"][]>(
    item?.media || [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEditorState(
    {
      categoryId,
      title,
      summary,
      description,
      type,
      pricing,
      amount,
      currency,
      until,
      media,
    },
    busy,
    onState,
  );
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
        title.trim().length > 160 ||
        summary.length > 500 ||
        description.length > 4000
      )
        throw new HttpError(
          400,
          "Use up to 160 characters for the title, 500 for the summary and 4,000 for the description.",
        );
      if (media.some((m) => !m.altText.trim() || m.altText.length > 300))
        throw new HttpError(
          400,
          "Give each image a description between 1 and 300 characters.",
        );
      let amountMinor: number | null = null;
      if (collection === "listings" && ["FIXED", "FROM"].includes(pricing)) {
        try {
          amountMinor = amountToMinor(amount, currency.trim().toUpperCase());
        } catch (e) {
          throw new HttpError(400, (e as Error).message);
        }
      }
      if (
        collection === "listings" &&
        type === "OFFER" &&
        until &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(until) ||
          !Number.isFinite(Date.parse(until)) ||
          new Date(until).toISOString().slice(0, 10) !== until)
      )
        throw new HttpError(400, "Enter a valid expiry date as YYYY-MM-DD.");
      const body = {
        title: title.trim(),
        summary,
        description,
        categoryId: categoryId || null,
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
              amountMinor,
              currency: ["FIXED", "FROM"].includes(pricing)
                ? currency.trim().toUpperCase()
                : null,
              validFrom: type === "OFFER" ? item?.validFrom || null : null,
              validUntil:
                type === "OFFER" && until
                  ? item?.validUntil?.slice(0, 10) === until
                    ? item.validUntil
                    : until + "T23:59:59.999Z"
                  : null,
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
    <View
      style={{
        gap: 20,
        backgroundColor: "white",
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: C.line,
      }}
    >
      <Text style={s.h2}>
        {item ? "Edit" : "Add"}{" "}
        {collection === "portfolio"
          ? "project"
          : collection === "gallery"
            ? "gallery"
            : "listing"}
      </Text>
      <Text style={s.body}>
        {item?.status === "PUBLISHED"
          ? "This item is public. Saved changes appear immediately."
          : "Start with a title and save a private draft. You can add the remaining details before publishing."}
      </Text>
      <Field
        label="Title"
        required
        maxLength={160}
        placeholder={
          collection === "portfolio"
            ? "e.g. A garden wedding in Beirut"
            : collection === "gallery"
              ? "e.g. Summer celebrations"
              : "e.g. Full wedding planning"
        }
        value={title}
        onChange={setTitle}
      />
      <SearchSelect
        label="Content category"
        value={categoryId}
        options={categories.map((c) => ({ value: c.id, label: c.label }))}
        onSelect={setCategoryId}
      />
      <Text style={s.body}>
        {collection === "gallery"
          ? "Optional. Choose a category to help organize your gallery."
          : "Required to publish. Choose from the shared Events Circle categories."}
      </Text>
      {!categories.length && (
        <Text style={s.body}>
          {catalogLoading
            ? "Loading categories…"
            : catalogError ||
              "No categories available yet. You can still save a draft."}
        </Text>
      )}
      {!!catalogError && (
        <Button
          label="Retry categories"
          secondary
          onPress={() => void loadCategories()}
        />
      )}
      <Field
        label="Short summary"
        value={summary}
        onChange={setSummary}
        maxLength={500}
        hint="Optional. A brief introduction shown on the item card."
      />
      <Field
        label="Description"
        maxLength={4000}
        hint={
          collection === "gallery"
            ? "Optional. Give this set of images some context."
            : "Describe what is included, who it is for and any important details. Required before publishing."
        }
        value={description}
        onChange={setDescription}
        multiline
      />
      {collection === "listings" && (
        <>
          <Text style={s.h2}>What are you offering?</Text>
          <Text style={s.body}>
            Product: an item. Service: work you provide. Package: a bundle.
            Offer: a promotion.
          </Text>
          <Text style={s.label}>Listing type</Text>
          <View style={s.grid}>
            {(["PRODUCT", "SERVICE", "PACKAGE", "OFFER"] as const).map((t) => (
              <Button
                key={t}
                label={t.charAt(0) + t.slice(1).toLowerCase()}
                secondary={type !== t}
                selected={type === t}
                onPress={() => setType(t)}
              />
            ))}
          </View>
          <Text style={s.label}>Pricing</Text>
          <Text style={s.body}>
            On request: clients ask for a quote. Starting from: a minimum price.
            Fixed price: one set amount. Free: no charge.
          </Text>
          <View style={s.grid}>
            {(["ON_REQUEST", "FREE", "FROM", "FIXED"] as const).map((t) => (
              <Button
                key={t}
                label={
                  {
                    ON_REQUEST: "On request",
                    FREE: "Free",
                    FROM: "Starting from",
                    FIXED: "Fixed price",
                  }[t]
                }
                secondary={pricing !== t}
                selected={pricing === t}
                onPress={() => setPricing(t)}
              />
            ))}
          </View>
          {["FIXED", "FROM"].includes(pricing) && (
            <>
              <Field
                label="Price · e.g. 25.00"
                required
                hint={`Enter the amount in ${currency}, not cents.`}
                value={amount}
                onChange={setAmount}
                keyboard="decimal-pad"
              />
              <SearchSelect
                label="Currency"
                value={currency}
                options={listingCurrencies.map((code) => ({
                  value: code,
                  label: code,
                }))}
                onSelect={setCurrency}
              />
            </>
          )}
          {type === "OFFER" && <DateField value={until} onChange={setUntil} />}
        </>
      )}
      <Text style={s.h2}>Images</Text>
      <Text style={s.body}>
        The cover is the first image clients see. Add JPEG, PNG or WebP images
        up to 5 MB each. Describe what each image shows for people using screen
        readers.
      </Text>
      {media.map((m, i) => (
        <Card key={m.mediaId}>
          <Text style={s.label}>
            {i === 0 ? "Cover image" : `Image ${i + 1}`}
          </Text>
          <Photo id={m.mediaId} org={org} />
          <Field
            label="Image description for accessibility"
            required
            maxLength={300}
            placeholder="e.g. White roses around an outdoor wedding arch"
            value={m.altText}
            onChange={(altText) =>
              setMedia(media.map((x, j) => (i === j ? { ...x, altText } : x)))
            }
          />
          <View style={s.row}>
            {i > 0 && (
              <Pressable
                accessibilityRole="button"
                style={{ minHeight: 44, justifyContent: "center" }}
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
              accessibilityRole="button"
              style={{ minHeight: 44, justifyContent: "center" }}
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
        {collection === "gallery"
          ? "Publishing a gallery requires at least one image."
          : "Publishing requires a category, description and cover image."}
        {"\n"}
        {item?.status === "PUBLISHED"
          ? "Saving updates this published item immediately."
          : "Saved as a draft. You can publish it from the collection."}
      </Text>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Button
        label={
          busy
            ? "Saving…"
            : item?.status === "PUBLISHED"
              ? "Save changes"
              : "Save draft"
        }
        disabled={busy}
        onPress={() => void save()}
      />
    </View>
  );
}
