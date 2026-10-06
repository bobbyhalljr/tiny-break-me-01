import assert from "node:assert/strict";
import { test } from "node:test";
import { LIMITS } from "../src/bot.ts";
import { openAICompatible, resolveModel } from "../src/model.ts";

test("picks a provider from env, cheapest model by default", () => {
  assert.equal(resolveModel({}), null);
  assert.equal(resolveModel({ OPENAI_API_KEY: "k" })?.model, "gpt-4.1-nano");
  assert.equal(resolveModel({ AI_GATEWAY_API_KEY: "k", OPENAI_API_KEY: "k" })?.provider, "ai-gateway");
  assert.equal(resolveModel({ XAI_API_KEY: "k" }), null, "xAI needs an explicit model");
  assert.equal(resolveModel({ BREAK_ME_BASE_URL: "http://127.0.0.1:8080/v1" })?.provider, "local");
});

test("sends a short max_tokens and the key only in the Authorization header", async () => {
  let sent: { url: string; init: RequestInit } | undefined;
  const fakeFetch = (async (url: string, init: RequestInit) => {
    sent = { url, init };
    return new Response(JSON.stringify({ choices: [{ message: { content: " hi " } }] }), { status: 200 });
  }) as unknown as typeof fetch;
  const model = openAICompatible({ provider: "openai", baseURL: "https://api.example/v1/", apiKey: "sk-test", model: "m" }, fakeFetch);
  assert.equal(await model([{ role: "user", content: "hello" }]), "hi");
  assert.equal(sent?.url, "https://api.example/v1/chat/completions");
  const body = JSON.parse(String(sent?.init.body));
  assert.equal(body.max_tokens, LIMITS.maxTokens);
  assert.equal((sent?.init.headers as Record<string, string>).authorization, "Bearer sk-test");
  assert.doesNotMatch(String(sent?.init.body), /sk-test/);
});
