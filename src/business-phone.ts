import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
/** Accept human formatting; preserve country-specific national dialing rules. */
export function businessPhone(
  raw: string,
  country: CountryCode,
): string | null {
  if (!raw.trim()) return null;
  if (!/^[+\d\s().-]+$/.test(raw))
    throw new Error("Use numbers, spaces, parentheses or dashes only.");
  const number = parsePhoneNumberFromString(raw.trim(), country);
  if (!number || !number.isPossible())
    throw new Error(
      "Check the country code and enter a complete phone number.",
    );
  return number.number;
}
