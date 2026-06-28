"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { extractTextFromPdf } from "@/lib/pdf-extract";
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
  X,
} from "lucide-react";

interface QA {
  section?: string;
  question: string;
  answer: string;
}

interface PrepData {
  candidateName: string;
  roleTitle: string;
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

function generateDialogue(name: string, role: string, jd: string, qualifications: string): QA[] {
  const keywords = extractKeywords(jd);
  const title = role.trim() || extractJobTitle(jd);
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
    // ── Opening & About You ──────────────────────────────
    {
      section: "Opening & About You",
      question: `Good morning, ${name}. Thank you for coming in today. Could you start by telling me a little about yourself?`,
      answer: `Thank you for having me. I'm ${name}, a professional with a strong background relevant to ${title}. ${backgroundLine} I'm excited about this opportunity because it matches both my skills and my career aspirations.`,
    },
    {
      question: "Walk me through your CV. What would you like to highlight?",
      answer: quals
        ? `Certainly. My key qualifications include ${qualsSnippet}. Throughout my career, I've focused on applying these in practical, results-driven ways — whether that's leading projects, improving processes, or collaborating across teams. I'd be happy to go deeper into any specific area.`
        : `My career has been focused on building expertise in ${topSkills}. I've progressed through roles that gave me increasing responsibility, and each one strengthened my ability to deliver outcomes. I'd be happy to go deeper into any specific area.`,
    },
    {
      question: `What interests you about ${title} and why did you apply?`,
      answer: `I was drawn to this position because it aligns closely with my experience and the direction I want to grow in. ${qualsFit} I'm also impressed by the organisation's mission and believe I can contribute meaningfully from day one.`,
    },

    // ── Experience & Skills ──────────────────────────────
    {
      section: "Experience & Skills",
      question: "Can you walk me through your most relevant experience for this role?",
      answer: `Certainly. In my most recent role, I was responsible for tasks directly related to ${topSkills}. I led initiatives that delivered measurable outcomes — for example, I streamlined processes that improved efficiency and collaborated with cross-functional teams to ensure project success. These experiences have prepared me well for the responsibilities outlined in your job description.`,
    },
    {
      question: `The role requires strong skills in ${skillsList}. How would you rate your proficiency, and can you give an example?`,
      answer: `I'd rate myself highly proficient in these areas. For instance, I've used ${keywords[0] || "these tools"} extensively in previous projects to analyse data, generate reports, and support decision-making. I make it a priority to stay updated through continuous learning, and I'm confident I can apply these skills effectively in this role.`,
    },
    {
      question: "What is your greatest professional achievement?",
      answer: `One achievement I'm particularly proud of was leading a project that had a direct, measurable impact on the organisation. I identified an opportunity to improve an existing process using ${keywords[1] || "the tools available"}, proposed a solution, secured stakeholder buy-in, and delivered the project ahead of schedule. It resulted in significant efficiency gains and was recognised by senior leadership.`,
    },
    {
      question: "How do you stay current with developments in your field?",
      answer: `I'm committed to continuous learning. I regularly follow industry publications, participate in online courses and webinars, and engage with professional communities. I also apply new knowledge practically — for example, when I learned about advancements in ${keywords[0] || "my field"}, I immediately looked for ways to integrate them into my workflow.`,
    },

    // ── Behavioural ──────────────────────────────────────
    {
      section: "Behavioural",
      question: "Tell me about a time you faced a significant challenge at work. How did you handle it?",
      answer: `In a previous role, I encountered a situation where a critical project was at risk of missing its deadline due to unforeseen resource constraints. I took the initiative to reassess priorities, reallocate tasks within the team, and communicate transparently with stakeholders about revised timelines. As a result, we delivered the project on time with no compromise on quality. It reinforced my ability to stay calm under pressure and find practical solutions.`,
    },
    {
      question: "Tell me about a time you failed. What did you learn from it?",
      answer: `Early in my career, I underestimated the time required for a deliverable and committed to an unrealistic deadline. The work was completed but not to the standard I wanted. I learned the importance of honest estimation, building in buffers, and communicating early when timelines are at risk. Since then, I've been much more disciplined about planning and have rarely missed a deadline.`,
    },
    {
      question: "Describe a situation where you had to work with a difficult colleague or stakeholder.",
      answer: `I once worked with a stakeholder who had very different expectations from the project team. Rather than letting tension build, I scheduled a one-on-one conversation to understand their perspective and concerns. By actively listening and finding common ground, we agreed on a revised approach that satisfied both sides. The experience taught me the value of empathy and direct communication in professional relationships.`,
    },
    {
      question: "Give an example of when you took initiative without being asked.",
      answer: `I noticed that our team was spending a lot of time on a repetitive manual process. Without being asked, I researched alternatives, built a simple automation solution, and presented it to my manager. After a brief pilot, it was adopted across the team and saved several hours each week. It showed me the value of being proactive and solution-oriented.`,
    },
    {
      question: "Tell me about a time you received critical feedback. How did you respond?",
      answer: `A manager once told me that while my work quality was strong, I needed to communicate progress more frequently with the team. I took the feedback seriously and immediately started providing regular status updates and check-ins. Over time, the collaboration improved significantly, and my manager later acknowledged the positive change. I believe feedback is a gift that helps us grow.`,
    },

    // ── Situational ──────────────────────────────────────
    {
      section: "Situational",
      question: "How do you handle competing priorities and tight deadlines?",
      answer: `I rely on structured prioritisation — I assess tasks by urgency and impact, break larger deliverables into manageable steps, and use tools like task boards or scheduling software to stay on track. I also communicate proactively with my team and manager to ensure alignment. This approach has consistently helped me meet deadlines without sacrificing the quality of my work.`,
    },
    {
      question: "What would you do if you were assigned a task you had never done before?",
      answer: `I'd approach it with curiosity rather than anxiety. First, I'd research the task, review any available documentation, and identify colleagues or resources that could help. I'd break it into smaller steps, start with what I do understand, and ask targeted questions along the way. I've found that most unfamiliar tasks become manageable once you take that first structured step.`,
    },
    {
      question: "How would you handle a disagreement with your manager about a project direction?",
      answer: `I'd start by making sure I fully understand my manager's perspective and reasoning. Then I'd present my viewpoint with supporting evidence, framing it as a suggestion rather than opposition. Ultimately, I respect the chain of decision-making — if my manager still prefers a different direction after hearing me out, I'd commit fully and execute to the best of my ability.`,
    },
    {
      question: "If you discovered a colleague was underperforming, what would you do?",
      answer: `I'd first consider whether there might be circumstances I'm not aware of. If appropriate, I'd offer support privately — sometimes a colleague just needs help or someone to listen. If the underperformance was affecting the team's output, I'd raise it respectfully with my manager rather than making assumptions or creating tension.`,
    },

    // ── Leadership & Teamwork ────────────────────────────
    {
      section: "Leadership & Teamwork",
      question: "Describe your approach to working in a team.",
      answer: `I believe strong teamwork is built on clear communication, mutual respect, and shared accountability. I make it a point to understand my teammates' strengths and working styles, contribute openly in discussions, and support others when they need help. I've found that teams perform best when everyone feels heard and valued.`,
    },
    {
      question: "Have you ever had to lead a project or team? How did you approach it?",
      answer: `Yes, I've led several projects. My approach starts with establishing clear goals and roles, then creating a realistic timeline with milestones. I hold regular check-ins, encourage open feedback, and make myself available for support. I believe leadership is about enabling others to do their best work rather than directing every step.`,
    },
    {
      question: "How do you handle conflict within a team?",
      answer: `I address conflict early and directly, but always with respect. I bring the parties together, encourage each person to share their perspective, and focus the conversation on finding a solution rather than assigning blame. In my experience, most conflicts stem from miscommunication and can be resolved quickly when people feel heard.`,
    },
    {
      question: "Give an example of how you mentored or developed someone.",
      answer: `I once mentored a junior colleague who was struggling with confidence in presentations. I shared techniques I'd learned, practised with them before team meetings, and gave constructive feedback each time. Over a few months, their presentation skills improved noticeably, and they went on to lead client-facing presentations independently. It was one of the most rewarding experiences in my career.`,
    },

    // ── Strengths, Weaknesses & Self-awareness ───────────
    {
      section: "Strengths & Self-Awareness",
      question: "What are your greatest strengths?",
      answer: quals
        ? `My greatest strengths are my analytical thinking, adaptability, and commitment to quality. Combined with my qualifications in ${qualsSnippet}, I'm able to approach complex problems methodically, deliver under pressure, and maintain high standards even in fast-paced environments.`
        : `My greatest strengths are my analytical thinking, adaptability, and commitment to quality. I approach complex problems methodically, deliver under pressure, and maintain high standards even in fast-paced environments. Colleagues often tell me I'm reliable and solution-oriented.`,
    },
    {
      question: "What would you say is your greatest weakness?",
      answer: `I tend to be overly detail-oriented, which sometimes means I spend more time than necessary perfecting work. I've been actively working on this by setting time boundaries for tasks and trusting my initial output more. It's an ongoing process, but I've seen real improvement in my overall productivity without sacrificing quality.`,
    },
    {
      question: "How would your previous manager describe you?",
      answer: `I believe they would describe me as dependable, proactive, and someone who takes ownership of their work. They'd likely mention my willingness to go beyond my role when needed and my ability to collaborate well across teams. I've consistently received positive feedback in performance reviews on these qualities.`,
    },

    // ── Culture Fit & Motivation ─────────────────────────
    {
      section: "Culture Fit & Motivation",
      question: "What type of work environment do you thrive in?",
      answer: `I thrive in environments that value collaboration, continuous learning, and accountability. I appreciate clear expectations and the autonomy to figure out the best way to meet them. A culture that encourages open communication and recognises effort motivates me to consistently deliver my best.`,
    },
    {
      question: "What motivates you professionally?",
      answer: `I'm motivated by meaningful work — knowing that what I do contributes to something larger. I also find motivation in solving complex problems, developing new skills, and seeing the tangible impact of my contributions. Recognition from peers and the opportunity to grow are also important drivers for me.`,
    },
    {
      question: "Why are you leaving your current role?",
      answer: `I've valued the experience and growth my current role has given me, but I'm now looking for new challenges and opportunities to expand my impact. This role at your organisation is particularly exciting because it aligns with both my expertise and my long-term career goals.`,
    },

    // ── Role-specific & Future ───────────────────────────
    {
      section: "Role-Specific & Future",
      question: "Where do you see yourself in the next three to five years?",
      answer: `In the next few years, I see myself growing into a more senior role where I can take on greater responsibility, mentor others, and contribute to strategic decision-making. I'm looking for an organisation where I can develop long-term, and this role feels like an ideal next step in that direction.`,
    },
    {
      question: "What would your first 90 days look like in this role?",
      answer: `In the first 30 days, I'd focus on understanding the team, the systems, and the immediate priorities. In the next 30, I'd start contributing to active projects and identifying quick wins. By day 90, I'd aim to be fully productive, delivering value independently while building strong working relationships across the organisation.`,
    },
    {
      question: `Why should we hire you for ${title}?`,
      answer: quals
        ? `I bring a strong combination of qualifications — including ${qualsSnippet} — along with hands-on experience in ${topSkills}. I've demonstrated the ability to adapt quickly, collaborate effectively, and drive outcomes that matter. I believe my background and values are well aligned with what you're looking for, and I'm confident I would make a positive contribution to your team.`
        : `I bring a strong combination of ${topSkills} expertise, a proven track record of delivering results, and a genuine enthusiasm for this kind of work. I've demonstrated the ability to adapt quickly, collaborate effectively, and drive outcomes that matter. I believe my skills and values are well aligned with what you're looking for, and I'm confident I would make a positive contribution to your team.`,
    },

    // ── Salary & Expectations ────────────────────────────
    {
      section: "Salary & Expectations",
      question: "What are your salary expectations?",
      answer: `I'm open to discussing compensation that reflects the responsibilities of the role and my level of experience. I've done some market research and have a range in mind, but I'd like to understand the full package — including benefits and growth opportunities — before discussing specifics. I'm confident we can find a figure that works for both sides.`,
    },
    {
      question: "When would you be available to start?",
      answer: `I'd need to give appropriate notice in my current role, which would typically be two to four weeks. I'm happy to be flexible and work with your timeline to ensure a smooth transition.`,
    },

    // ── Closing ──────────────────────────────────────────
    {
      section: "Closing",
      question: "Is there anything else you'd like us to know about you?",
      answer: `I'd just like to reiterate how enthusiastic I am about this opportunity. ${quals ? `My qualifications in ${qualsSnippet} combined with` : "My"} practical experience make me confident I can hit the ground running and add real value to your team. I'm genuinely excited about the possibility of contributing here.`,
    },
    {
      question: "Do you have any questions for us?",
      answer: `Yes, I do. Could you tell me more about the team I'd be working with and how success is measured in this role? What are the biggest challenges facing the team right now? I'd also be interested to know what the biggest priorities are for the first 90 days and what opportunities exist for professional development within the organisation. Finally, what are the next steps in the interview process?`,
    },
  ];
}

