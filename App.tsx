import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { AuthForm } from "./mobile/AuthForm";
type Tab = "Overview" | "Portfolio" | "Listings" | "Profile";
type Editor =
  | { kind: "profile" | "business" | "preview" | "share" }
  | { kind: "content"; collection: Collection; item?: Content };
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
  const generation = useRef(0);
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
      <ScrollView contentContainerStyle={s.page}>
        <Text style={s.h1}>Welcome to Presence</Text>
        <BusinessForm onSaved={membership} />
        <Button label="Sign out" secondary onPress={() => void logout()} />
      </ScrollView>
    );
  const p = data?.profile;
  const supplier = data?.supplier;
  function switchTab(value: Tab) {
    setTab(value);
    setGallery(false);
    setFilter("ALL");
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
              onPress={() => setEditor({ kind: "content", collection })}
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
            <Text style={s.h2}>A fresh start</Text>
            <Text style={s.body}>
              Your {collection} will appear here. Add your first item when
              you’re ready.
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
              <Tag text={item.status.toLowerCase()} />
            </View>
            {!!item.summary && <Text style={s.body}>{item.summary}</Text>}
            {collection === "listings" && (
              <Text style={s.label}>
                {item.type} ·{" "}
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
                      Alert.alert(
                        "Archive this item?",
                        "It will be removed from the public page. You can restore it as a draft.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Archive",
                            style: "destructive",
                            onPress: () =>
                              void lifecycle(collection, item, "archive"),
                          },
                        ],
                      )
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
                    Make it yours
                  </Text>
                  <Text
                    style={{
                      color: "#E7F0FF",
                      fontSize: 13,
                      lineHeight: 19,
                      marginTop: 5,
                    }}
                  >
                    {data.readiness?.ready
                      ? "Your profile is ready to publish."
                      : `Complete your profile to help clients discover you.`}
                  </Text>
                </View>
              </View>
              {edit && (
                <Button
                  label="Complete profile →"
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
                style={{ flexDirection: "row", gap: 14, alignItems: "center" }}
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
                onPress={() => {
                  setGallery(false);
                  setFilter("ALL");
                }}
              />
              <Button
                label="Gallery"
                secondary={!gallery}
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
            <Text style={s.h1}>Your profile</Text>
            <Text style={s.body}>
              {supplier?.businessName} · {role?.toLowerCase()}
            </Text>
            <Card>
              <Text style={s.h2}>Publication</Text>
              <Tag text={p?.published ? "Published" : "Draft"} />
              <Text style={s.body}>
                {data.readiness?.missing.length
                  ? `Still needed: ${data.readiness.missing.join(", ")}`
                  : "Your profile details are ready."}
              </Text>
              {edit && (
                <>
                  <Button
                    label="Edit profile"
                    onPress={() => setEditor({ kind: "profile" })}
                  />
                  <Button
                    label={p?.published ? "Unpublish page" : "Publish page"}
                    secondary
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
            {role === "OWNER" && (
              <Button
                label="Edit business identity & contact"
                secondary
                onPress={() => setEditor({ kind: "business" })}
              />
            )}
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
              Connected to the Events Circle staging backend. Pull down to
              refresh your data.
            </Text>
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
      <Modal
        visible={!!editor}
        animationType="slide"
        onRequestClose={() => setEditor(null)}
      >
        <SafeAreaView style={s.root}>
          <View style={[s.row, { padding: 18 }]}>
            <Text style={s.h2}>Presence</Text>
            <Button label="Close" secondary onPress={() => setEditor(null)} />
          </View>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.page}
            >
              {data && editor?.kind === "profile" && (
                <ProfileForm data={data} org={org} onSaved={saved} />
              )}
              {data && editor?.kind === "business" && (
                <BusinessForm
                  supplier={data.supplier}
                  org={org}
                  onSaved={saved}
                />
              )}
              {editor?.kind === "content" && (
                <ContentForm
                  collection={editor.collection}
                  item={editor.item}
                  org={org}
                  onSaved={saved}
                />
              )}
              {editor?.kind === "share" && (
                <>
                  <Text style={s.h1}>Share your presence</Text>
                  {modalError ? (
                    <Text style={s.body}>{modalError}</Text>
                  ) : share ? (
                    <Card>
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
                        label="Share link"
                        secondary
                        onPress={() =>
                          void Share.share({ message: share.url }).catch(() =>
                            setModalError("Could not share this link."),
                          )
                        }
                      />
                      <Button
                        label="Copy link"
                        secondary
                        onPress={() =>
                          void Clipboard.setStringAsync(share.url)
                            .then(() =>
                              Alert.alert(
                                "Copied",
                                "Your public link is ready to paste.",
                              ),
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
                  <Text style={s.h1}>
                    {publicData?.supplier.businessName ||
                      supplier?.businessName}
                  </Text>
                  {!!modalError && <Text style={s.body}>{modalError}</Text>}
                  {p?.published && !publicData && !modalError ? (
                    <ActivityIndicator />
                  ) : (
                    <>
                      <Photo
                        id={publicData?.coverMediaId || p?.coverMediaId}
                        org={org}
                        height={220}
                      />
                      <Text style={s.h2}>
                        {publicData?.tagline || p?.tagline}
                      </Text>
                      <Text style={s.body}>
                        {publicData?.description || p?.description}
                      </Text>
                      {(["portfolio", "listings", "gallery"] as const).map(
                        (collection) => (
                          <View key={collection} style={{ gap: 12 }}>
                            <Heading
                              title={
                                collection.charAt(0).toUpperCase() +
                                collection.slice(1)
                              }
                            />
                            {(
                              publicData?.[collection] ||
                              active(data?.content[collection] || [])
                            ).map((item) => (
                              <Card key={item.id}>
                                <Photo id={item.media[0]?.mediaId} org={org} />
                                <Text style={s.h2}>{item.title}</Text>
                                <Text style={s.body}>{item.summary}</Text>
                              </Card>
                            ))}
                          </View>
                        ),
                      )}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
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
