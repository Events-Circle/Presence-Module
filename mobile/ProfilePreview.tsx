import { CategoryDetailsPreview } from "./CategoryDetails";
import React, { useState } from "react";
import { Linking, Text, View } from "react-native";
import { Button, Card, C, Heading, Photo, s, Tag } from "./ui";
import { active, type Snapshot } from "./data";
import type { Models } from "./service";
import { displayAmount } from "../src/formatting";
export function ProfilePreview({
  data,
  publicData,
  org,
}: {
  data: Snapshot;
  publicData: Models["PublicPresenceDto"] | null;
  org: string;
}) {
  const [error, setError] = useState("");
  const profile = publicData ?? data.profile;
  const supplier = publicData?.supplier ?? data.supplier;
  const email = publicData
    ? publicData.supplier.contactEmail
    : data.profile?.showEmail
      ? data.supplier.contactEmail
      : null;
  const phone = publicData
    ? publicData.supplier.contactPhone
    : data.profile?.showPhone
      ? data.supplier.contactPhone
      : null;
  async function contact(url: string) {
    setError("");
    try {
      await Linking.openURL(url);
    } catch {
      setError(
        "Could not open the contact app. You can copy the contact details below.",
      );
    }
  }
  return (
    <View style={{ gap: 24 }}>
      {!!profile?.coverMediaId && (
        <Photo id={profile.coverMediaId} org={org} height={210} />
      )}
      <View style={{ gap: 12 }}>
        {!!profile?.logoMediaId && (
          <View style={{ width: 80 }}>
            <Photo id={profile.logoMediaId} org={org} height={80} />
          </View>
        )}
        <Text accessibilityRole="header" style={s.h1}>
          {supplier.businessName}
        </Text>
        <Text style={{ color: C.blue, fontSize: 14 }}>
          {supplier.category} · {supplier.city}
        </Text>
        {!!profile?.tagline && <Text style={s.h2}>{profile.tagline}</Text>}
      </View>
      {!!profile?.description?.trim() && (
        <View style={{ gap: 8 }}>
          <Heading title="About the business" />
          <Text style={s.body}>{profile.description}</Text>
        </View>
      )}
      <CategoryDetailsPreview
        {...(profile?.categoryDetails
          ? { details: profile.categoryDetails }
          : {})}
      />
      {(["listings", "portfolio", "gallery"] as const).map((collection) => {
        const items = publicData
          ? publicData[collection]
          : active(data.content[collection]);
        if (!items.length) return null;
        return (
          <View key={collection} style={{ gap: 12 }}>
            <Heading
              title={
                collection === "listings"
                  ? "Services & packages"
                  : collection === "portfolio"
                    ? "Portfolio"
                    : "Gallery"
              }
            />
            {items.map((item) => (
              <Card key={item.id}>
                {!!item.media[0] && (
                  <Photo id={item.media[0].mediaId} org={org} height={190} />
                )}
                <Text style={s.h2}>{item.title}</Text>
                {!publicData && "status" in item && (
                  <Tag text={String(item.status).toLowerCase()} />
                )}
                {!!item.summary && <Text style={s.body}>{item.summary}</Text>}
                {collection === "listings" && (
                  <Text style={[s.label, { color: C.blue }]}>
                    {item.pricingMode === "FREE"
                      ? "Free"
                      : (item.pricingMode === "FIXED" ||
                            item.pricingMode === "FROM") &&
                          item.amountMinor != null &&
                          item.currency
                        ? `${item.pricingMode === "FROM" ? "From " : ""}${item.currency} ${displayAmount(item.amountMinor, item.currency)}`
                        : "Price on request"}
                  </Text>
                )}
                {collection === "gallery" &&
                  item.media
                    .slice(1)
                    .map((media, index) => (
                      <Photo
                        key={media.mediaId + index}
                        id={media.mediaId}
                        org={org}
                        height={190}
                      />
                    ))}
              </Card>
            ))}
          </View>
        );
      })}
      {(!!email || !!phone) && (
        <Card>
          <Heading title="Contact the business" />
          {!!email && (
            <>
              <Button
                label="Email business"
                onPress={() => void contact(`mailto:${email}`)}
              />
              <Text selectable style={s.body}>
                {email}
              </Text>
            </>
          )}
          {!!phone && (
            <>
              <Button
                label="Call business"
                secondary
                onPress={() => void contact(`tel:${phone}`)}
              />
              <Text selectable style={s.body}>
                {phone}
              </Text>
            </>
          )}
          {!!error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
        </Card>
      )}
    </View>
  );
}
