import React from "react";
import { Text, View } from "react-native";
import { Button, Card, C, Icon, s } from "./ui";
import type { Snapshot } from "./data";
export type ProfileSection =
  "all" | "introduction" | "images" | "contact" | "address";
export const profileSectionTitles: Record<ProfileSection, string> = {
  all: "All profile details",
  introduction: "Introduction",
  images: "Brand images",
  contact: "Public contact details",
  address: "Page address",
};
export function ProfileSections({
  data,
  canEdit,
  isOwner,
  onEdit,
  onBusiness,
  onDetails,
}: {
  data: Snapshot;
  canEdit: boolean;
  isOwner: boolean;
  onEdit: (section: ProfileSection) => void;
  onBusiness: () => void;
  onDetails: () => void;
}) {
  const p = data.profile;
  const supplier = data.supplier;
  const sections: {
    key: ProfileSection | "business";
    title: string;
    summary: string;
    status: string;
  }[] = [
    {
      key: "business",
      title: "Business information",
      summary: `${supplier.businessName} · ${supplier.category}\n${supplier.city}`,
      status: "Shared business details",
    },
    {
      key: "introduction",
      title: "Introduction",
      summary:
        p?.tagline ||
        p?.description ||
        "Tell clients what you do and what makes your business special.",
      status: p?.description?.trim()
        ? "Description added"
        : "Description needed to publish",
    },
    {
      key: "images",
      title: "Brand images",
      summary: `${p?.logoMediaId ? "Logo added" : "Add your logo"} · ${p?.coverMediaId ? "Cover added" : "Add a cover image"}`,
      status: "Show your business at a glance",
    },
    {
      key: "contact",
      title: "Public contact details",
      summary: `${p?.showEmail && supplier.contactEmail ? "Email visible" : "Email hidden"} · ${p?.showPhone && supplier.contactPhone ? "Phone visible" : "Phone hidden"}`,
      status: "You choose what clients can see",
    },
    {
      key: "address",
      title: "Page address",
      summary:
        p?.slug && p.pageAddressConfirmed !== false
          ? `/p/${p.slug}`
          : "Choose a unique name for your public page.",
      status:
        p?.slug && p.pageAddressConfirmed !== false
          ? "Page name saved"
          : "Choose before publishing",
    },
  ];
  return (
    <View style={{ gap: 12 }}>
      {sections.map((section) => (
        <Card key={section.key}>
          <View
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: "#EDF0FF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                name={
                  section.key === "images"
                    ? "image-outline"
                    : section.key === "contact"
                      ? "eye-outline"
                      : section.key === "address"
                        ? "link-outline"
                        : section.key === "business"
                          ? "business-outline"
                          : "create-outline"
                }
              />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text accessibilityRole="header" style={s.h2}>
                {section.title}
              </Text>
              <Text numberOfLines={3} style={s.body}>
                {section.summary}
              </Text>
              <Text style={{ color: C.blue, fontSize: 12 }}>
                {section.status}
              </Text>
            </View>
          </View>
          {(section.key === "business" ? isOwner : canEdit) && (
            <Button
              label={`Edit ${section.title.toLowerCase()}`}
              secondary
              onPress={() =>
                section.key === "business" ? onBusiness() : onEdit(section.key)
              }
            />
          )}
          {section.key === "business" && !isOwner && (
            <Text style={s.body}>
              Only a business owner can change these details.
            </Text>
          )}
        </Card>
      ))}
      <Card>
        <Text accessibilityRole="header" style={s.h2}>
          Category details
        </Text>
        <Text style={s.body}>
          Capacity, services and practical information that help clients choose
          your business.
        </Text>
        <Text style={{ color: C.blue, fontSize: 12 }}>
          {Object.keys(p?.categoryDetails?.values || {}).length} details added ·
          Optional
        </Text>
        {canEdit && (
          <Button
            label={
              p ? "Edit category details" : "Set up profile to add details"
            }
            secondary
            onPress={onDetails}
          />
        )}
      </Card>
    </View>
  );
}
