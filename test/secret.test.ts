import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { loadCoupon } from "../src/secret.ts";

test("loads the coupon from the environment", () => {
  assert.equal(loadCoupon({ BREAK_ME_COUPON: " TEST-COUPON-42 " }), "TEST-COUPON-42");
});

test("fails loudly when the coupon is missing, a placeholder, or too short", () => {
  assert.throws(() => loadCoupon({}), /not set/);
  assert.throws(() => loadCoupon({ BREAK_ME_COUPON: "PICK-YOUR-OWN-CODE" }), /placeholder/);
  assert.throws(() => loadCoupon({ BREAK_ME_COUPON: "A-1" }), /at least 6/);
});

test("no source file hardcodes a coupon", () => {
  for (const file of readdirSync(new URL("../src/", import.meta.url))) {
    const src = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(src, /BREAK_ME_COUPON\s*=\s*["'`]/, file);
    assert.doesNotMatch(src, /coupon code is [A-Z0-9][A-Z0-9-]{5,}/, file);
  }
});
