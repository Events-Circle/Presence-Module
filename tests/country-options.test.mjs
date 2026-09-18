import { test } from "node:test";
import assert from "node:assert/strict";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";

test("country picker loads without Intl.DisplayNames and retains searchable names and calling codes", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, "DisplayNames");
  try {
    Object.defineProperty(Intl, "DisplayNames", {
      value: undefined,
      configurable: true,
    });
    const { countryOptions } = await import("../dist/country-options.js");
    assert.equal(countryOptions.length, getCountries().length);
    assert.equal(
      new Set(countryOptions.map((option) => option.value)).size,
      getCountries().length,
    );
    for (const code of getCountries()) {
      const option = countryOptions.find((option) => option.value === code);
      assert.ok(option?.label.endsWith(`(+${getCountryCallingCode(code)})`));
    }
    assert.equal(
      countryOptions.find((option) => option.value === "LB")?.label,
      "Lebanon (+961)",
    );
    assert.equal(
      countryOptions.find((option) => option.value === "GB")?.label,
      "United Kingdom (+44)",
    );
  } finally {
    if (descriptor) Object.defineProperty(Intl, "DisplayNames", descriptor);
  }
});
