import React from "react";
import { Text, View } from "react-native";
import { Button, Card, Field, Icon, C, s } from "./ui";
import { SearchSelect } from "./business-fields";
import {
  amountToMinor,
  listingCurrencies,
  listingPrice,
  priceUnitOptions,
} from "../src/formatting";
import type { Models } from "./service";
type Listing = Pick<
  Models["PublicContentDto"],
  "pricingMode" | "amountMinor" | "currency"
> &
  Partial<
    Pick<Models["PublicContentDto"], "priceUnit" | "inclusions" | "pricingNote">
  >;
export function ListingDetails({
  item,
  compact = false,
}: {
  item: Listing;
  compact?: boolean;
}) {
  const inclusions = item.inclusions || [];
  return (
    <View style={{ gap: 12 }}>
      <Text style={[s.h2, { color: C.blue }]}>{listingPrice(item)}</Text>
      {inclusions.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={s.label}>What’s included</Text>
          {(compact ? inclusions.slice(0, 3) : inclusions).map((value, i) => (
            <View
              key={i}
              style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
            >
              <Icon name="checkmark-circle-outline" size={18} color={C.green} />
              <Text style={[s.body, { flex: 1, color: C.ink }]}>{value}</Text>
            </View>
          ))}
          {compact && inclusions.length > 3 && (
            <Text style={s.body}>
              +{inclusions.length - 3} more inclusions · See page preview
            </Text>
          )}
        </View>
      )}
      {!!item.pricingNote && (
        <View style={{ gap: 4 }}>
          <Text style={s.label}>Pricing details</Text>
          <Text style={s.body}>{item.pricingNote}</Text>
        </View>
      )}
    </View>
  );
}
export function ListingPricingFields({
  pricing,
  onPricing,
  amount,
  onAmount,
  currency,
  onCurrency,
  unit,
  onUnit,
  inclusions,
  onInclusions,
  note,
  onNote,
  priceError,
  inclusionsError,
}: {
  pricing: NonNullable<Listing["pricingMode"]>;
  onPricing: (value: "ON_REQUEST" | "FREE" | "FROM" | "FIXED") => void;
  amount: string;
  onAmount: (value: string) => void;
  currency: string;
  onCurrency: (value: string) => void;
  unit: string;
  onUnit: (value: string) => void;
  inclusions: string[];
  onInclusions: (value: string[]) => void;
  note: string;
  onNote: (value: string) => void;
  priceError: string;
  inclusionsError: string;
}) {
  const paid = pricing === "FIXED" || pricing === "FROM";
  let amountMinor: number | null = null;
  if (paid) {
    try {
      amountMinor = amountToMinor(amount, currency);
    } catch {}
  }
  return (
    <>
      <Card style={{ backgroundColor: "#F7F9FF" }}>
        <Text style={s.h2}>Set a clear price</Text>
        <Text style={s.body}>Choose how clients see your pricing.</Text>
        <View style={s.grid}>
          {(["ON_REQUEST", "FROM", "FIXED", "FREE"] as const).map((v) => (
            <View key={v} style={{ flexBasis: "45%", flexGrow: 1 }}>
              <Button
                label={
                  {
                    ON_REQUEST: "On request",
                    FROM: "Starting from",
                    FIXED: "Fixed price",
                    FREE: "Free",
                  }[v]
                }
                selected={pricing === v}
                secondary={pricing !== v}
                onPress={() => onPricing(v)}
              />
            </View>
          ))}
        </View>
        <Text style={s.body}>
          {
            {
              ON_REQUEST:
                "Clients contact you for a tailored quote. No amount appears on your page.",
              FROM: "Show your lowest available price. Explain what changes the final cost below.",
              FIXED: "One set price for the unit you choose below.",
              FREE: "No charge for this listing. Explain any limits or conditions below.",
            }[pricing]
          }
        </Text>
        {paid && (
          <>
            <SearchSelect
              label="Currency"
              value={currency}
              required
              options={listingCurrencies.map((c) => ({ value: c, label: c }))}
              onSelect={onCurrency}
            />
            <Field
              label="Price · e.g. 25.00"
              required
              hint={`Enter the amount in ${currency}, not cents.`}
              value={amount}
              onChange={onAmount}
              keyboard="decimal-pad"
            />
            {!!priceError && (
              <Text accessibilityRole="alert" style={s.error}>
                {priceError}
              </Text>
            )}
            <SearchSelect
              label="Price is for"
              value={unit}
              options={[
                { value: "", label: "Not specified" },
                ...priceUnitOptions,
              ]}
              onSelect={onUnit}
            />
            <Text style={s.body}>
              {unit
                ? "This unit appears beside your price everywhere clients see it."
                : "Choose a unit so clients know what the amount covers. Existing prices can remain unspecified."}
            </Text>
          </>
        )}
        <Field
          label="Pricing details"
          hint="Optional. Explain minimum orders, travel fees or other conditions. These details appear on your page."
          placeholder="e.g. Minimum 40 guests. Travel outside Beirut is quoted separately."
          value={note}
          onChange={onNote}
          maxLength={500}
          multiline
        />
      </Card>
      <Card>
        <Text style={s.h2}>What’s included</Text>
        <Text style={s.body}>
          Optional. List concrete deliverables, one per line, so clients can
          compare your services. For example: 6 hours of photography or a
          three-course meal.
        </Text>
        {inclusions.map((value, i) => (
          <View key={i} style={{ gap: 4 }}>
            <Field
              label={`Inclusion ${i + 1}`}
              value={value}
              maxLength={200}
              onChange={(v) =>
                onInclusions(inclusions.map((x, j) => (j === i ? v : x)))
              }
            />
            <Button
              label={`Remove inclusion ${i + 1}`}
              secondary
              onPress={() => onInclusions(inclusions.filter((_, j) => j !== i))}
            />
          </View>
        ))}
        {!!inclusionsError && (
          <Text accessibilityRole="alert" style={s.error}>
            {inclusionsError}
          </Text>
        )}
        <Button
          label="Add inclusion"
          secondary
          disabled={inclusions.length >= 20}
          onPress={() => onInclusions([...inclusions, ""])}
        />
        <Text style={s.body}>
          {inclusions.length} / 20 inclusions. Empty lines are not saved.
        </Text>
      </Card>
      <Card style={{ backgroundColor: "#EDF0FF", borderColor: "#D8DFFE" }}>
        <Text style={s.label}>Customer price preview · Unsaved</Text>
        {paid && amountMinor === null ? (
          <Text style={s.body}>Enter a valid price to preview it here.</Text>
        ) : (
          <ListingDetails
            item={{
              pricingMode: pricing,
              amountMinor,
              currency: paid ? currency : null,
              priceUnit: paid
                ? priceUnitOptions.find((o) => o.value === unit)?.value || null
                : null,
              inclusions: inclusions.map((v) => v.trim()).filter(Boolean),
              pricingNote: note.trim(),
            }}
          />
        )}
      </Card>
    </>
  );
}
