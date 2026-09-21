import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Card, Photo, s, Tag } from "./ui";
import { ListingDetails } from "./ListingPricing";
import { request, type Collection, type Models } from "./service";

export function ContentDetails({
  item,
  collection,
  org,
}: {
  item: Models["PublicContentDto"];
  collection: Collection;
  org: string;
}) {
  const [location, setLocation] = useState("");
  useEffect(() => {
    let current = true;
    setLocation("");
    if (item.locationId)
      void request<Models["CatalogResponseDto"][]>(
        "/api/v1/core/catalogs/locations",
        { public: true },
      )
        .then((rows) => {
          if (current)
            setLocation(
              rows.find((row) => row.id === item.locationId)?.label || "",
            );
        })
        .catch(() => {});
    return () => {
      current = false;
    };
  }, [item.locationId]);
  return (
    <View style={{ gap: 18 }}>
      <Text accessibilityRole="header" style={s.h1}>
        {item.title}
      </Text>
      {"status" in item && <Tag text={String(item.status).toLowerCase()} />}
      {!!item.summary && <Text style={s.h2}>{item.summary}</Text>}
      {(!!item.occurredAt || !!location) && (
        <Card>
          <Text style={s.h2}>Project details</Text>
          {!!item.occurredAt && (
            <Text style={s.body}>
              Project date:{" "}
              {new Date(item.occurredAt).toLocaleDateString("en", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </Text>
          )}
          {!!location && <Text style={s.body}>Location: {location}</Text>}
        </Card>
      )}
      {!!item.description && <Text style={s.body}>{item.description}</Text>}
      {collection === "listings" && (
        <Card>
          <ListingDetails item={item} />
        </Card>
      )}
      {!!item.serviceAreas?.length && (
        <Card>
          <Text style={s.h2}>Areas served</Text>
          <Text style={s.body}>{item.serviceAreas.join(" · ")}</Text>
        </Card>
      )}
      {!!item.availabilityNote && (
        <Card>
          <Text style={s.h2}>Availability</Text>
          <Text style={s.body}>{item.availabilityNote}</Text>
        </Card>
      )}
      {item.type === "OFFER" && !!item.validUntil && (
        <Text style={s.body}>
          Offer ends:{" "}
          {new Date(item.validUntil).toLocaleString("en", { timeZone: "UTC" })}{" "}
          UTC
        </Text>
      )}
      {item.media.map((media, index) => (
        <View key={media.mediaId} style={{ gap: 8 }}>
          <Photo
            id={media.mediaId}
            org={org}
            alt={media.altText}
            height={index === 0 ? 240 : 210}
          />
          {!!media.caption && <Text style={s.body}>{media.caption}</Text>}
        </View>
      ))}
      {!item.media.length && <Text style={s.body}>No images added yet.</Text>}
    </View>
  );
}
