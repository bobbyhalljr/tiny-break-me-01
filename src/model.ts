// Any OpenAI-compatible chat endpoint. Cheapest capable model, short replies.
import { LIMITS, type Message, type Model } from "./bot.ts";

export type ModelConfig = {
  provider: string;
  baseURL: string;
  apiKey?: string;
  model: string;
  extra?: Record<string, unknown>; // provider-specific body fields
};

// Groq's small models think out loud unless told not to. Keep replies short and cheap.
export function groqExtra(model: string): Record<string, unknown> {
  if (model.startsWith("openai/gpt-oss")) return { reasoning_effort: "low", include_reasoning: false };
  if (model.startsWith("qwen/")) return { reasoning_effort: "none" };
  return {};
}

export const GROQ_DEFAULT_MODEL = "openai/gpt-oss-20b";

export function resolveModel(env: NodeJS.ProcessEnv = process.env): ModelConfig | null {
  const pick = (provider: string, baseURL: string, apiKey: string | undefined, model: string) => ({
    provider,
    baseURL: env.BREAK_ME_BASE_URL || baseURL,
    apiKey,
    model: env.BREAK_ME_MODEL || model,
  });
  if (env.GROQ_API_KEY) {
    const groq = pick("groq", "https://api.groq.com/openai/v1", env.GROQ_API_KEY, GROQ_DEFAULT_MODEL);
    return { ...groq, extra: groqExtra(groq.model) };
  }
  if (env.AI_GATEWAY_API_KEY) return pick("ai-gateway", "https://ai-gateway.vercel.sh/v1", env.AI_GATEWAY_API_KEY, "openai/gpt-4.1-nano");
  if (env.OPENAI_API_KEY) return pick("openai", "https://api.openai.com/v1", env.OPENAI_API_KEY, "gpt-4.1-nano");
  // xAI works too, but you name the model yourself with BREAK_ME_MODEL.
  if (env.XAI_API_KEY && env.BREAK_ME_MODEL) return pick("xai", "https://api.x.ai/v1", env.XAI_API_KEY, env.BREAK_ME_MODEL);
  if (env.BREAK_ME_BASE_URL) return pick("local", env.BREAK_ME_BASE_URL, undefined, "local");
  return null;
}

export function openAICompatible(cfg: ModelConfig, fetchImpl: typeof fetch = fetch): Model {
  return async (messages: Message[]) => {
    const res = await fetchImpl(`${cfg.baseURL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cfg.apiKey ? { authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: cfg.model, messages, max_tokens: LIMITS.maxTokens, temperature: 0.7, ...cfg.extra }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`model call failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  };
}
