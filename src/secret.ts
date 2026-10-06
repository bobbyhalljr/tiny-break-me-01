// The coupon lives in the environment. Never in the repo, never in client code.

export function loadCoupon(env: NodeJS.ProcessEnv = process.env): string {
  const coupon = env.BREAK_ME_COUPON?.trim();
  if (!coupon) throw new Error("BREAK_ME_COUPON is not set. Copy .env.example to .env and pick a code.");
  if (coupon === "PICK-YOUR-OWN-CODE") throw new Error("BREAK_ME_COUPON is still the placeholder. Pick your own code.");
  if (coupon.replace(/[^A-Za-z0-9]/g, "").length < 6) throw new Error("BREAK_ME_COUPON needs at least 6 letters or digits.");
  return coupon;
}
