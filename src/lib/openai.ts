import OpenAI from "openai";

// GPT-5.6 comes in three tiers off the same 1.05M-token model. Sol is the
// frontier tier ($5/$30 per Mtok), Terra balances quality against cost
// ($2/$12), Luna is the cost-optimised tier ($0.20/$1.20 — roughly what
// gpt-4o-mini used to cost). Everything the customer actually reads runs on
// Terra; only the short typing assist runs on Luna. Change a tier here, not at
// the call sites.
export const AI_MODEL = {
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
} as const;

// The GPT-5 family dropped `max_tokens` for `max_completion_tokens`, and only
// accepts the default temperature of 1 — passing either of the old parameters
// is a 400, so neither appears at any call site. Note that the completion cap
// now covers reasoning tokens as well as the reply, so the ceilings are set
// well clear of the expected output rather than snug against it.

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your-openai-api-key-here") {
      throw new Error("OPENAI_API_KEY is not configured.");
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}
