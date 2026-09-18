import {
  ProfileSections,
  profileSectionTitles,
  type ProfileSection,
} from "./mobile/ProfileSections";
import { CategoryDetailsForm } from "./mobile/CategoryDetails";
import { ProfilePreview } from "./mobile/ProfilePreview";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import {
  Button,
  Card,
  C,
  Field,
  Heading,
  Icon,
  Photo,
  Planned,
  s,
  Tag,
} from "./mobile/ui";
import { active, loadSnapshot, type Snapshot } from "./mobile/data";
import {
  authorization,
  explain,
  HttpError,
  request,
  restore,
  session,
  store,
  type Collection,
  type Content,
  type Models,
} from "./mobile/service";
import { BusinessForm, ContentForm, ProfileForm } from "./mobile/editors";
import { WelcomeScreen } from "./mobile/WelcomeScreen";
import { readinessLabel } from "./src/formatting";
import { AuthForm } from "./mobile/AuthForm";
type Tab = "Overview" | "Portfolio" | "Listings" | "Profile";
type Editor =
  | { kind: "business" | "preview" | "share" | "details" }
  | { kind: "profile"; section?: ProfileSection }
  | {
      kind: "content";
      collection: Collection;
      item?: Content;
      initialType?: NonNullable<Content["type"]>;
    };
