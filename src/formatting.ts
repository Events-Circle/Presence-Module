export const listingCurrencies = [
  "USD",
  "EUR",
  "GBP",
  "LBP",
  "AED",
  "SAR",
  "QAR",
  "KWD",
  "BHD",
  "OMR",
  "JOD",
  "EGP",
  "CAD",
  "AUD",
] as const;
/** Convert display amounts to API minor units without silently rounding input. */
export function currencyDigits(currency: string): number {
  if (!/^[A-Z]{3}$/.test(currency))
    throw new Error("Enter a three-letter currency code, such as USD.");
  if (!listingCurrencies.some((code) => code === currency))
    throw new Error(
      "Choose a supported currency code, such as USD, EUR or LBP.",
    );
  return (
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}
export function amountToMinor(value: string, currency: string): number {
  const digits = currencyDigits(currency);
  if (
    !new RegExp("^\\d+(?:\\.\\d{1," + Math.max(digits, 1) + "})?$").test(
      value.trim(),
    ) ||
    (digits === 0 && value.includes("."))
  )
    throw new Error(
      `Enter a positive amount with up to ${digits} decimal places.`,
    );
  const [whole = "0", fraction = ""] = value.trim().split(".");
  const result =
    Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, "0"));
  if (!Number.isSafeInteger(result) || result <= 0)
    throw new Error(
      "Enter an amount greater than zero. Choose Free for a free listing.",
    );
  return result;
}
export function displayAmount(
  value: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (value == null) return "";
  try {
    return (value / 10 ** currencyDigits(currency || "USD")).toFixed(
      currencyDigits(currency || "USD"),
    );
  } catch {
    return "";
  }
}
export function readinessLabel(value: string): string {
  const labels: Record<string, string> = {
    supplier: "Business identity",
    media: "Cover image and image descriptions",
    pricing: "Valid price and currency",
    offerDates: "Valid offer dates",
    logo: "Business logo",
    logoMediaId: "Business logo",
    cover: "Cover image",
    coverMediaId: "Cover image",
    slug: "Public page address",
    description: "About your business",
    tagline: "Tagline",
    businessName: "Business name",
    category: "Business category",
    city: "City",
    profile: "Presence profile",
    publishedContent: "Published content",
  };
  return (
    labels[value] ||
    value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_.-]/g, " ")
  );
}
