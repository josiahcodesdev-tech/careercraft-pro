import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Vision OCR: read a job-description screenshot into plain text. Shared by the
// CV Builder (pre-fill a tailored draft) and CV Transform (tailor the CV).
// gpt-4o-mini is vision-capable; the call can exceed Vercel's 10s default.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`jd-ocr:${getClientIp(req)}`, 10, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  let image: unknown;
  try {
    ({ image } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return NextResponse.json({ error: "A job-description image is required." }, { status: 400 });
  }
  // Guard against oversized payloads (~8MB of base64).
  if (image.length > 8_000_000) {
    return NextResponse.json({ error: "Image is too large. Please use a smaller screenshot." }, { status: 413 });
  }

  let client: ReturnType<typeof getOpenAI>;
  try {
    client = getOpenAI();
  } catch {
    return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 503 });
  }

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You transcribe job postings from images. Output ONLY the plain text of the posting exactly as written — job title, company, responsibilities, requirements, qualifications, everything visible. No commentary, no markdown, no headings you add yourself.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Transcribe the full job description text from this image." },
            { type: "image_url", image_url: { url: image, detail: "high" } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 1500,
    });

    const text = res.choices[0]?.message?.content?.trim() ?? "";
    if (text.length < 15) {
      return NextResponse.json(
        { error: "Couldn't read a job description from that image. Try a clearer screenshot." },
        { status: 422 }
      );
    }
    return NextResponse.json({ text: text.slice(0, 5000) });
  } catch (e) {
    const msg = e instanceof Error ? e.message.toLowerCase() : "";
    if (msg.includes("api key") || msg.includes("401")) {
      return NextResponse.json({ error: "Invalid OpenAI API key." }, { status: 401 });
    }
    if (msg.includes("quota") || msg.includes("429")) {
      return NextResponse.json({ error: "OpenAI quota exceeded." }, { status: 429 });
    }
    return NextResponse.json({ error: "Could not read the image. Please try again." }, { status: 500 });
  }
}