function formatPrice(amount: number, currency: string | null) {
  if (!currency) return "Price on request";
  try {
    const format = new Intl.NumberFormat("en", { style: "currency", currency });
    const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
    return format.format(amount / 10 ** digits);
  } catch {
    return "Price on request";
  }
}
function AppBody() {
  const [ready, setReady] = useState(false);
  const [signed, setSigned] = useState(false);
  const [members, setMembers] = useState<Models["MembershipDto"][]>([]);
  const [org, setOrg] = useState("");
  const [data, setData] = useState<Snapshot | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [gallery, setGallery] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [share, setShare] = useState<Models["ShareDto"] | null>(null);
  const [publicData, setPublicData] = useState<
    Models["PublicPresenceDto"] | null
  >(null);
  const [modalError, setModalError] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [notice, setNotice] = useState("");
  const [editorState, setEditorState] = useState({ dirty: false, busy: false });
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    label: string;
    accept: () => void;
  } | null>(null);
  const generation = useRef(0);
  function closeEditor() {
    if (editorState.busy) return;
    if (
      editorState.dirty &&
      editor &&
      !["preview", "share"].includes(editor.kind)
    ) {
      setConfirmation({
        title: "Discard unsaved changes?",
        message: "Your edits have not been saved.",
        label: "Discard changes",
        accept: () => setEditor(null),
      });
    } else setEditor(null);
  }
  useEffect(() => {
    setEditorState({ dirty: false, busy: false });
  }, [editor]);

  const role = members.find((m) => m.organizationId === org)?.role;
  const edit = role === "OWNER" || role === "EDITOR";
  async function reset() {
    generation.current++;
    setSigned(false);
    setOrg("");
    setMembers([]);
    setData(null);
    setEditor(null);
    setShare(null);
    setPublicData(null);
    setError("");
    setNotice("");
    setConfirmation(null);
    setLoading(false);
    setTab("Overview");
  }
  async function membership() {
    const list = await request<Models["MembershipDto"][]>(
      "/api/v1/core/memberships",
    );
    setMembers(list);
    setOrg((current) =>
      list.some((x) => x.organizationId === current)
        ? current
        : list[0]?.organizationId || "",
    );
  }
  useEffect(() => {
    void (async () => {
      try {
        if (await restore()) {
          await membership();
          setSigned(true);
        }
      } catch (e) {
        setError(explain(e));
      } finally {
        setReady(true);
      }
    })();
  }, []);
  async function refresh() {
    if (!org) return;
    const run = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const value = await loadSnapshot(org);
      if (run === generation.current) setData(value);
    } catch (e) {
      if (run !== generation.current) return;
      if (e instanceof HttpError && e.status === 401) {
        await reset();
      }
      setError(explain(e));
    } finally {
      if (run === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    setData(null);
    setEditor(null);
    setShare(null);
    setPublicData(null);
    setFilter("ALL");
    if (org) void refresh();
    return () => {
      generation.current++;
    };
  }, [org]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(explain(e));
      if (e instanceof HttpError && e.status === 401) {
        await reset();
        setError("Please sign in again.");
      }
    } finally {
      setBusy(false);
    }
  }
  async function saved() {
    setNotice("Changes saved.");
    setEditor(null);
    await refresh();
  }
  async function logout() {
    await run(async () => {
      try {
        await session.logout();
      } finally {
        await reset();
      }
    });
  }
  async function showPublic() {
    if (!data?.profile) return;
    setPublicData(null);
    setModalError("");
    setEditor({ kind: "preview" });
    if (!data.profile.published) {
      setModalError(
        "Your page is still a draft. This preview shows saved management content; publish to enable the public page.",
      );
      return;
    }
    try {
      setPublicData(
        await request<Models["PublicPresenceDto"]>(
          `/api/v1/presence/public/${data.profile.slug}`,
          { public: true },
        ),
      );
    } catch (e) {
      setModalError(explain(e));
    }
  }
  async function showShare() {
    if (!data?.profile) return;
    setShare(null);
    setNotice("");
    setModalError("");
    setEditor({ kind: "share" });
    try {
      const value = await request<Models["ShareDto"]>(
        `/api/v1/presence/public/${data.profile.slug}/share`,
        { public: true },
      );
      if (new URL(value.url).protocol !== "https:")
        throw new Error("Invalid share URL");
      setShare(value);
    } catch {
      setModalError(
        "Public website sharing is not available yet. Your profile must be published and the public website configured.",
      );
    }
  }
  async function lifecycle(
    collection: Collection,
    item: Content,
    action: "publish" | "unpublish" | "restore" | "archive",
  ) {
    await run(async () => {
      await request(
        `/api/v1/presence/collections/${collection}/${item.id}${action === "archive" ? "" : "/" + action}`,
        {
          org,
          method: action === "archive" ? "DELETE" : "POST",
          body: { version: item.version },
        },
      );
      await refresh();
    });
  }
  if (!ready)
    return (
      <View style={[s.root, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={C.blue} />
      </View>
    );
  if (!signed)
    return (
      <AuthScreen
        initialError={error}
        onSigned={async () => {
          await membership();
          setSigned(true);
          setError("");
        }}
      />
    );
  if (!members.length)
    return (
      <LinearGradient
        colors={["#94AAFF", "#E6EBFF", "#F9FAFF"]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              s.page,
              {
                backgroundColor: "transparent",
                width: "100%",
                maxWidth: 680,
                alignSelf: "center",
                paddingTop: 32,
                paddingBottom: 40,
              },
            ]}
          >
            <Text style={[s.h1, { fontSize: 32, lineHeight: 38 }]}>
              Welcome to Presence
            </Text>
            <BusinessForm onSaved={membership} />
            <Button label="Sign out" secondary onPress={() => void logout()} />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  const p = data?.profile;
  const supplier = data?.supplier;
  function switchTab(value: Tab) {
    setTab(value);
    setGallery(false);
    setFilter("ALL");
    setNotice("");
  }
  function contentCards(collection: Collection) {
    const items = data?.content[collection] || [];
    const list = items.filter((x) =>
      filter === "ARCHIVED"
        ? x.status === "ARCHIVED"
        : x.status !== "ARCHIVED" && (filter === "ALL" || x.type === filter),
    );
    return (
      <>
        <View style={s.row}>
          <Text style={s.h1}>
            {collection === "portfolio"
              ? "Portfolio"
              : collection === "gallery"
                ? "Gallery"
                : "Listings"}
          </Text>
          {edit && (
            <Button
              label="+ Add"
              disabled={!p || busy}
              onPress={() =>
                setEditor({
                  kind: "content",
                  collection,
                  ...(collection === "listings" &&
                  ["PRODUCT", "SERVICE", "PACKAGE", "OFFER"].includes(filter)
                    ? { initialType: filter as NonNullable<Content["type"]> }
                    : {}),
                })
              }
            />
          )}
        </View>
        <Text style={s.body}>
          {collection === "listings"
            ? "Your products, services, packages and offers."
            : "Show clients the work that makes your business yours."}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {[
            "ALL",
            ...(collection === "listings"
              ? ["PRODUCT", "SERVICE", "PACKAGE", "OFFER"]
              : []),
            "ARCHIVED",
          ].map((x) => (
            <Button
              key={x}
              label={x.charAt(0) + x.slice(1).toLowerCase()}
              secondary={filter !== x}
              selected={filter === x}
              onPress={() => setFilter(x)}
            />
          ))}
        </ScrollView>
        {!p && (
          <Card>
            <Text style={s.body}>Create your Presence profile first.</Text>
            {edit && (
              <Button
                label="Set up profile"
                onPress={() => setEditor({ kind: "profile" })}
              />
            )}
          </Card>
        )}
        {!list.length && (
          <Card>
            <Icon name="images-outline" size={32} />
            <Text style={s.h2}>
              {filter === "ARCHIVED"
                ? "No archived items"
                : filter !== "ALL"
                  ? "No matching listings"
                  : "A fresh start"}
            </Text>
            <Text style={s.body}>
              {filter === "ARCHIVED"
                ? "Items you archive will appear here. You can restore them as drafts."
                : !edit
                  ? "An owner or editor can add content for this business."
                  : !p
                    ? "Set up your profile to start adding content."
                    : filter !== "ALL"
                      ? "Choose All to see your other listings, or add a listing of this type."
                      : "Add your first item when you’re ready. It will be saved as a draft."}
            </Text>
          </Card>
        )}
        {list.map((item) => (
          <Card key={item.id}>
            <Photo
              id={
                item.media.find((m) => m.role === "COVER")?.mediaId ||
                item.media[0]?.mediaId
              }
              org={org}
              height={210}
            />
            <View style={s.row}>
              <Text style={[s.h2, { flex: 1 }]}>{item.title}</Text>
              <Tag
                text={
                  "status" in item ? String(item.status).toLowerCase() : "draft"
                }
              />
            </View>
            {!!item.summary && <Text style={s.body}>{item.summary}</Text>}
            {collection === "listings" && (
              <Text style={s.label}>
                {item.type?.toLowerCase()} ·{" "}
                {item.pricingMode === "FROM" ? "From " : ""}
                {item.pricingMode === "FREE"
                  ? "Free"
                  : item.amountMinor !== null
                    ? formatPrice(item.amountMinor, item.currency)
                    : "Price on request"}
              </Text>
            )}
            {edit && (
              <View style={s.grid}>
                {item.status !== "ARCHIVED" && (
                  <Button
                    label="Edit"
                    secondary
                    disabled={busy}
                    onPress={() =>
                      setEditor({ kind: "content", collection, item })
                    }
                  />
                )}
                <Button
                  label={
                    item.status === "ARCHIVED"
                      ? "Restore draft"
                      : item.status === "PUBLISHED"
                        ? "Unpublish"
                        : "Publish"
                  }
                  disabled={busy}
                  onPress={() =>
                    void lifecycle(
                      collection,
                      item,
                      item.status === "ARCHIVED"
                        ? "restore"
                        : item.status === "PUBLISHED"
                          ? "unpublish"
                          : "publish",
                    )
                  }
                />
                {item.status !== "ARCHIVED" && (
                  <Button
                    label="Archive"
                    secondary
                    disabled={busy}
                    onPress={() =>
                      setConfirmation({
                        title: "Archive this item?",
                        message:
                          "It will be removed from the public page. You can restore it as a draft.",
                        label: "Archive item",
                        accept: () =>
                          void lifecycle(collection, item, "archive"),
                      })
                    }
                  />
                )}
              </View>
            )}
          </Card>
        ))}
      </>
    );
  }
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      <View
        style={{ flex: 1 }}
        aria-hidden={!!editor || !!confirmation}
        accessibilityElementsHidden={!!editor || !!confirmation}
        importantForAccessibility={
          editor || confirmation ? "no-hide-descendants" : "auto"
        }
      >
        <View
          style={[
            s.row,
            {
              paddingHorizontal: 22,
              paddingVertical: 14,
              backgroundColor: "#fff",
              borderBottomWidth: 1,
              borderColor: C.line,
            },
          ]}
        >
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <LinearGradient
              colors={["#235AFF", "#45BBE5"]}
              style={{
                width: 28,
                height: 28,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="ellipse-outline" color="#fff" size={18} />
            </LinearGradient>
            <Text style={{ fontSize: 16, fontWeight: "800", color: C.ink }}>
              Events Circle
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile and account"
            onPress={() => switchTab("Profile")}
            style={{
              backgroundColor: "#EBF0FF",
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="person-outline" size={18} />
          </Pressable>
        </View>
        <ScrollView
          key={tab + String(gallery)}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => void refresh()}
              tintColor={C.blue}
            />
          }
          contentContainerStyle={s.page}
          keyboardShouldPersistTaps="handled"
        >
          {!!error && (
            <>
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
              <Button label="Retry" secondary onPress={() => void refresh()} />
            </>
          )}
          {!!notice && !editor && (
            <Text accessibilityRole="alert" style={s.body}>
              {notice}
            </Text>
          )}
          {loading && (
            <View style={s.row}>
              <ActivityIndicator color={C.blue} />
              <Text style={s.body}>Loading your business…</Text>
            </View>
          )}
          {!data && !loading && (
            <Card>
              <Text style={s.body}>Your business could not be loaded.</Text>
            </Card>
          )}
          {data && tab === "Overview" && (
            <>
              <View>
                <Text style={s.h1}>My Presence</Text>
                <Text style={[s.body, { marginTop: 6 }]}>
                  Showcase your business. Make your next connection.
                </Text>
              </View>
              <LinearGradient
                colors={["#235AFF", "#427EF7", "#41A9D5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 21, borderRadius: 22, gap: 17 }}
              >
                <View style={s.row}>
                  <View
                    style={{
                      width: 78,
                      height: 78,
                      borderRadius: 39,
                      borderWidth: 6,
                      borderColor: "#92DCEB",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}
                    >
                      {data.readiness?.score || 0}%
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
                    >
                      Profile completion
                    </Text>
                    <Text
                      style={{
                        color: "#E7F0FF",
                        fontSize: 13,
                        lineHeight: 19,
                        marginTop: 5,
                      }}
                    >
                      {p?.published
                        ? "Your profile is published."
                        : data.readiness?.ready
                          ? "Your profile is ready to publish."
                          : `Complete your profile to help clients discover you.`}
                    </Text>
                  </View>
                </View>
                {!!data.readiness?.missing.length && (
                  <Text style={{ color: "#FFFFFF", lineHeight: 21 }}>
                    Next:{" "}
                    {data.readiness.missing.map(readinessLabel).join(" · ")}
                  </Text>
                )}
                {edit && (
                  <Button
                    label={
                      p?.published ? "Edit profile →" : "Complete profile →"
                    }
                    secondary
                    onPress={() => setEditor({ kind: "profile" })}
                  />
                )}
                <Text style={{ color: "#EAF2FF", fontSize: 11 }}>
                  Circle AI assistance · Coming later
                </Text>
              </LinearGradient>
              <Heading
                title="Business identity"
                {...(role === "OWNER"
                  ? {
                      action: "Edit",
                      onPress: () => setEditor({ kind: "business" }),
                    }
                  : {})}
              />
              <Card>
                <Photo id={p?.coverMediaId} org={org} height={132} />
                <View
                  style={{
                    flexDirection: "row",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  <View style={{ width: 58 }}>
                    <Photo id={p?.logoMediaId} org={org} height={58} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.h2}>{supplier?.businessName}</Text>
                    <Text style={s.body}>{supplier?.category}</Text>
                    <Text style={[s.body, { fontSize: 12 }]}>
                      {supplier?.city}
                    </Text>
                  </View>
                </View>
              </Card>
              <Heading title="Public portfolio" />
              <Card>
                <View style={s.row}>
                  <Text style={[s.label, { flex: 1 }]}>
                    /p/{p?.slug || "your-business"}
                  </Text>
                  <Tag text={p?.published ? "Published" : "Draft"} />
                </View>
                <Text style={s.body}>
                  Your business, work and listings in one place.
                </Text>
                <View style={s.grid}>
                  <Button
                    label="Preview page"
                    secondary
                    disabled={!p}
                    onPress={() => void showPublic()}
                  />
                  <Button
                    label="Link & QR"
                    secondary
                    disabled={!p?.published}
                    onPress={() => void showShare()}
                  />
                </View>
                <Text style={[s.body, { fontSize: 12 }]}>
                  Sharing becomes available after your public website is
                  connected.
                </Text>
              </Card>
              <Heading
                title="Listings snapshot"
                action="Manage"
                onPress={() => switchTab("Listings")}
              />
              <View style={s.grid}>
                {(["PRODUCT", "SERVICE", "PACKAGE", "OFFER"] as const).map(
                  (type, i) => (
                    <Pressable
                      key={type}
                      style={s.tile}
                      accessibilityRole="button"
                      onPress={() => {
                        switchTab("Listings");
                        setFilter(type);
                      }}
                    >
                      <LinearGradient
                        colors={
                          (
                            [
                              ["#ECF1FF", "#F9FBFF"],
                              ["#E5F6F1", "#F9FDFC"],
                              ["#F4ECFF", "#FDFBFF"],
                              ["#FFF0E5", "#FFFCF9"],
                            ] as const
                          )[i]!
                        }
                        style={{
                          padding: 17,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: C.line,
                          gap: 9,
                        }}
                      >
                        <Icon
                          name={
                            (
                              [
                                "cube-outline",
                                "construct-outline",
                                "gift-outline",
                                "pricetag-outline",
                              ] as const
                            )[i]!
                          }
                        />
                        <Text
                          style={{
                            fontSize: 25,
                            fontWeight: "800",
                            color: C.ink,
                          }}
                        >
                          {
                            active(data.content.listings).filter(
                              (x) => x.type === type,
                            ).length
                          }
                        </Text>
                        <Text style={s.label}>
                          {type.charAt(0) + type.slice(1).toLowerCase()}s
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  ),
                )}
              </View>
              <Heading
                title="Portfolio projects"
                action="View all"
                onPress={() => switchTab("Portfolio")}
              />
              {!active(data.content.portfolio).length ? (
                <Card>
                  <Text style={s.body}>
                    Give your next client a glimpse of what you do.
                  </Text>
                  {edit && (
                    <Button
                      label="Add your first project"
                      secondary
                      disabled={!p}
                      onPress={() =>
                        setEditor({ kind: "content", collection: "portfolio" })
                      }
                    />
                  )}
                </Card>
              ) : (
                <View style={s.grid}>
                  {active(data.content.portfolio)
                    .slice(0, 2)
                    .map((item) => (
                      <Pressable
                        key={item.id}
                        style={s.tile}
                        onPress={() => switchTab("Portfolio")}
                      >
                        <Photo id={item.media[0]?.mediaId} org={org} />
                        <Text style={[s.label, { marginTop: 8 }]}>
                          {item.title}
                        </Text>
                        <Text style={s.body}>{item.status.toLowerCase()}</Text>
                      </Pressable>
                    ))}
                </View>
              )}
              <Planned
                title="Event posts"
                description="Your posts and updates will appear here when Content Studio is available."
              />
              <Planned
                title="Hosted events"
                description="Upcoming events, dates and venues will appear here when Hosted Events is available."
              />
              <Planned
                title="Reviews summary"
                description="Client ratings and feedback are planned for a later Presence release."
              />
              <Heading
                title="Contact actions"
                {...(role === "OWNER"
                  ? {
                      action: "Edit",
                      onPress: () => setEditor({ kind: "business" }),
                    }
                  : {})}
              />
              <Card>
                {[
                  [
                    "mail-outline",
                    "Inquiry",
                    supplier?.acceptInquiries &&
                    data.modules.some((m) => m.id === "leads" && m.enabled)
                      ? "Enabled"
                      : "Disabled",
                  ],
                  ["logo-whatsapp", "WhatsApp", "Coming later"],
                  ["calendar-outline", "Consultation", "Coming later"],
                ].map(([icon, label, status]) => (
                  <View key={label} style={[s.row, { paddingVertical: 7 }]}>
                    <Icon
                      name={icon as React.ComponentProps<typeof Icon>["name"]}
                    />
                    <Text style={[s.label, { flex: 1 }]}>{label}</Text>
                    <Tag text={status!} />
                  </View>
                ))}
              </Card>
              <Heading
                title="Gallery"
                action="Manage"
                onPress={() => {
                  setTab("Portfolio");
                  setGallery(true);
                  setFilter("ALL");
                }}
              />
              {!active(data.content.gallery).length ? (
                <Card>
                  <Text style={s.body}>
                    Add a collection of images to bring your page to life.
                  </Text>
                </Card>
              ) : (
                <View style={s.grid}>
                  {active(data.content.gallery)
                    .flatMap((x) => x.media)
                    .slice(0, 4)
                    .map((m, i) => (
                      <View key={m.mediaId + i} style={s.tile}>
                        <Photo id={m.mediaId} org={org} />
                      </View>
                    ))}
                </View>
              )}
            </>
          )}
          {data && tab === "Portfolio" && (
            <>
              <View style={s.grid}>
                <Button
                  label="Projects"
                  secondary={gallery}
                  selected={!gallery}
                  onPress={() => {
                    setGallery(false);
                    setFilter("ALL");
                  }}
                />
                <Button
                  label="Gallery"
                  secondary={!gallery}
                  selected={gallery}
                  onPress={() => {
                    setGallery(true);
                    setFilter("ALL");
                  }}
                />
              </View>
              {contentCards(gallery ? "gallery" : "portfolio")}
            </>
          )}
          {data && tab === "Listings" && contentCards("listings")}
          {data && tab === "Profile" && (
            <>
              <Text style={s.h1}>Your public profile</Text>
              <Text style={s.body}>
                {supplier?.businessName} · {role?.toLowerCase()}
              </Text>
              <Text style={s.body}>
                Build a page that helps clients understand your business. Edit
                one section at a time.
              </Text>
              <ProfileSections
                data={data}
                canEdit={edit}
                isOwner={role === "OWNER"}
                onBusiness={() => setEditor({ kind: "business" })}
                onDetails={() =>
                  setEditor({ kind: data.profile ? "details" : "profile" })
                }
                onEdit={(section) => setEditor({ kind: "profile", section })}
              />
              <Card>
                <Text style={s.h2}>Preview and publishing</Text>
                <Tag text={p?.published ? "Published" : "Draft"} />
                <Text style={s.body}>
                  {data.readiness?.missing.length
                    ? `Still needed: ${data.readiness.missing.map(readinessLabel).join(", ")}`
                    : !p
                      ? "Create your Presence profile before publishing."
                      : "Your profile details are ready."}
                </Text>
                {edit && (
                  <>
                    <Button
                      label="Edit all profile details"
                      secondary
                      onPress={() => setEditor({ kind: "profile" })}
                    />
                    <Button
                      label={p?.published ? "Unpublish page" : "Publish page"}
                      secondary={!!p?.published}
                      disabled={
                        busy || !p || (!p.published && !data.readiness?.ready)
                      }
                      onPress={() =>
                        void run(async () => {
                          await request(
                            `/api/v1/presence/profile/${p?.published ? "unpublish" : "publish"}`,
                            {
                              org,
                              method: "POST",
                              body: { version: p?.version },
                            },
                          );
                          await refresh();
                        })
                      }
                    />
                  </>
                )}
              </Card>
              <Button
                label="Preview page"
                secondary
                disabled={!p}
                onPress={() => void showPublic()}
              />
              <Button
                label="Link & QR"
                secondary
                disabled={!p?.published}
                onPress={() => void showShare()}
              />
              <Heading title="Your businesses" />
              {members.map((m) => (
                <Button
                  key={m.organizationId}
                  label={`${m.organization.name}${m.organizationId === org ? " · Current" : ""}`}
                  secondary={m.organizationId !== org}
                  onPress={() => setOrg(m.organizationId)}
                />
              ))}
              <Text style={s.body}>
                {role === "VIEWER"
                  ? "You have view-only access. Ask an owner to update your permissions if you need to edit."
                  : "Your business details are shared across Events Circle."}
              </Text>
              <Button
                label={loading ? "Refreshing…" : "Refresh data"}
                secondary
                disabled={loading || busy}
                onPress={() => void refresh()}
              />
              <Button
                label="Sign out"
                secondary
                disabled={busy}
                onPress={() => void logout()}
              />
            </>
          )}
        </ScrollView>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderColor: C.line,
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          {(["Overview", "Portfolio", "Listings", "Profile"] as const).map(
            (name, i) => (
              <Pressable
                key={name}
                accessibilityRole="tab"
                accessibilityLabel={name}
                accessibilityState={{ selected: tab === name }}
                aria-selected={tab === name}
                onPress={() => switchTab(name)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 9,
                  gap: 5,
                  backgroundColor: tab === name ? "#EEF3FF" : "#fff",
                }}
              >
                <Icon
                  name={
                    (
                      [
                        "home-outline",
                        "images-outline",
                        "grid-outline",
                        "person-outline",
                      ] as const
                    )[i]!
                  }
                  color={tab === name ? C.blue : C.muted}
                />
                <Text
                  style={{
                    fontSize: 11,
                    color: tab === name ? C.blue : C.muted,
                    fontWeight: tab === name ? "700" : "400",
                  }}
                >
                  {name}
                </Text>
              </Pressable>
            ),
          )}
        </View>
      </View>
      <Modal
        visible={!!editor}
        animationType={Platform.OS === "web" ? "none" : "slide"}
        onRequestClose={closeEditor}
      >
        <SafeAreaView
          style={s.root}
          aria-hidden={!!confirmation}
          accessibilityElementsHidden={!!confirmation}
        >
          <View style={[s.row, { padding: 18 }]}>
            <Text style={[s.h2, { flex: 1 }]}>
              {editor?.kind === "details"
                ? "Category details"
                : editor?.kind === "business"
                  ? "Business details"
                  : editor?.kind === "profile"
                    ? profileSectionTitles[editor.section || "all"]
                    : editor?.kind === "content"
                      ? (editor.item ? "Edit " : "New ") +
                        (editor.collection === "portfolio"
                          ? "project"
                          : editor.collection === "gallery"
                            ? "gallery"
                            : "listing")
                      : editor?.kind === "share"
                        ? "Share your page"
                        : "Page preview"}
            </Text>
            <Button
              label="Close"
              secondary
              disabled={editorState.busy}
              onPress={closeEditor}
            />
          </View>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[s.page, { backgroundColor: "#EDF0FF" }]}
            >
              {data && editor?.kind === "profile" && (
                <ProfileForm
                  section={editor.section}
                  data={data}
                  org={org}
                  onSaved={saved}
                  onState={setEditorState}
                />
              )}
              {data && editor?.kind === "details" && (
                <CategoryDetailsForm
                  data={data}
                  org={org}
                  onSaved={saved}
                  onState={setEditorState}
                />
              )}
              {data && editor?.kind === "business" && (
                <BusinessForm
                  supplier={data.supplier}
                  org={org}
                  onSaved={saved}
                  onState={setEditorState}
                />
              )}
              {editor?.kind === "content" && (
                <ContentForm
                  collection={editor.collection}
                  initialType={editor.initialType}
                  item={editor.item}
                  org={org}
                  onSaved={saved}
                  onState={setEditorState}
                />
              )}
              {editor?.kind === "share" && (
                <>
                  <Text style={s.h1}>Share your presence</Text>
                  {modalError ? (
                    <Text style={s.body}>{modalError}</Text>
                  ) : share ? (
                    <Card>
                      {!!notice && (
                        <Text accessibilityRole="alert" style={s.body}>
                          {notice}
                        </Text>
                      )}
                      <View style={{ alignItems: "center", padding: 16 }}>
                        <QRCode value={share.qrPayload} size={190} />
                      </View>
                      <Text selectable style={s.body}>
                        {share.url}
                      </Text>
                      <Button
                        label="Open public page"
                        onPress={() =>
                          void Linking.openURL(share.url).catch(() =>
                            setModalError("Could not open this link."),
                          )
                        }
                      />
                      <Button
                        label={
                          Platform.OS === "web"
                            ? "Copy link to share"
                            : "Share link"
                        }
                        secondary
                        onPress={() =>
                          void (
                            Platform.OS === "web"
                              ? Clipboard.setStringAsync(share.url).then(() =>
                                  setNotice("Link copied. Ready to paste."),
                                )
                              : Share.share({ message: share.url })
                          ).catch(() =>
                            setModalError(
                              "Could not share this link. You can select and copy the address above.",
                            ),
                          )
                        }
                      />
                      <Button
                        label="Copy link"
                        secondary
                        onPress={() =>
                          void Clipboard.setStringAsync(share.url)
                            .then(() =>
                              setNotice("Link copied. Ready to paste."),
                            )
                            .catch(() =>
                              setModalError("Could not copy the link."),
                            )
                        }
                      />
                    </Card>
                  ) : (
                    <ActivityIndicator />
                  )}
                </>
              )}
              {editor?.kind === "preview" && (
                <>
                  {!!modalError && <Text style={s.body}>{modalError}</Text>}
                  {p?.published && !publicData && !modalError ? (
                    <ActivityIndicator />
                  ) : p?.published && modalError ? (
                    <Button
                      label="Retry preview"
                      onPress={() => void showPublic()}
                    />
                  ) : (
                    data && (
                      <ProfilePreview
                        data={data}
                        publicData={publicData}
                        org={org}
                      />
                    )
                  )}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      <Modal
        visible={!!confirmation}
        transparent
        animationType={Platform.OS === "web" ? "none" : "fade"}
        onRequestClose={() => setConfirmation(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#10224980",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={[
              s.card,
              { width: "100%", maxWidth: 420, alignSelf: "center" },
            ]}
          >
            <Text accessibilityRole="header" style={s.h2}>
              {confirmation?.title}
            </Text>
            <Text style={s.body}>{confirmation?.message}</Text>
            <Button
              label={
                confirmation?.label === "Discard changes"
                  ? "Keep editing"
                  : "Cancel"
              }
              secondary
              onPress={() => setConfirmation(null)}
            />
            <Button
              label={confirmation?.label || "Confirm"}
              onPress={() => {
                const action = confirmation?.accept;
                setConfirmation(null);
                action?.();
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
function AuthScreen({
  onSigned,
  initialError,
}: {
  onSigned: () => Promise<void>;
  initialError: string;
}) {
  const [welcome, setWelcome] = useState(true);
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        throw new HttpError(400, "Enter a valid email address.");
      if (register && (password.length < 12 || password.length > 128))
        throw new HttpError(
          400,
          "Choose a password between 12 and 128 characters.",
        );
      if (register)
        await session.register({
          email: email.trim(),
          password,
          displayName: name.trim(),
        });
      else await session.login({ email: email.trim(), password });
      await onSigned();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  }
  if (welcome)
    return (
      <WelcomeScreen
        error={error}
        onEmail={() => {
          setRegister(true);
          setWelcome(false);
        }}
        onLogin={() => {
          setRegister(false);
          setWelcome(false);
        }}
      />
    );
  return (
    <AuthForm
      register={register}
      busy={busy}
      error={error}
      name={name}
      email={email}
      password={password}
      setName={setName}
      setEmail={setEmail}
      setPassword={setPassword}
      onBack={() => setWelcome(true)}
      onSwitch={() => {
        setRegister(!register);
        setError("");
      }}
      onSubmit={() => void submit()}
    />
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        <AppBody />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
