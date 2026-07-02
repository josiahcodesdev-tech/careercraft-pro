import OpenAI from "openai";

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