export function InterviewPrepForm() {
  const [data, setData] = useState<PrepData>({
    candidateName: "",
    roleTitle: "",
    jobDescription: "",
    qualifications: "",
  });
  const [dialogue, setDialogue] = useState<QA[]>([]);
  const [generating, setGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string>("");
  const [uploadedCv, setUploadedCv] = useState<string>("");
  const previewRef = useRef<HTMLDivElement>(null);

  const canGenerate = data.candidateName.trim() && data.roleTitle.trim() && data.jobDescription.trim();

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    setGenerating(true);
    setTimeout(() => {
      const result = generateDialogue(data.candidateName.trim(), data.roleTitle, data.jobDescription, data.qualifications);
      setDialogue(result);
      setGenerating(false);
      import("@/lib/analytics").then(({ trackInterviewPrep }) => {
        trackInterviewPrep({ name: data.candidateName.trim(), role: data.roleTitle });
      });
    }, 800);
  }, [canGenerate, data.candidateName, data.roleTitle, data.jobDescription, data.qualifications]);

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

            <label className="space-y-1.5 block">
              <span className="text-sm font-medium">
                Role / Job title <span className="text-red-500">*</span>
              </span>
              <Input
                value={data.roleTitle}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, roleTitle: e.target.value }))
                }
                placeholder="e.g. Data Analyst, Project Manager"
              />
            </label>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Job description <span className="text-red-500">*</span>
                </span>
                {!uploadedFile && (
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium cursor-pointer hover:bg-background transition-colors">
                    <Upload className="w-3 h-3" /> Upload file
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          let text: string;
                          if (file.name.toLowerCase().endsWith(".pdf")) {
                            text = await extractTextFromPdf(file);
                          } else {
                            text = await file.text();
                          }
                          setData((prev) => ({ ...prev, jobDescription: text }));
                          setUploadedFile(file.name);
                        } catch {
                          alert("Could not read this file. Try pasting the content directly.");
                        }
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {uploadedFile ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
                  <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile}</p>
                    <p className="text-xs text-text-muted">Uploaded successfully</p>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile("");
                      setData((prev) => ({ ...prev, jobDescription: "" }));
                    }}
                    className="text-text-muted hover:text-red-500 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
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
              )}
              <p className="text-xs text-text-muted">
                {uploadedFile
                  ? "File content will be used to generate your interview prep."
                  : "Supports .txt, .pdf, and .docx files. You can also paste directly."}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your qualifications</span>
                {!uploadedCv && (
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium cursor-pointer hover:bg-background transition-colors">
                    <Upload className="w-3 h-3" /> Upload CV
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          let text: string;
                          if (file.name.toLowerCase().endsWith(".pdf")) {
                            text = await extractTextFromPdf(file);
                          } else {
                            text = await file.text();
                          }
                          setData((prev) => ({
                            ...prev,
                            qualifications: prev.qualifications
                              ? prev.qualifications + "\n\n" + text
                              : text,
                          }));
                          setUploadedCv(file.name);
                        } catch {
                          alert("Could not read this file. Try pasting the content directly.");
                        }
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {uploadedCv && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
                  <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedCv}</p>
                    <p className="text-xs text-text-muted">CV extracted successfully</p>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedCv("");
                      setData((prev) => ({ ...prev, qualifications: "" }));
                    }}
                    className="text-text-muted hover:text-red-500 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <Textarea
                value={data.qualifications}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    qualifications: e.target.value,
                  }))
                }
                placeholder={"e.g.\nBSc Computer Science — University of Nairobi\nAWS Certified Solutions Architect\n5 years experience in data analysis\nProficient in Python, SQL, Power BI"}
                className={uploadedCv ? "min-h-[80px]" : "min-h-[120px]"}
              />
              <p className="text-xs text-text-muted">
                {uploadedCv
                  ? "CV content extracted. You can edit or add more details below."
                  : "Upload your CV to auto-fill, or type your degrees, certifications, skills, and experience."}
              </p>
            </div>

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
                  {data.roleTitle || extractJobTitle(data.jobDescription)}
                </div>

                {dialogue.map((qa, i) => (
                  <div key={i}>
                    {qa.section && (
                      <div
                        style={{
                          fontSize: "9pt",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "1.5px",
                          color: "#1B3A5C",
                          borderBottom: "2px solid #1B3A5C",
                          paddingBottom: 4,
                          marginTop: i === 0 ? 0 : 22,
                          marginBottom: 14,
                        }}
                      >
                        {qa.section}
                      </div>
                    )}
                    <div
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
