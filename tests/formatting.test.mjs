import { test } from "node:test";
import assert from "node:assert/strict";
import {
  amountToMinor,
  displayAmount,
  listingPrice,
} from "../dist/formatting.js";
test("currency conversions preserve values and reject precision loss", () => {
  assert.equal(amountToMinor("25.50", "USD"), 2550);
  assert.equal(amountToMinor("1.234", "KWD"), 1234);
  assert.equal(displayAmount(2550, "USD"), "25.50");
  for (const [value, currency] of [
    ["1.234", "USD"],
    ["1.1", "JPY"],
    ["0", "USD"],
    ["-5", "USD"],
    ["25", "ZZZ"],
    ["99999999999999999", "USD"],
  ])
    assert.throws(() => amountToMinor(value, currency));
});

test("listing price labels preserve units, quote/free modes and legacy prices", () => {
  const item = { pricingMode: "FROM", amountMinor: 2550, currency: "USD" };
  assert.equal(listingPrice(item), "From USD 25.50");
  for (const [priceUnit, suffix] of [
    ["EVENT", "per event"],
    ["HOUR", "per hour"],
    ["PERSON", "per person"],
    ["PACKAGE", "per package"],
    ["ITEM", "per item"],
    ["TOTAL", "total"],
  ])
    assert.equal(
      listingPrice({ ...item, priceUnit }),
      "From USD 25.50 " + suffix,
    );
  assert.equal(
    listingPrice({ ...item, pricingMode: "FREE", priceUnit: "PERSON" }),
    "Free",
  );
  assert.equal(
    listingPrice({ ...item, pricingMode: "ON_REQUEST", priceUnit: "PERSON" }),
    "Price on request",
  );
  assert.equal(
    listingPrice({ ...item, amountMinor: null }),
    "Price unavailable",
  );
  assert.equal(amountToMinor("21474836.47", "USD"), 2147483647);
  assert.throws(() => amountToMinor("21474836.48", "USD"), /too large/);
});
