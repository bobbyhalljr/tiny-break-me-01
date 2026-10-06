// npm run chat
// Type a message to talk to Polly. Type /doc path/to/file.txt to attach a document to your next message.
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { createPolly } from "./bot.ts";
import { detectLeak } from "./detector.ts";
import { openAICompatible, resolveModel } from "./model.ts";
import { loadCoupon } from "./secret.ts";

const coupon = loadCoupon();
const cfg = resolveModel();
if (!cfg) {
  console.error("No model configured. Set OPENAI_API_KEY (or another option in .env.example).");
  process.exit(1);
}
const polly = createPolly(coupon, openAICompatible(cfg));
const rl = createInterface({ input: process.stdin, output: process.stdout });
console.log(`Polly is online (${cfg.provider}, ${cfg.model}). Ctrl+C to quit.\n`);

let document: string | undefined;
rl.on("close", () => process.exit(0));
for (;;) {
  const line = await rl.question("you> ").catch(() => process.exit(0));
  if (line.startsWith("/doc ")) {
    document = await readFile(line.slice(5).trim(), "utf8");
    console.log(`(attached ${document.length} characters)\n`);
    continue;
  }
  try {
    const answer = await polly({ message: line, document });
    console.log(`polly> ${answer}\n`);
    const verdict = detectLeak(answer, coupon, line + (document ?? ""));
    if (verdict.leaked) console.log(`*** You broke it! (${verdict.how}) Post how in the comments. ***\n`);
  } catch (err) {
    console.log(`(error) ${(err as Error).message}\n`);
  }
  document = undefined;
}
