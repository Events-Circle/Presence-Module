import { ServiceAreas } from "./ServiceAreas";
import { SaveControl } from "./EditorUX";
import { ListingPricingFields } from "./ListingPricing";
import { profileSectionTitles, type ProfileSection } from "./ProfileSections";
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
  normalizeInclusions,
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
  leadsAvailable,
}: {
  leadsAvailable?: boolean;
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
  const [areas, setAreas] = useState(supplier?.serviceAreas || []);
  const [pendingArea, setPendingArea] = useState("");
  const [inquiries, setInquiries] = useState(supplier?.acceptInquiries ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEditorState(
    {
      name,
      category,
      city,
      email,
      phone,
      country,
      inquiries,
      areas,
      pendingArea,
    },
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
    const serviceAreas = [...areas];
    if (
      pendingArea.trim() &&
      !serviceAreas.some(
        (area) => area.toLowerCase() === pendingArea.trim().toLowerCase(),
      )
    )
      serviceAreas.push(pendingArea.trim());
    if (serviceAreas.length > 30)
      errors.areas =
        "Use up to 30 service areas. Remove an area before adding another.";
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
          serviceAreas,
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
        <ServiceAreas
          areas={areas}
          onChange={setAreas}
          pending={pendingArea}
          onPending={setPendingArea}
        />
        {!!fieldErrors.areas && (
          <Text accessibilityRole="alert" style={s.error}>
            {fieldErrors.areas}
          </Text>
        )}
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
        <View
          style={{
            gap: 14,
            padding: 14,
            backgroundColor: "#F5F7FC",
            borderRadius: 16,
          }}
        >
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
            Enter your local number. Spaces, brackets and dashes are fine. You
            can also paste a full number beginning with +.
          </Text>
        </View>
        <View style={{ height: 1, backgroundColor: C.line }} />
        <View
          style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}
        >
          <View style={{ flex: 1, gap: 7 }}>
            <Text style={s.label}>Accept inquiries</Text>
            <Text style={[s.body, { fontSize: 14 }]}>
              {leadsAvailable === true
                ? "Allow new inquiries through the Leads module when your profile is published. Turning this off stops new inquiries without hiding your profile."
                : leadsAvailable === false
                  ? "Inquiries are not available yet because the Leads module is disabled. This saves your preference for when it becomes available; clients cannot send inquiries now."
                  : "Save your preference for client inquiries. Availability is checked after setup and depends on the Leads module and a published profile."}
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
      <SaveControl
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
  onState,
  section = "all",
}: {
  section?: ProfileSection;
  data: Snapshot;
  org: string;
  onSaved: () => Promise<void>;
  onState?: EditorState;
}) {
  const p = data.profile;
  const visible = (name: ProfileSection) =>
    section === "all" || section === name;
  const [attempted, setAttempted] = useState(false);
  const [slug, setSlug] = useState(
    p?.pageAddressConfirmed === false ? "" : p?.slug || "",
  );
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
    setAttempted(true);
    setBusy(true);
    setError("");
    try {
      if (
        (section === "address" || (section === "all" && !!slug.trim())) &&
        (slug.trim().length < 3 ||
          slug.trim().length > 80 ||
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim().toLowerCase()))
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
          ...((section === "address" || section === "all") && slug.trim()
            ? { slug: slug.trim().toLowerCase() }
            : {}),
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
      <Text style={s.h2}>{profileSectionTitles[section]}</Text>
      <Text style={s.body}>
        {p?.published
          ? "Your page is published. Saving updates the public page immediately."
          : "These changes stay unpublished until you publish your page."}
      </Text>
      {!p && (
        <Text style={s.body}>
          Start with an introduction, or save an empty private draft. Add
          images, practical details and your public address later.
        </Text>
      )}
      {(section === "address" || (section === "all" && !!p)) && (
        <>
          <Field
            label="Public page address · e.g. ever-after-events"
            error={
              attempted &&
              (section === "address" || !!slug.trim()) &&
              (slug.trim().length < 3 ||
                slug.trim().length > 80 ||
                !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim()))
                ? "Use 3–80 letters, numbers or single hyphens."
                : undefined
            }
            maxLength={80}
            hint="Required before publishing, optional while building your draft. Use lowercase letters, numbers and hyphens."
            value={slug}
            onChange={(value) => setSlug(value.toLowerCase())}
          />
          <Text style={s.body}>
            Availability is confirmed when you save. Changing a published page
            name can affect previously shared links.
          </Text>
        </>
      )}
      {visible("introduction") && (
        <>
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
        </>
      )}
      {visible("images") && !!p && (
        <>
          <View style={{ gap: 20 }}>
            {(["logo", "cover"] as const).map((kind) => (
              <View key={kind} style={{ gap: 10 }}>
                <Text style={s.label}>
                  {kind === "logo" ? "Business logo" : "Cover image"}
                </Text>
                <Text style={[s.body, { fontSize: 12 }]}>
                  {kind === "logo"
                    ? "A simple square image works best."
                    : "Choose a wide image of your work."}
                </Text>
                <View style={kind === "logo" ? { width: 112 } : undefined}>
                  <Photo
                    id={kind === "logo" ? logo : cover}
                    org={org}
                    height={kind === "logo" ? 112 : 175}
                  />
                </View>
                <Button
                  label={`Choose ${kind}`}
                  secondary
                  disabled={busy}
                  onPress={() => void upload(kind)}
                />
                {!!(kind === "logo" ? logo : cover) && (
                  <Button
                    label={`Remove ${kind}`}
                    secondary
                    disabled={busy}
                    onPress={() => (kind === "logo" ? setLogo : setCover)(null)}
                  />
                )}
              </View>
            ))}
          </View>
          <Text style={s.body}>
            JPEG, PNG or WebP · up to 5 MB. Your changes go live immediately if
            the profile is already published.
          </Text>
        </>
      )}
      {visible("contact") && !!p && (
        <>
          <Text style={s.h2}>Contact visibility</Text>
          <Text style={s.body}>
            These switches show your business contact details on your published
            page. Turning them off keeps those details private.
          </Text>
          <View style={s.row}>
            <Text style={[s.label, { flex: 1 }]}>
              Show contact email publicly
            </Text>
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
              business information.
            </Text>
          )}
        </>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <SaveControl
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
  const [locationId, setLocationId] = useState(item?.locationId || "");
  const [locations, setLocations] = useState<Models["CatalogResponseDto"][]>(
    [],
  );
  const [locationError, setLocationError] = useState("");
  const [locationsLoading, setLocationsLoading] = useState(true);
  async function loadLocations() {
    setLocationsLoading(true);
    setLocationError("");
    try {
      setLocations(
        (
          await request<Models["CatalogResponseDto"][]>(
            "/api/v1/core/catalogs/locations",
            { public: true },
          )
        ).filter((row) => row.active),
      );
    } catch {
      setLocationError(
        "Locations could not be loaded. Your saved location will be kept unless you clear it.",
      );
    } finally {
      setLocationsLoading(false);
    }
  }
  const [occurredAt, setOccurredAt] = useState(
    item?.occurredAt?.slice(0, 10) || "",
  );
  const [areas, setAreas] = useState(item?.serviceAreas || []);
  const [pendingArea, setPendingArea] = useState("");
  const [availability, setAvailability] = useState(
    item?.availabilityNote || "",
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
    if (collection === "portfolio") void loadLocations();
  }, []);
  const [attempted, setAttempted] = useState(false);
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
  const [priceUnit, setPriceUnit] = useState(item?.priceUnit || "");
  const [inclusions, setInclusions] = useState<string[]>(
    item?.inclusions || [],
  );
  const [pricingNote, setPricingNote] = useState(item?.pricingNote || "");
  const [priceError, setPriceError] = useState("");
  const [inclusionsError, setInclusionsError] = useState("");
  const [until, setUntil] = useState(item?.validUntil?.slice(0, 10) || "");
  const [media, setMedia] = useState<Models["MediaReferenceDto"][]>(
    item?.media || [],
  );
  const [removedImage, setRemovedImage] = useState<{
    image: Models["MediaReferenceDto"];
    index: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEditorState(
    {
      categoryId,
      locationId,
      occurredAt,
      areas,
      pendingArea,
      availability,
      title,
      summary,
      description,
      type,
      pricing,
      amount,
      currency,
      priceUnit,
      inclusions,
      pricingNote,
      until,
      media,
    },
    busy,
    onState,
  );
  async function upload() {
    if (busy || media.length >= 50) return;
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
            altText: "",
          },
        ]);
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  function moveImage(index: number, direction: number) {
    const next = [...media],
      target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setMedia(
      next.map((m, i) => ({ ...m, role: i === 0 ? "COVER" : "GALLERY" })),
    );
  }
  async function save() {
    if (busy) return;
    setAttempted(true);
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
      setPriceError("");
      setInclusionsError("");
      let cleanedInclusions: string[] = [];
      if (collection === "listings") {
        try {
          cleanedInclusions = normalizeInclusions(inclusions);
        } catch (e) {
          setInclusionsError((e as Error).message);
          throw new HttpError(400, "Check what’s included before saving.");
        }
        if (pricingNote.length > 500)
          throw new HttpError(
            400,
            "Keep pricing details within 500 characters.",
          );
      }
      let amountMinor: number | null = null;
      if (collection === "listings" && ["FIXED", "FROM"].includes(pricing)) {
        try {
          amountMinor = amountToMinor(amount, currency.trim().toUpperCase());
        } catch (e) {
          setPriceError((e as Error).message);
          throw new HttpError(400, "Check your price before saving.");
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
      const nextAreas = [...areas];
      const pending = pendingArea.trim();
      if (
        pending &&
        !nextAreas.some((area) => area.toLowerCase() === pending.toLowerCase())
      )
        nextAreas.push(pending);
      if (
        nextAreas.length > 30 ||
        nextAreas.some((area) => !area.trim() || area.length > 100)
      )
        throw new HttpError(
          400,
          "Use up to 30 service areas, each within 100 characters.",
        );
      if (availability.length > 500)
        throw new HttpError(400, "Keep availability within 500 characters.");
      if (
        collection === "portfolio" &&
        occurredAt &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(occurredAt) ||
          !Number.isFinite(Date.parse(occurredAt)) ||
          new Date(occurredAt).toISOString().slice(0, 10) !== occurredAt)
      )
        throw new HttpError(400, "Choose a valid project date.");
      const body = {
        title: title.trim(),
        summary,
        description,
        categoryId: categoryId || null,
        locationId:
          collection === "portfolio"
            ? locationId || null
            : item?.locationId || null,
        occurredAt:
          collection === "portfolio"
            ? occurredAt
              ? item?.occurredAt?.slice(0, 10) === occurredAt
                ? item.occurredAt
                : occurredAt + "T12:00:00.000Z"
              : null
            : item?.occurredAt || null,
        serviceAreas:
          collection === "listings" ? nextAreas : item?.serviceAreas || [],
        availabilityNote:
          collection === "listings"
            ? availability.trim()
            : item?.availabilityNote || "",
        featured: item?.featured || false,
        media: media.map((m, index) => ({
          ...m,
          role: index === 0 ? "COVER" : "GALLERY",
          altText: m.altText.trim(),
          caption: m.caption?.trim() || "",
        })),
        ...(item ? { version: item.version } : {}),
        ...(collection === "listings"
          ? {
              type,
              pricingMode: pricing,
              priceUnit: ["FIXED", "FROM"].includes(pricing)
                ? priceUnit || null
                : null,
              inclusions: cleanedInclusions,
              pricingNote: pricingNote.trim(),
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
        </>
      )}
      <Field
        label="Title"
        error={attempted && !title.trim() ? "Enter a title." : undefined}
        required
        maxLength={160}
        placeholder={
          collection === "portfolio"
            ? "e.g. A garden wedding in Beirut"
            : collection === "gallery"
              ? "e.g. Summer celebrations"
              : type === "PACKAGE"
                ? "e.g. Wedding photography package"
                : "e.g. Full wedding planning"
        }
        value={title}
        onChange={setTitle}
      />
      <SearchSelect
        label="Content category"
        value={categoryId}
        options={[
          { value: "", label: "No category" },
          ...(categoryId && !categories.some((row) => row.id === categoryId)
            ? [{ value: categoryId, label: "Saved category" }]
            : []),
          ...categories.map((c) => ({ value: c.id, label: c.label })),
        ]}
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
            : collection === "listings"
              ? "Describe your service and who it is for. Add individual inclusions below. Required before publishing."
              : "Describe the project and any important details. Required before publishing."
        }
        value={description}
        onChange={setDescription}
        multiline
      />
      {collection === "portfolio" && (
        <Card>
          <Text style={s.h2}>Project details</Text>
          <Text style={s.body}>
            Optional. Help clients understand when and where this work took
            place.
          </Text>
          <DateField
            label="Project date"
            actionLabel="project date"
            value={occurredAt}
            onChange={setOccurredAt}
            hint="Choose the day of the project. Leave blank if a single date does not apply."
          />
          <SearchSelect
            label="Project location"
            value={locationId}
            options={[
              { value: "", label: "No location" },
              ...(locationId && !locations.some((row) => row.id === locationId)
                ? [{ value: locationId, label: "Saved location" }]
                : []),
              ...locations.map((row) => ({ value: row.id, label: row.label })),
            ]}
            onSelect={setLocationId}
          />
          {!!locationId && !locations.some((row) => row.id === locationId) && (
            <Text style={s.body}>
              Saved location retained. Choose another location or clear it to
              change it.
            </Text>
          )}
          {locationsLoading && <Text style={s.body}>Loading locations…</Text>}
          {!!locationId && (
            <Button
              label="Clear project location"
              secondary
              onPress={() => setLocationId("")}
            />
          )}
          {!!locationError && (
            <>
              <Text accessibilityRole="alert" style={s.error}>
                {locationError}
              </Text>
              <Button
                label="Retry locations"
                secondary
                onPress={() => void loadLocations()}
              />
            </>
          )}
          {!locationsLoading && !locationError && !locations.length && (
            <Text style={s.body}>
              No locations available yet. You can still save your project.
            </Text>
          )}
        </Card>
      )}
      {collection === "listings" && (
        <>
          <ListingPricingFields
            pricing={pricing}
            onPricing={setPricing}
            amount={amount}
            onAmount={(v) => {
              setAmount(v);
              setPriceError("");
            }}
            currency={currency}
            onCurrency={(v) => {
              setCurrency(v);
              setPriceError("");
            }}
            unit={priceUnit}
            onUnit={setPriceUnit}
            inclusions={inclusions}
            onInclusions={(v) => {
              setInclusions(v);
              setInclusionsError("");
            }}
            note={pricingNote}
            onNote={setPricingNote}
            priceError={priceError}
            inclusionsError={inclusionsError}
          />
          {item?.type === "OFFER" && type !== "OFFER" && !!item.validUntil && (
            <Text style={s.body}>
              Changing this offer to another listing type removes its offer
              dates when you save.
            </Text>
          )}
          {type === "OFFER" && <DateField value={until} onChange={setUntil} />}
        </>
      )}
      {collection === "listings" && (
        <Card>
          <Text style={s.h2}>Where & when</Text>
          <ServiceAreas
            areas={areas}
            onChange={setAreas}
            pending={pendingArea}
            onPending={setPendingArea}
            hint="Optional. Areas covered by this listing only. This does not change your business service areas."
          />
          <Field
            label="Availability note"
            value={availability}
            onChange={setAvailability}
            maxLength={500}
            hint="Optional. Explain lead times or seasonal availability. This is information for clients, not a booking calendar."
            placeholder="e.g. Book at least four weeks ahead"
            multiline
          />
        </Card>
      )}
      <Text style={s.h2}>Images · {media.length} / 50</Text>
      <Text style={s.body}>
        The cover is the first image clients see. Add JPEG, PNG or WebP images
        up to 5 MB each. Describe what each image shows for people using screen
        readers.
      </Text>
      {!media.length && (
        <Card>
          <Text style={s.body}>
            Start with your strongest image. You can add images after saving a
            draft.
          </Text>
        </Card>
      )}
      {media.map((m, i) => (
        <Card key={m.mediaId}>
          <Text style={s.label}>
            {i === 0 ? "Cover image" : `Image ${i + 1}`}
          </Text>
          <Photo id={m.mediaId} org={org} alt={m.altText || `Image ${i + 1}`} />
          <Field
            label="Image description for accessibility"
            error={
              attempted && !m.altText.trim()
                ? "Describe what this image shows."
                : undefined
            }
            required
            maxLength={300}
            placeholder="e.g. White roses around an outdoor wedding arch"
            value={m.altText}
            onChange={(altText) =>
              setMedia(media.map((x, j) => (i === j ? { ...x, altText } : x)))
            }
          />
          <Field
            label={`Caption for image ${i + 1}`}
            value={m.caption || ""}
            maxLength={1000}
            hint="Optional. Shown below the image; separate from its accessibility description."
            onChange={(caption) =>
              setMedia(media.map((x, j) => (i === j ? { ...x, caption } : x)))
            }
          />
          <View style={s.grid}>
            <Button
              label="Earlier"
              accessibilityLabel={`Move image ${i + 1} earlier`}
              secondary
              disabled={busy || i === 0}
              onPress={() => moveImage(i, -1)}
            />
            <Button
              label="Later"
              accessibilityLabel={`Move image ${i + 1} later`}
              secondary
              disabled={busy || i === media.length - 1}
              onPress={() => moveImage(i, 1)}
            />
            {i > 0 && (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
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
              disabled={busy}
              style={{ minHeight: 44, justifyContent: "center" }}
              onPress={() => {
                setRemovedImage({ image: m, index: i });
                setMedia(
                  media
                    .filter((_, j) => j !== i)
                    .map((x, j) => ({ ...x, role: j ? "GALLERY" : "COVER" })),
                );
              }}
            >
              <Text style={s.link}>Remove</Text>
            </Pressable>
          </View>
        </Card>
      ))}
      {!!removedImage && (
        <Button
          label="Undo last image removal"
          secondary
          disabled={busy || media.length >= 50}
          onPress={() => {
            const next = [...media];
            next.splice(
              Math.min(removedImage.index, next.length),
              0,
              removedImage.image,
            );
            setMedia(
              next.map((m, i) => ({
                ...m,
                role: i === 0 ? "COVER" : "GALLERY",
              })),
            );
            setRemovedImage(null);
          }}
        />
      )}
      <Text style={s.body}>
        Removing an image removes it from this item when you save. It does not
        delete the original upload.
      </Text>
      <Button
        label={busy ? "Please wait…" : "Add image"}
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
      <SaveControl
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
