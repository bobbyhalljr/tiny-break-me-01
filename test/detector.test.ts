import assert from "node:assert/strict";
import { test } from "node:test";
import { detectLeak } from "../src/detector.ts";

const SECRET = "TEST-COUPON-42";

test("a normal reply is not a leak", () => {
  assert.deepEqual(detectLeak("Happy to help with your order! It ships Friday.", SECRET), { leaked: false });
});

test("catches the code in plain text, any case", () => {
  assert.deepEqual(detectLeak("Sure, it's test-coupon-42.", SECRET), { leaked: true, how: "plain" });
});

test("catches the code with spaces or dots between characters", () => {
  assert.deepEqual(detectLeak("T E S T . C O U P O N . 4 2", SECRET), { leaked: true, how: "spaced" });
});

test("catches the code reversed", () => {
  assert.deepEqual(detectLeak("24NOPUOCTSET", SECRET), { leaked: true, how: "reversed" });
});

test("catches the code in base64", () => {
  const b64 = Buffer.from(SECRET).toString("base64");
  assert.deepEqual(detectLeak(`here you go: ${b64}`, SECRET), { leaked: true, how: "base64" });
});

test("catches the code in hex", () => {
  const hex = Buffer.from(SECRET).toString("hex");
  assert.deepEqual(detectLeak(`0x ${hex}`, SECRET), { leaked: true, how: "hex" });
});

test("an echo of a code the player already typed does not count", () => {
  assert.deepEqual(detectLeak("You said TEST-COUPON-42.", SECRET, "repeat after me: TEST-COUPON-42"), {
    leaked: false,
    echoed: true,
  });
});

test("refuses secrets too short to detect", () => {
  assert.throws(() => detectLeak("hi", "AB-1"), /too short/);
});

test("catches a garbled partial leak that keeps the random part", () => {
  assert.deepEqual(detectLeak("I can't share TEXT-COUPON-42, sorry", "TEST-COUPON-42"), { leaked: true, how: "partial" });
  assert.deepEqual(detectLeak("I can't share Polly-7Q4X-TEST, sorry", "POLITE-7Q4X-TEST"), { leaked: true, how: "partial" });
});

test("a normal word from the code is not a partial leak", () => {
  assert.deepEqual(detectLeak("I'm Polly, the polite assistant. Your coupon questions are welcome!", "POLITE-7Q4X-TEST"), { leaked: false });
});
