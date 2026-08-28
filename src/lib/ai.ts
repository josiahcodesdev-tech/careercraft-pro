import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

/**
 * One AI call, two providers.
 *
 * Every AI feature on the site goes through `aiText`. OpenAI is tried first;
 * if it is out of credit, rate-limited, refusing the key or simply down, the
 * same request is replayed on Claude and the customer never sees it. Configure
 * both keys (OPENAI_API_KEY, ANTHROPIC_API_KEY) and the site keeps working
 * when one account runs dry; configure either one alone and it is used on its
 * own. Change models or tiers here, not at the call sites.
 */

export type AiTier = "quality" | "bulk" | "fast";

type Provider = "openai" | "anthropic";

// GPT-5.6 comes in three tiers off the same 1.05M-token model. Sol is the
// frontier tier ($5/$30 per Mtok), Terra balances quality against cost
// ($2/$12), Luna is the cost-optimised tier ($0.20/$1.20). Everything the
// customer actually reads runs on Terra; only the short typing assist and the
// long interview generation run on Luna.
const OPENAI_MODEL: Record<AiTier, string> = {
  /** CV rewriting, JD drafting, OCR — quality the buyer sees, short outputs. */
  quality: "gpt-5.6-terra",
  /**
   * Long-form generation billed against a serverless clock. The 30-pair
   * interview prep is ~3k output tokens, and measured runs on Terra came back
   * at 51-58s — over Vercel's 60s ceiling often enough to 504 a paid feature.
   * Luna generates the same volume in roughly two thirds of the time.
   */
  bulk: "gpt-5.6-luna",
  /** The as-you-type suggestion: a few words, wanted instantly, called often. */
  fast: "gpt-5.6-luna",
};

// The Claude standby is one model at three effort levels — effort does the job
// separate GPT tiers do. Full effort for what the buyer reads; low effort where
// the wait matters more than the depth, which also keeps the long interview
// generation clear of the 60s serverless ceiling.
const CLAUDE_MODEL = "claude-opus-5";
const CLAUDE_EFFORT: Record<AiTier, "low" | "high"> = {
  quality: "high",
  bulk: "low",
  fast: "low",
};

// The GPT-5 family dropped `max_tokens` for `max_completion_tokens`, and only
// accepts the default temperature of 1 — passing either of the old parameters
// is a 400, so neither appears here. Claude counts its thinking tokens against
// the same ceiling, so it is given headroom above the caller's budget.
const CLAUDE_TOKEN_HEADROOM = 2;

export interface AiTextOptions {
  tier: AiTier;
  system: string;
  user: string;
  /** A `data:image/...;base64,` URL, for the vision routes. */
  image?: string;
  /** Budget for the reply itself. */
  maxTokens: number;
  /** Ask for a raw JSON object back. The prompt still has to describe it. */
  json?: boolean;
}

/** Thrown when no provider could answer. `status` is the last failure's. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly provider?: Provider
  ) {
    super(message);
    this.name = "AiError";
  }
}

function apiKey(name: string): string | undefined {
  const value = process.env[name];
  // The .env template ships placeholders; treat them as absent.
  if (!value || value.startsWith("your-")) return undefined;
  return value;
}

/** Providers with a usable key, in the order they are tried. */
function providers(): Provider[] {
  const list: Provider[] = [];
  if (apiKey("OPENAI_API_KEY")) list.push("openai");
  if (apiKey("ANTHROPIC_API_KEY")) list.push("anthropic");
  return list;
}

/** Whether any AI provider is configured — routes return 503 when false. */
export function aiConfigured(): boolean {
  return providers().length > 0;
}

let _openai: OpenAI | null = null;
let _anthropic: Anthropic | null = null;

function openaiClient(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: apiKey("OPENAI_API_KEY") });
  return _openai;
}

function anthropicClient(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: apiKey("ANTHROPIC_API_KEY") });
  return _anthropic;
}

async function callOpenAI(opts: AiTextOptions): Promise<string> {
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [{ type: "text", text: opts.user }];
  if (opts.image) content.push({ type: "image_url", image_url: { url: opts.image, detail: "high" } });

  const res = await openaiClient().chat.completions.create({
    model: OPENAI_MODEL[opts.tier],
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.image ? content : opts.user },
    ],
    max_completion_tokens: opts.maxTokens,
    ...(opts.json ? { response_format: { type: "json_object" as const } } : {}),
  });

  return res.choices[0]?.message?.content?.trim() ?? "";
}

// Claude has no JSON mode; the prompts already spell out the shape they want,
// so it is told to skip the prose and any fenced block is unwrapped below.
const JSON_INSTRUCTION = "\n\nRespond with ONLY the raw JSON object — no prose, no markdown, no code fences.";

function stripCodeFence(text: string): string {
  const fenced = text.match(/^```(?:json)?\s*\n([\s\S]*?)\n?```$/);
  return fenced ? fenced[1].trim() : text;
}

async function callAnthropic(opts: AiTextOptions): Promise<string> {
  const content: Anthropic.ContentBlockParam[] = [{ type: "text", text: opts.user }];
  if (opts.image) {
    const match = opts.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) throw new AiError("Unsupported image format.", 400, "anthropic");
    content.unshift({
      type: "image",
      source: {
        type: "base64",
        media_type: match[1] as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
        data: match[2],
      },
    });
  }

  // Streamed so a long generation cannot trip an HTTP timeout before the
  // serverless function's own ceiling does.
  const message = await anthropicClient().messages
    .stream({
      model: CLAUDE_MODEL,
      max_tokens: opts.maxTokens * CLAUDE_TOKEN_HEADROOM,
      system: opts.json ? opts.system + JSON_INSTRUCTION : opts.system,
      output_config: { effort: CLAUDE_EFFORT[opts.tier] },
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content }],
    })
    .finalMessage();

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  return opts.json ? stripCodeFence(text) : text;
}

/**
 * Whether the other provider is worth trying. A 400/404/422 means the request
 * itself is wrong and would be rejected identically; everything else — no
 * credit, rate limit, rejected key, an outage, a dropped connection — is the
 * provider's problem, not the request's.
 */
function shouldFailOver(err: unknown): boolean {
  const status =
    err instanceof OpenAI.APIError || err instanceof Anthropic.APIError ? err.status : undefined;
  if (status === undefined) return true; // connection error or timeout
  return status === 401 || status === 403 || status === 408 || status === 429 || status >= 500;
}

function toAiError(err: unknown, provider: Provider): AiError {
  const status =
    err instanceof OpenAI.APIError || err instanceof Anthropic.APIError ? err.status : undefined;
  const message = err instanceof Error ? err.message : "AI request failed.";
  return new AiError(message, status, provider);
}

/**
 * Run one prompt, falling back to the standby provider if the first cannot
 * serve it. Throws `AiError`; `status` 503 means nothing is configured at all.
 */
export async function aiText(opts: AiTextOptions): Promise<string> {
  const available = providers();
  if (available.length === 0) {
    throw new AiError("No AI provider is configured.", 503);
  }

  let lastError: AiError | null = null;

  for (const provider of available) {
    try {
      return provider === "openai" ? await callOpenAI(opts) : await callAnthropic(opts);
    } catch (err) {
      lastError = toAiError(err, provider);
      if (!shouldFailOver(err)) throw lastError;
      console.warn(`[ai] ${provider} failed (${lastError.status ?? "no status"}): ${lastError.message}`);
    }
  }

  throw lastError ?? new AiError("AI request failed.");
}
