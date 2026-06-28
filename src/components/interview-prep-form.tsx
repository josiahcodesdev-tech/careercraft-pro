"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Download,
  FileText,
  Sparkles,
  Loader2,
  User,
  MessageSquare,
  Upload,
} from "lucide-react";

interface QA {
  question: string;
  answer: string;
}

interface PrepData {
  candidateName: string;
  jobDescription: string;
  qualifications: string;
}

function extractKeywords(jd: string): string[] {
  const text = jd.toLowerCase();
  const keywords: string[] = [];

  const skillPatterns = [
    "python", "java", "javascript", "typescript", "react", "node",
    "sql", "excel", "power bi", "tableau", "aws", "azure", "gcp",
    "docker", "kubernetes", "git", "agile", "scrum", "jira",
    "machine learning", "data analysis", "project management",
    "communication", "leadership", "teamwork", "problem-solving",
    "stakeholder", "budget", "reporting", "strategy", "planning",
    "customer service", "sales", "marketing", "operations",
    "compliance", "risk management", "negotiation", "presentation",
  ];

  for (const skill of skillPatterns) {
    if (text.includes(skill)) keywords.push(skill);
  }

  return keywords.slice(0, 8);
}

function extractJobTitle(jd: string): string {
  const lines = jd.trim().split("\n").filter((l) => l.trim());
  if (lines.length > 0) {
    const first = lines[0].trim();
    if (first.length < 80) return first;
  }
  return "this role";
}

function generateDialogue(name: string, jd: string, qualifications: string): QA[] {
  const keywords = extractKeywords(jd);
  const title = extractJobTitle(jd);
  const skillsList = keywords.length > 0 ? keywords.join(", ") : "the required skills";
  const topSkills = keywords.slice(0, 3).join(", ") || "relevant tools and methodologies";
  const quals = qualifications.trim();
  const qualsSnippet = quals
    ? quals.split("\n").filter((l) => l.trim()).slice(0, 3).join(", ").substring(0, 200)
    : "";
  const backgroundLine = quals
    ? `My background includes ${qualsSnippet}, which I've applied across various roles to deliver measurable results.`
    : `Over the years, I've developed expertise in ${topSkills}, and I'm passionate about delivering results that align with organisational goals.`;
  const qualsFit = quals
    ? `My qualifications — including ${qualsSnippet} — directly align with what you're looking for.`
    : `The job description highlights ${skillsList}, which are areas I've actively worked in.`;

  return [
    {
      question: `Good morning, ${name}. Thank you for coming in today. Could you start by telling me a little about yourself?`,
      answer: `Thank you for having me. I'm ${name}, a professional with a strong background relevant to ${title}. ${backgroundLine} I'm excited about this opportunity because it matches both my skills and my career aspirations.`,
    },
    {
      question: `What interests you about ${title} and why did you apply?`,
      answer: `I was drawn to this position because it aligns closely with my experience and the direction I want to grow in. ${qualsFit} I'm also impressed by the organisation's mission and believe I can contribute meaningfully from day one.`,
    },
    {
      question: "Can you walk me through your most relevant experience for this role?",
      answer: `Certainly. In my most recent role, I was responsible for tasks directly related to ${topSkills}. I led initiatives that delivered measurable outcomes — for example, I streamlined processes that improved efficiency and collaborated with cross-functional teams to ensure project success. These experiences have prepared me well for the responsibilities outlined in your job description.`,
    },
    {
      question: `The role requires strong skills in ${skillsList}. How would you rate your proficiency, and can you give an example?`,
      answer: `I'd rate myself highly proficient in these areas. For instance, I've used ${keywords[0] || "these tools"} extensively in previous projects to analyse data, generate reports, and support decision-making. I make it a priority to stay updated through continuous learning, and I'm confident I can apply these skills effectively in this role.`,
    },
    {
      question: "Tell me about a time you faced a significant challenge at work. How did you handle it?",
      answer: `In a previous role, I encountered a situation where a critical project was at risk of missing its deadline due to unforeseen resource constraints. I took the initiative to reassess priorities, reallocate tasks within the team, and communicate transparently with stakeholders about revised timelines. As a result, we delivered the project on time with no compromise on quality. It reinforced my ability to stay calm under pressure and find practical solutions.`,
    },
    {
      question: "How do you handle competing priorities and tight deadlines?",
      answer: `I rely on structured prioritisation — I assess tasks by urgency and impact, break larger deliverables into manageable steps, and use tools like task boards or scheduling software to stay on track. I also communicate proactively with my team and manager to ensure alignment. This approach has consistently helped me meet deadlines without sacrificing the quality of my work.`,
    },
    {
      question: "Describe a situation where you had to work with a difficult colleague or stakeholder.",
      answer: `I once worked with a stakeholder who had very different expectations from the project team. Rather than letting tension build, I scheduled a one-on-one conversation to understand their perspective and concerns. By actively listening and finding common ground, we agreed on a revised approach that satisfied both sides. The experience taught me the value of empathy and direct communication in professional relationships.`,
    },
    {
      question: "Where do you see yourself in the next three to five years?",
      answer: `In the next few years, I see myself growing into a more senior role where I can take on greater responsibility, mentor others, and contribute to strategic decision-making. I'm looking for an organisation where I can develop long-term, and this role feels like an ideal next step in that direction.`,
    },
    {
      question: "What would you say is your greatest weakness?",
      answer: `I tend to be overly detail-oriented, which sometimes means I spend more time than necessary perfecting work. I've been actively working on this by setting time boundaries for tasks and trusting my initial output more. It's an ongoing process, but I've seen real improvement in my overall productivity without sacrificing quality.`,
    },
    {
      question: `Why should we hire you for ${title}?`,
      answer: quals
        ? `I bring a strong combination of qualifications — including ${qualsSnippet} — along with hands-on experience in ${topSkills}. I've demonstrated the ability to adapt quickly, collaborate effectively, and drive outcomes that matter. I believe my background and values are well aligned with what you're looking for, and I'm confident I would make a positive contribution to your team.`
        : `I bring a strong combination of ${topSkills} expertise, a proven track record of delivering results, and a genuine enthusiasm for this kind of work. I've demonstrated the ability to adapt quickly, collaborate effectively, and drive outcomes that matter. I believe my skills and values are well aligned with what you're looking for, and I'm confident I would make a positive contribution to your team.`,
    },
    {
      question: "Do you have any questions for us?",
      answer: `Yes, I do. Could you tell me more about the team I'd be working with and how success is measured in this role? I'd also be interested to know what the biggest priorities are for the first 90 days. Finally, what opportunities exist for professional development within the organisation?`,
    },
  ];
}

