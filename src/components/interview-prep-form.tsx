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
  const nameParts = name.toLowerCase().split(/\s+/);
  const contentLines = quals
    ? quals
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => {
          if (!l || l.length <= 5) return false;
          if (/^[A-Z\s&,|·•\-:/()]+$/.test(l)) return false;
          if (/^(professional\s+summary|professional\s+experience|work\s+experience|experience|education|skills|core\s+skills|key\s+skills|technical\s+skills|soft\s+skills|certifications?|references?|referees?|contact(\s+me)?|personal\s+(details|info|information)|objective|career\s+objective|profile|summary|about\s+me|work\s+history|qualifications|competenc|training|awards|hobbies|interests|languages?|projects?|publications?|curriculum\s+vitae|resume|cv|phone|email|address|location|linkedin|date\s+of\s+birth|nationality|gender|marital|id\s+no|passport)\s*:?\s*$/i.test(l)) return false;
          if (/^[\+]?\d[\d\s\-()]{6,}$/.test(l)) return false;
          if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(l)) return false;
          if (/https?:\/\//i.test(l) || /linkedin/i.test(l)) return false;
          if (/^(january|february|march|april|may|june|july|august|september|october|november|december|\d{4})\s*[-–—to]\s*/i.test(l) && l.length < 30) return false;
          if (/^(present|current|to\s+date|ongoing)\s*$/i.test(l)) return false;
          if (l.split(" ").length <= 2 && /^[A-Z]/.test(l)) return false;
          const lower = l.toLowerCase();
          if (nameParts.length >= 2 && nameParts.every((p) => lower.includes(p)) && l.split(" ").length <= 4) return false;
          if (/^[A-Za-z\s]+(\s*[|·\/&]\s*[A-Za-z\s]+){1,}$/.test(l) && l.split(" ").length <= 10) return false;
          if (/^(phone|tel|mobile|cell|whatsapp)\s*:?\s*/i.test(l)) return false;
          if (/^(nairobi|mombasa|kisumu|kenya|address)\s*[,:]?\s*/i.test(l) && l.split(" ").length <= 5) return false;
          // Date-only or timeframe-only lines
          if (/^\d{4}\s*[-–—]\s*(\d{4}|present|current|to\s+date)/i.test(l) && l.split(" ").length <= 5) return false;
          if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}/i.test(l) && l.split(" ").length <= 5) return false;
          return true;
        })
    : [];

  function stripDates(text: string): string {
    return text
      .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/gi, "")
      .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}/gi, "")
      .replace(/\b\d{4}\s*[-–—]\s*(\d{4}|present|current|to\s+date|ongoing)/gi, "")
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}/g, "")
      .replace(/\b\d{4}\b/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function summarizeDegree(text: string): string {
    return text
      .replace(/\b(bachelor\s+of\s+science|b\.?sc\.?)\s+(in\s+)?/gi, "a degree in ")
      .replace(/\b(bachelor\s+of\s+arts|b\.?a\.?)\s+(in\s+)?/gi, "a degree in ")
      .replace(/\b(master\s+of\s+science|m\.?sc\.?)\s+(in\s+)?/gi, "a postgraduate degree in ")
      .replace(/\b(master\s+of\s+arts|m\.?a\.?)\s+(in\s+)?/gi, "a postgraduate degree in ")
      .replace(/\b(master\s+of\s+business\s+administration|m\.?b\.?a\.?)\b/gi, "a business administration qualification")
      .replace(/\b(doctor\s+of\s+philosophy|ph\.?d\.?)\s+(in\s+)?/gi, "a doctoral qualification in ")
      .replace(/\b(diploma|higher\s+diploma|h\.?nd\.?)\s+(in\s+)?/gi, "a diploma in ")
      .replace(/\b(certificate|certification)\s+(in\s+)?/gi, "a certification in ")
      .trim();
  }

  const cleanedLines = contentLines.map((l) => stripDates(l)).filter((l) => l.length > 5);

  // Only pick skills that match JD keywords
  const jdText = jd.toLowerCase();
  const relevantSkills = cleanedLines
    .filter((l) => /[,·;]/.test(l) || /proficient|experienced|skilled|knowledge/i.test(l))
    .flatMap((l) => l.split(/[,·;]/).map((s) => s.trim()))
    .filter((s) => s.length > 2 && keywords.some((k) => s.toLowerCase().includes(k) || jdText.includes(s.toLowerCase())))
    .slice(0, 6);
  const cvSkillsSummary = relevantSkills.length > 0 ? relevantSkills.join(", ") : "";

  // Experience: pick top 3 most relevant to JD, summarize
  const cvExperience = cleanedLines
    .filter((l) => /\b(managed|led|developed|built|implemented|delivered|responsible|coordinated|designed|created)\b/i.test(l))
    .filter((l) => keywords.some((k) => l.toLowerCase().includes(k)) || l.split(" ").length > 5)
    .slice(0, 3)
    .join(". ");

  // Education lines — only for education-specific answers
  const educationLines = cleanedLines
    .filter((l) => /\b(degree|bachelor|master|diploma|certificate|university|college|school|institute)\b/i.test(l))
    .map(summarizeDegree)
    .slice(0, 2);

  // Use only top 3 JD-relevant skills for natural answers
  const relevantTopSkills = cvSkillsSummary
    ? cvSkillsSummary.split(", ").slice(0, 3).join(", ")
    : topSkills;
  const backgroundLine = cvExperience
    ? `I've spent much of my career working with ${relevantTopSkills}, and most recently I've been focused on work that's closely aligned with what this role involves.`
    : `Over the years, I've built strong experience in ${relevantTopSkills}, and I'm passionate about using those skills to deliver real impact.`;
  const qualsFit = `The role's focus on ${relevantTopSkills} is a strong match for the kind of work I've been doing and want to continue growing in.`;

  return [
    // ── Opening & About You ──────────────────────────────
    {
      section: "Opening & About You",
      question: `Good morning, ${name}. Thank you for coming in today. Could you start by telling me a little about yourself?`,
      answer: `Thank you for having me. I'm ${name}, a professional with a strong background relevant to ${title}. ${backgroundLine} I'm excited about this opportunity because it matches both my skills and my career aspirations.`,
    },
    {
      question: "Walk me through your CV. What would you like to highlight?",
      answer: `Sure. The thread running through my career has been ${relevantTopSkills}. I've moved through roles where I took on more responsibility each time, and I'd say the biggest constant has been a focus on delivering work that actually makes a difference. Happy to dive into any part of it.`,
    },
    {
      question: `What interests you about ${title} and why did you apply?`,
      answer: `I was drawn to this position because it aligns closely with my experience and the direction I want to grow in. ${qualsFit} I'm also impressed by the organisation's mission and believe I can contribute meaningfully from day one.`,
    },

    // ── Experience & Skills ──────────────────────────────
    {
      section: "Experience & Skills",
      question: "Can you walk me through your most relevant experience for this role?",
      answer: cvExperience
        ? `Of course. The work I've done most recently is very relevant here — I've been involved in ${cvExperience.split(". ")[0].toLowerCase()}. That kind of hands-on experience taught me how to deliver under real constraints, and I think it maps directly to what you're looking for in this role.`
        : `Of course. In my most recent role, I worked closely with ${relevantTopSkills}. I took the lead on several initiatives that had a tangible impact — things like streamlining processes and collaborating across teams. That hands-on experience is what I'd bring to this role.`,
    },
    {
      question: `The role requires strong skills in ${skillsList}. How would you rate your proficiency, and can you give an example?`,
      answer: `I'm very comfortable with ${relevantTopSkills}. To give you a concrete example — in a recent project, I used ${keywords[0] || "these skills"} to solve a problem that had been slowing the team down, and the result was a noticeable improvement in how we worked. I'm always looking to sharpen those skills further, whether through practice or staying on top of what's new in the field.`,
    },
    {
      question: "What is your greatest professional achievement?",
      answer: `There's one that stands out. I spotted an opportunity to improve a process that was costing the team time, put together a plan, got buy-in from stakeholders, and delivered it ahead of schedule. The impact was measurable and it was recognised by leadership. It reinforced for me that the best results come from taking initiative and following through.`,
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
      answer: `My greatest strengths are my analytical thinking, adaptability, and commitment to quality. I approach complex problems methodically, deliver under pressure, and maintain high standards even in fast-paced environments. Colleagues often tell me I'm reliable and solution-oriented.`,
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
      answer: `Honestly, I think it comes down to fit. I've got solid experience in ${relevantTopSkills}, I've consistently delivered in roles like this, and I genuinely enjoy this kind of work. I pick things up quickly, I work well with teams, and I care about getting things right. I think I'd add real value here.`,
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
      answer: `Just that I'm genuinely excited about this opportunity. The work you're doing here resonates with me, and I'm confident I can contribute from day one. I'm ready to get started.`,
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
  const [generateError, setGenerateError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string>("");
  const [uploadedCv, setUploadedCv] = useState<string>("");
  const [scanningJd, setScanningJd] = useState(false);
  const [scanningCv, setScanningCv] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  const canGenerate = data.candidateName.trim() && data.roleTitle.trim() && data.jobDescription.trim();

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setGenerateError("");
    try {
      const res = await fetch("/api/interview-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.candidateName.trim(),
          role: data.roleTitle,
          jobDescription: data.jobDescription,
          qualifications: data.qualifications,
        }),
      });
      const json = await res.json() as { qa?: QA[]; error?: string };
      if (!res.ok) {
        // Fallback to local generation if API not configured
        if (res.status === 503) {
          const result = generateDialogue(data.candidateName.trim(), data.roleTitle, data.jobDescription, data.qualifications);
          setDialogue(result);
          import("@/lib/analytics").then(({ trackInterviewPrep }) => {
            trackInterviewPrep(
              { name: data.candidateName.trim(), role: data.roleTitle },
              { ...data, dialogue: result } as unknown as Record<string, unknown>,
            );
          });
          return;
        }
        throw new Error(json.error ?? "Generation failed");
      }
      const result = json.qa ?? [];
      setDialogue(result);
      import("@/lib/analytics").then(({ trackInterviewPrep }) => {
        trackInterviewPrep(
          { name: data.candidateName.trim(), role: data.roleTitle },
          { ...data, dialogue: result } as unknown as Record<string, unknown>,
        );
      });
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Generation failed. Please try again.");
      // Fallback to local generation
      const result = generateDialogue(data.candidateName.trim(), data.roleTitle, data.jobDescription, data.qualifications);
      setDialogue(result);
    } finally {
      setGenerating(false);
    }
  }, [canGenerate, data]);

  function handlePrint() {
    const el = previewRef.current;
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const fileName = `Interview_Prep_${(data.candidateName || "Candidate").replace(/\s+/g, "_")}`;
    win.document.write(`<!DOCTYPE html><html><head><title>${fileName}</title>
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
</style>
<script>window.onload=function(){window.print()}<\/script>
</head><body>${el.innerHTML}</body></html>`);
    win.document.close();
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
                {!uploadedFile && !scanningJd && (
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium cursor-pointer hover:bg-background transition-colors">
                    <Upload className="w-3 h-3" /> Upload file
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setScanningJd(true);
                        setScanStep(0);
                        const stepTimer1 = setTimeout(() => setScanStep(1), 800);
                        const stepTimer2 = setTimeout(() => setScanStep(2), 1800);
                        try {
                          let text: string;
                          if (file.name.toLowerCase().endsWith(".pdf")) {
                            text = await extractTextFromPdf(file);
                          } else {
                            text = await file.text();
                          }
                          await new Promise((r) => setTimeout(r, 2500));
                          setData((prev) => ({ ...prev, jobDescription: text }));
                          setUploadedFile(file.name);
                        } catch {
                          alert("Could not read this file. Try pasting the content directly.");
                        }
                        clearTimeout(stepTimer1);
                        clearTimeout(stepTimer2);
                        setScanningJd(false);
                        setScanStep(0);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {scanningJd ? (
                <ScanningIndicator step={scanStep} label="job description" />
              ) : uploadedFile ? (
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
                {!uploadedCv && !scanningCv && (
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium cursor-pointer hover:bg-background transition-colors">
                    <Upload className="w-3 h-3" /> Upload CV
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setScanningCv(true);
                        setScanStep(0);
                        const stepTimer1 = setTimeout(() => setScanStep(1), 1000);
                        const stepTimer2 = setTimeout(() => setScanStep(2), 2200);
                        try {
                          let text: string;
                          if (file.name.toLowerCase().endsWith(".pdf")) {
                            text = await extractTextFromPdf(file);
                          } else {
                            text = await file.text();
                          }
                          await new Promise((r) => setTimeout(r, 3000));
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
                        clearTimeout(stepTimer1);
                        clearTimeout(stepTimer2);
                        setScanningCv(false);
                        setScanStep(0);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {scanningCv ? (
                <ScanningIndicator step={scanStep} label="CV" />
              ) : uploadedCv ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
                  <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedCv}</p>
                    <p className="text-xs text-text-muted">CV uploaded successfully</p>
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
              ) : (
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
              )}
              <p className="text-xs text-text-muted">
                {uploadedCv
                  ? "Your CV content will be used to personalise your interview answers."
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
            {generateError && (
              <p className="text-xs text-amber-600 mt-2">{generateError} (used local fallback)</p>
            )}
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

const scanSteps = [
  "Scanning document...",
  "Understanding content...",
  "Extracting key information...",
];

function ScanningIndicator({ step, label }: { step: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
        </div>
        <div>
          <p className="text-sm font-medium">Analysing {label}</p>
          <p className="text-xs text-text-muted">Please wait...</p>
        </div>
      </div>
      <div className="space-y-2">
        {scanSteps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            {i < step ? (
              <div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ) : i === step ? (
              <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-border" />
            )}
            <span className={`text-xs ${i <= step ? "text-foreground font-medium" : "text-text-muted"}`}>
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
