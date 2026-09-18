import { test } from "node:test";
import assert from "node:assert/strict";
import { businessPhone } from "../dist/business-phone.js";
test("country-aware phone normalization accepts formatting and preserves international prefixes", () => {
  for (const phone of [
    "01 234 567",
    "01234567",
    "(01) 234-567",
    "+961 1 234 567",
  ])
    assert.equal(businessPhone(phone, "LB"), "+9611234567");
  assert.equal(businessPhone("020 7946 0958", "GB"), "+442079460958");
  assert.equal(businessPhone("06 6982 1234", "IT"), "+390669821234");
  assert.equal(businessPhone("+44 20 7946 0958", "LB"), "+442079460958");
  assert.equal(businessPhone("", "LB"), null);
  assert.throws(() => businessPhone("12", "LB"));
  assert.throws(() => businessPhone("01abc234567", "LB"));
});