export function InterviewPrepForm() {
  const [data, setData] = useState<PrepData>({
    candidateName: "",
    jobDescription: "",
    qualifications: "",
  });
  const [dialogue, setDialogue] = useState<QA[]>([]);
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const canGenerate = data.candidateName.trim() && data.jobDescription.trim();

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    setGenerating(true);
    setTimeout(() => {
      const result = generateDialogue(data.candidateName.trim(), data.jobDescription, data.qualifications);
      setDialogue(result);
      setGenerating(false);
    }, 800);
  }, [canGenerate, data.candidateName, data.jobDescription]);

  function handlePrint() {
    const el = previewRef.current;
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Interview Prep — ${data.candidateName || "Candidate"}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:10pt;color:#1a1a1a;padding:0.25in;line-height:1.6}
h1{font-size:16pt;font-weight:700;color:#1B3A5C;margin-bottom:4px}
.subtitle{font-size:9pt;color:#777;margin-bottom:18px}
.qa{margin-bottom:16px;page-break-inside:avoid}
.speaker{font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px}
.interviewer{color:#1B3A5C}
.candidate{color:#1A5C3A}
.text{font-size:9.5pt;text-align:justify;line-height:1.6}
@media print{body{padding:0.25in}@page{margin:0.25in}}
</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel — Form */}
      <div className="w-full lg:w-[420px] overflow-y-auto border-r border-border bg-background flex-shrink-0">
        <div className="p-8">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand mb-2">
              Interview Preparation
            </p>
            <h1 className="font-heading text-2xl font-black tracking-tight leading-tight mb-2">
              Prepare for your interview
            </h1>
            <p className="text-sm text-text-secondary">
              Enter your name and paste the job description. We&apos;ll generate
              a personalised interview dialogue with anticipated questions and
              model answers.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <label className="space-y-1.5 block">
              <span className="text-sm font-medium">
                Your name <span className="text-red-500">*</span>
              </span>
              <Input
                value={data.candidateName}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, candidateName: e.target.value }))
                }
                placeholder="Josiah Mwangi"
              />
            </label>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Job description <span className="text-red-500">*</span>
                </span>
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium cursor-pointer hover:bg-background transition-colors">
                  <Upload className="w-3 h-3" /> Upload file
                  <input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const text = reader.result as string;
                        setData((prev) => ({ ...prev, jobDescription: text }));
                      };
                      reader.readAsText(file);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              <Textarea
                value={data.jobDescription}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    jobDescription: e.target.value,
                  }))
                }
                placeholder="Paste the full job description here or upload a file..."
                className="min-h-[280px]"
              />
              <p className="text-xs text-text-muted">
                Supports .txt, .pdf, and .docx files. You can also paste
                directly into the field above.
              </p>
            </div>

            <label className="space-y-1.5 block">
              <span className="text-sm font-medium">Your qualifications</span>
              <Textarea
                value={data.qualifications}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    qualifications: e.target.value,
                  }))
                }
                placeholder={"e.g.\nBSc Computer Science — University of Nairobi\nAWS Certified Solutions Architect\n5 years experience in data analysis\nProficient in Python, SQL, Power BI"}
                className="min-h-[120px]"
              />
              <p className="text-xs text-text-muted">
                List your degrees, certifications, skills, and years of
                experience. These will be woven into your answers.
              </p>
            </label>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className={cn(
                buttonVariants(),
                "bg-brand hover:bg-brand-mid text-white w-full gap-2 disabled:opacity-40"
              )}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Interview Prep
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right panel — Preview */}
      <div className="hidden lg:flex flex-1 flex-col bg-[#f0efe9] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <span className="text-sm font-semibold text-text-secondary">
            Interview Dialogue
          </span>
          {dialogue.length > 0 && (
            <button
              onClick={handlePrint}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-8 text-xs gap-1.5"
              )}
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div
            ref={previewRef}
            className="bg-white rounded-lg shadow-md mx-auto p-10 sm:p-12"
            style={{
              fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
              maxWidth: 700,
              minHeight: 900,
            }}
          >
            {dialogue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[600px] text-center text-text-muted">
                <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">
                  Enter your name and paste a job description,
                  <br />
                  then click &ldquo;Generate&rdquo; to create your
                  <br />
                  personalised interview dialogue.
                </p>
              </div>
            ) : (
              <>
                <h1
                  style={{
                    fontSize: "16pt",
                    fontWeight: 700,
                    color: "#1B3A5C",
                    marginBottom: 4,
                  }}
                >
                  Interview Preparation
                </h1>
                <div
                  className="subtitle"
                  style={{
                    fontSize: "9pt",
                    color: "#777",
                    marginBottom: 18,
                    borderBottom: "2px solid #1B3A5C",
                    paddingBottom: 10,
                  }}
                >
                  Candidate: {data.candidateName} &nbsp;|&nbsp; Role:{" "}
                  {extractJobTitle(data.jobDescription)}
                </div>

                {dialogue.map((qa, i) => (
                  <div
                    key={i}
                    className="qa"
                    style={{ marginBottom: 18, pageBreakInside: "avoid" }}
                  >
                    {/* Interviewer */}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "#EDF1F5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <User
                          style={{ width: 14, height: 14, color: "#1B3A5C" }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          className="speaker interviewer"
                          style={{
                            fontSize: "8pt",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: "#1B3A5C",
                            marginBottom: 3,
                          }}
                        >
                          Interviewer
                        </div>
                        <div
                          className="text"
                          style={{
                            fontSize: "9.5pt",
                            lineHeight: 1.6,
                            textAlign: "justify",
                          }}
                        >
                          {qa.question}
                        </div>
                      </div>
                    </div>

                    {/* Candidate */}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        paddingLeft: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "#EAF3EE",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <FileText
                          style={{ width: 14, height: 14, color: "#1A5C3A" }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          className="speaker candidate"
                          style={{
                            fontSize: "8pt",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: "#1A5C3A",
                            marginBottom: 3,
                          }}
                        >
                          {data.candidateName}
                        </div>
                        <div
                          className="text"
                          style={{
                            fontSize: "9.5pt",
                            lineHeight: 1.6,
                            textAlign: "justify",
                          }}
                        >
                          {qa.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
