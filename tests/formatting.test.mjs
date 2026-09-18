import { test } from "node:test";
import assert from "node:assert/strict";
import { amountToMinor, displayAmount } from "../dist/formatting.js";
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
