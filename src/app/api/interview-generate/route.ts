import { NextRequest, NextResponse } from "next/server";
import { aiText, aiConfigured, AiError } from "@/lib/ai";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Generating 30 Q&A pairs can take longer than Vercel's 10s default —
// without this, slower OpenAI responses get killed by a 504 before they finish.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`interview-generate:${getClientIp(req)}`, 10, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  if (!aiConfigured()) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
  }

  const body = await req.json() as {
    name: string;
    role: string;
    jobDescription: string;
    qualifications: string;
  };

  const { name, role, jobDescription, qualifications } = body;

  const systemPrompt = `You are an expert interview coach generating a realistic mock interview dialogue. Generate exactly 30 question-and-answer pairs for a job interview. The candidate's name is ${name} and the role is ${role}.

BEFORE writing anything, read the candidate's qualifications carefully and extract:
- Specific tools, technologies, or software they know
- Specific roles or companies they have worked at
- Specific achievements, metrics, or outcomes they have delivered
- Specific skills or methods they mention

Also read the job description and judge whether this is a management/supervisory role (leads or manages other people, sets targets/KPIs for a team, "manager", "head of", "supervisor", "lead", etc.) or an individual-contributor role — this changes which Situational and Leadership questions to ask (see below).

ANSWER QUALITY BAR — write every answer the way a real hiring panel's scoring rubric defines "Excellent" (5/5), never "Adequate" or "Vague":
- Excellent = strategic, specific, evidence-based, practical, and directly relevant to the actual role.
- Weak/vague = generic statements that could apply to any candidate: no numbers, no named tools or systems, no real example, no clear outcome.
- Concretely, an answer earns "Excellent" when it names the specific tool/system/method used, gives a number or outcome where plausible (%, amount, team size, time saved), and shows judgment and ownership — not just what was done, but why, and what the result was.

Rules for questions:
- Cover these sections in order: Opening & About You (3 questions), Experience & Skills (4 questions), Behavioural (5 questions), Situational (4 questions), Leadership & Teamwork (4 questions), Strengths & Self-Awareness (3 questions), Culture Fit & Motivation (3 questions), Role-Specific & Future (3 questions), Salary & Expectations (2 questions then Closing).
- Questions should be natural and conversational, tailored to the job description.
- If this is a management/supervisory role, weight Situational and Leadership & Teamwork toward the diagnostic scenario questions a real panel asks a manager — e.g. "What would you do if your team looks busy but results aren't matching the effort?", "How do you supervise your team without micromanaging?", "How do you identify and handle underperformance?", "What routines or reports would you introduce to keep the team accountable?", "How do you avoid becoming a passive supervisor?" Adapt each scenario to the role's actual domain (sales, ops, engineering, etc.) rather than copying these verbatim.
- If this is an individual-contributor role, keep Situational questions focused on the candidate's own problem-solving, prioritisation and delivery under constraints rather than managing others.

Rules for answers:
- EVERY answer MUST reference at least one specific skill, tool, company, achievement, or experience extracted from the candidate's qualifications. Never write a generic answer that could apply to any candidate.
- If the candidate mentions specific tools (e.g. Excel, Python, Salesforce), name those tools in the answer.
- If the candidate mentions specific roles or employers, reference them naturally in the answer.
- If the candidate mentions specific achievements or numbers, use them in relevant answers.
- For management/leadership answers specifically, mention how the candidate would track or prove results — weekly reviews, scorecards, dashboards, CRM records, check-ins — evidence-based accountability is what makes a leadership answer read as senior and credible rather than vague.
- Write answers as the candidate speaking naturally — human-like, not corporate or robotic.
- Use phrases like "Honestly, I think...", "Sure.", "To give you a concrete example..." occasionally.
- Do NOT use first-person pronouns excessively — vary the sentence structure.
- Do NOT reveal the candidate's contact details, LinkedIn, CV headers, or location.
- Keep answers concise — 3–5 sentences max per answer.
- The opening question must greet ${name} by name.

Return raw JSON (no markdown, no code fences) as an object whose single "qa" key holds the array of all 30 pairs, in this exact structure:
{"qa": [
  {"section": "Opening & About You", "question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]}

Only include "section" on the first question of each new section.`;

  const userPrompt = `Job Description:\n${jobDescription.slice(0, 3000)}\n\nCandidate Qualifications (from CV):\n${qualifications.slice(0, 2000)}`;

  try {
    const raw = await aiText({
      tier: "bulk",
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 6000,
      json: true,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw || "{}");
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 500 });
    }

    // The prompt asks for {qa: [...]}, but stay tolerant of the other shapes a
    // model can land on: a bare array, the array under some other key, an array
    // nested one level down, or — when it reads the schema as a per-item
    // template — a single pair returned on its own.
    type QAItem = { section?: string; question: string; answer: string };
    const isQA = (v: unknown): v is QAItem =>
      !!v && typeof v === "object" && "question" in v && "answer" in v;

    let qa: QAItem[] = [];
    if (Array.isArray(parsed)) {
      qa = parsed as QAItem[];
    } else if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      const values = Object.values(obj);
      const found =
        (Array.isArray(obj.qa) ? obj.qa : undefined) ??
        values.find((v) => Array.isArray(v)) ??
        values
          .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
          .flatMap((v) => Object.values(v))
          .find((v) => Array.isArray(v));
      if (found) qa = found as QAItem[];
      else if (isQA(obj)) qa = [obj as QAItem];
    }
    qa = qa.filter(isQA);

    if (!qa.length) {
      return NextResponse.json({ error: "AI returned no questions." }, { status: 500 });
    }

    return NextResponse.json({ qa });
  } catch (err) {
    console.error("Interview generate error:", err);
    if (err instanceof AiError && (err.status === 401 || err.status === 429)) {
      return NextResponse.json(
        { error: "AI is unavailable right now. Please try again shortly." },
        { status: err.status }
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("429") || message.includes("quota") || message.includes("billing")) {
      return NextResponse.json({ error: "OpenAI quota exceeded. Please check your billing." }, { status: 429 });
    }
    return NextResponse.json({ error: `AI request failed: ${message}` }, { status: 500 });
  }
}
