"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  Users,
  LayoutTemplate,
} from "lucide-react";

type Template = "classic" | "modern" | "executive" | "minimal";

const TEMPLATES: { id: Template; name: string; description: string; accent: string; font: string }[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional serif layout with black section dividers. Timeless and ATS-proven.",
    accent: "#1a1a1a",
    font: "Palatino Linotype",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Bold green header banner with clean sans-serif typography. Contemporary and eye-catching.",
    accent: "#1A5C3A",
    font: "Segoe UI",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Navy blue accents with a refined sidebar stripe. Ideal for senior and leadership roles.",
    accent: "#1B3A5C",
    font: "Georgia",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean design with subtle grey lines and maximum whitespace. Lets content speak.",
    accent: "#888888",
    font: "Helvetica Neue",
  },
];

interface WorkEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

interface SkillGroup {
  category: string;
  skills: string;
}

interface RefereeEntry {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
}

interface CvData {
  fullName: string;
  tagline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  experience: WorkEntry[];
  education: EducationEntry[];
  skillGroups: SkillGroup[];
  referees: RefereeEntry[];
  referencesUponRequest: boolean;
}

const STEPS = [
  { label: "Personal", icon: User },
  { label: "Summary", icon: FileText },
  { label: "Experience", icon: Briefcase },
  { label: "Education", icon: GraduationCap },
  { label: "Skills", icon: Wrench },
  { label: "References", icon: Users },
];

const emptyWork: WorkEntry = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  current: false,
  bullets: [""],
};

const emptyEducation: EducationEntry = {
  institution: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
};

const emptySkillGroup: SkillGroup = { category: "", skills: "" };

const emptyReferee: RefereeEntry = {
  name: "",
  title: "",
  company: "",
  email: "",
  phone: "",
};

const initial: CvData = {
  fullName: "Josiah Mwangi",
  tagline: "Full-Stack Developer | React, Node.js & Cloud Infrastructure",
  email: "josiah.mwangi@example.com",
  phone: "+254 712 345 678",
  location: "Nairobi, Kenya",
  linkedin: "linkedin.com/in/josiah-mwangi",
  summary:
    "Results-driven full-stack developer with 6+ years of experience designing and delivering scalable web applications across fintech, e-commerce, and SaaS domains. Proficient in React, Next.js, Node.js, and cloud-native architectures on AWS and GCP. Known for translating complex business requirements into clean, maintainable code and mentoring junior engineers. Consistently improved system performance and reduced deployment cycles by adopting CI/CD best practices and infrastructure-as-code.",
  experience: [
    {
      company: "Safaricom PLC",
      role: "Senior Software Engineer",
      startDate: "2022-03",
      endDate: "",
      current: true,
      bullets: [
        "Architected and shipped a customer self-service portal serving 2M+ monthly active users, built with Next.js and GraphQL",
        "Reduced API response times by 45% by migrating legacy REST endpoints to optimised GraphQL resolvers with DataLoader batching",
        "Led a squad of 5 engineers through two major product launches, coordinating cross-team dependencies and sprint planning",
        "Implemented automated CI/CD pipelines with GitHub Actions and Docker, cutting release cycles from 2 weeks to same-day",
        "Established front-end testing standards achieving 85% code coverage using Jest and React Testing Library",
      ],
    },
    {
      company: "Andela",
      role: "Software Developer",
      startDate: "2019-06",
      endDate: "2022-02",
      current: false,
      bullets: [
        "Built and maintained microservices powering a talent-matching platform used by 500+ global companies",
        "Developed a real-time notifications system using WebSockets and Redis Pub/Sub, improving user engagement by 30%",
        "Collaborated with US-based product teams across time zones, delivering features on two-week agile sprints",
      ],
    },
    {
      company: "Freelance",
      role: "Web Developer",
      startDate: "2017-01",
      endDate: "2019-05",
      current: false,
      bullets: [
        "Delivered 15+ responsive websites for SMEs across East Africa using React, WordPress, and Tailwind CSS",
        "Integrated M-Pesa and Stripe payment gateways for e-commerce clients, processing KES 10M+ in transactions",
      ],
    },
  ],
  education: [
    {
      institution: "University of Nairobi",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: "2013-09",
      endDate: "2017-07",
    },
    {
      institution: "AWS",
      degree: "AWS Certified Solutions Architect",
      field: "Associate",
      startDate: "2021-04",
      endDate: "2024-04",
    },
  ],
  skillGroups: [
    { category: "Languages", skills: "JavaScript · TypeScript · Python · SQL · HTML · CSS" },
    { category: "Frameworks", skills: "React · Next.js · Node.js · Express · Tailwind CSS · NestJS" },
    { category: "Cloud & DevOps", skills: "AWS (EC2, Lambda, S3) · GCP · Docker · Kubernetes · GitHub Actions · Terraform" },
    { category: "Databases", skills: "PostgreSQL · MongoDB · Redis · DynamoDB" },
    { category: "Tools & Methods", skills: "Git · Jira · Figma · Agile/Scrum · TDD · CI/CD" },
  ],
  referees: [
    {
      name: "Dr. Amina Osei",
      title: "Engineering Director",
      company: "Safaricom PLC",
      email: "a.osei@safaricom.co.ke",
      phone: "+254 720 111 222",
    },
    {
      name: "James Kariuki",
      title: "Senior Technical Lead",
      company: "Andela",
      email: "j.kariuki@andela.com",
      phone: "+254 733 444 555",
    },
  ],
  referencesUponRequest: false,
};

export function CvBuilderForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CvData>(initial);
  const [template, setTemplate] = useState<Template>("classic");
  const [showTemplates, setShowTemplates] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof CvData>(key: K, value: CvData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function updateExperience(index: number, patch: Partial<WorkEntry>) {
    const next = data.experience.map((e, i) =>
      i === index ? { ...e, ...patch } : e
    );
    update("experience", next);
  }

  function updateEducation(index: number, patch: Partial<EducationEntry>) {
    const next = data.education.map((e, i) =>
      i === index ? { ...e, ...patch } : e
    );
    update("education", next);
  }

  function updateSkillGroup(index: number, patch: Partial<SkillGroup>) {
    const next = data.skillGroups.map((g, i) =>
      i === index ? { ...g, ...patch } : g
    );
    update("skillGroups", next);
  }

  function updateReferee(index: number, patch: Partial<RefereeEntry>) {
    const next = data.referees.map((r, i) =>
      i === index ? { ...r, ...patch } : r
    );
    update("referees", next);
  }

  function updateBullet(expIndex: number, bulletIndex: number, value: string) {
    const next = data.experience.map((e, i) => {
      if (i !== expIndex) return e;
      const bullets = e.bullets.map((b, j) => (j === bulletIndex ? value : b));
      return { ...e, bullets };
    });
    update("experience", next);
  }

  function addBullet(expIndex: number) {
    const next = data.experience.map((e, i) =>
      i === expIndex ? { ...e, bullets: [...e.bullets, ""] } : e
    );
    update("experience", next);
  }

  function removeBullet(expIndex: number, bulletIndex: number) {
    const next = data.experience.map((e, i) =>
      i === expIndex
        ? { ...e, bullets: e.bullets.filter((_, j) => j !== bulletIndex) }
        : e
    );
    update("experience", next);
  }

  function handlePrint() {
    const el = previewRef.current;
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;

    const printStyles: Record<Template, string> = {
      classic: `
body{font-family:'Palatino Linotype','Times New Roman',serif;font-size:10pt;color:#1a1a1a;padding:40px 56px;line-height:1.5}
h1{font-size:22pt;font-weight:700;margin-bottom:2px}
h2{font-size:10.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1.5px solid #1a1a1a;padding-bottom:3px;margin:16px 0 10px}
ul{list-style:disc;padding-left:18px;margin-top:3px}
li{margin-bottom:2px;font-size:9.5pt}
@media print{body{padding:0.5in 0.65in}@page{margin:0.5in 0.65in}}`,
      modern: `
body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:10pt;color:#2d2d2d;padding:0;line-height:1.5}
.modern-header{background:#1A5C3A;color:#fff;padding:32px 40px 24px}
.modern-header h1{color:#fff}
.modern-body{padding:24px 40px 40px}
h2{font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#1A5C3A;border-bottom:2px solid #1A5C3A;padding-bottom:4px;margin:20px 0 10px}
ul{list-style:none;padding-left:0;margin-top:3px}
li{margin-bottom:3px;font-size:9.5pt;padding-left:14px;position:relative}
li::before{content:'';position:absolute;left:0;top:7px;width:5px;height:5px;border-radius:50%;background:#1A5C3A}
@media print{.modern-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{padding:0}@page{margin:0}}`,
      executive: `
body{font-family:Georgia,'Times New Roman',serif;font-size:10pt;color:#1a1a1a;padding:0;line-height:1.5}
.exec-stripe{position:absolute;left:0;top:0;bottom:0;width:6px;background:#1B3A5C}
.exec-wrap{position:relative;padding:40px 48px 40px 54px}
h1{font-size:22pt;font-weight:700;color:#1B3A5C;margin-bottom:2px}
h2{font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#1B3A5C;border-bottom:2px solid #1B3A5C;padding-bottom:3px;margin:18px 0 10px}
ul{list-style:disc;padding-left:18px;margin-top:3px}
li{margin-bottom:2px;font-size:9.5pt}
@media print{.exec-stripe{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{padding:0}@page{margin:0}}`,
      minimal: `
body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:10pt;color:#333;padding:48px 56px;line-height:1.6}
h1{font-size:20pt;font-weight:400;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px}
h2{font-size:9pt;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#888;border-bottom:1px solid #ddd;padding-bottom:4px;margin:20px 0 10px}
ul{list-style:none;padding-left:0;margin-top:3px}
li{margin-bottom:3px;font-size:9.5pt;padding-left:12px;position:relative}
li::before{content:'–';position:absolute;left:0;color:#aaa}
@media print{body{padding:0.5in 0.65in}@page{margin:0.5in 0.65in}}`,
    };

    win.document.write(`<!DOCTYPE html><html><head><title>${data.fullName || "CV"}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}${printStyles[template]}</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  }

  const canGoNext = () => {
    if (step === 0) return data.fullName.trim() && data.email.trim();
    if (step === 1) return data.summary.trim();
    return true;
  };

  const hasContent =
    data.fullName ||
    data.summary ||
    data.experience.some((e) => e.company || e.role) ||
    data.education.some((e) => e.institution || e.degree) ||
    data.skillGroups.some((g) => g.category && g.skills);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel — Form */}
      <div className="w-full lg:w-1/2 overflow-y-auto border-r border-border bg-background">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand mb-2">
              CV Builder
            </p>
            <h1 className="font-heading text-2xl font-black tracking-tight leading-tight mb-2">
              Build your ATS-friendly CV
            </h1>
            <p className="text-sm text-text-secondary">
              Fill in each section — your CV updates live on the right.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-8 flex-wrap">
            {STEPS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => i <= step && setStep(i)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  i === step
                    ? "bg-brand text-white"
                    : i < step
                      ? "bg-brand-light text-brand cursor-pointer"
                      : "bg-card text-text-muted border border-border cursor-default"
                )}
              >
                <s.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Step content */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-6">
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Personal details
                </h2>
                <p className="text-sm text-text-secondary">
                  This information appears at the top of your CV.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">
                      Full name <span className="text-red-500">*</span>
                    </span>
                    <Input
                      value={data.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      placeholder="Josiah Mwangi"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Professional tagline</span>
                    <Input
                      value={data.tagline}
                      onChange={(e) => update("tagline", e.target.value)}
                      placeholder="Senior Software Engineer | Cloud & DevOps"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">
                      Email <span className="text-red-500">*</span>
                    </span>
                    <Input
                      type="email"
                      value={data.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="josiah@example.com"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Phone</span>
                    <Input
                      value={data.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="+254 700 000 000"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Location</span>
                    <Input
                      value={data.location}
                      onChange={(e) => update("location", e.target.value)}
                      placeholder="Nairobi, Kenya"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">LinkedIn URL</span>
                    <Input
                      value={data.linkedin}
                      onChange={(e) => update("linkedin", e.target.value)}
                      placeholder="linkedin.com/in/josiah-mwangi"
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Professional summary
                </h2>
                <p className="text-sm text-text-secondary">
                  Write 4–6 sentences highlighting your experience, key skills,
                  and career strengths. Include keywords from your target job
                  description for ATS optimisation.
                </p>
                <Textarea
                  value={data.summary}
                  onChange={(e) => update("summary", e.target.value)}
                  placeholder="Results-driven software engineer with 8+ years of experience building scalable web applications..."
                  className="min-h-[160px]"
                />
                <p className="text-xs text-text-muted">
                  Tip: Mention your years of experience, core domain, 2–3
                  signature skills, and the type of impact you deliver.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Professional experience
                </h2>
                <p className="text-sm text-text-secondary">
                  List roles in reverse chronological order. Use action verbs and
                  quantify outcomes.
                </p>

                {data.experience.map((exp, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-secondary">
                        Role {i + 1}
                      </span>
                      {data.experience.length > 1 && (
                        <button
                          onClick={() =>
                            update(
                              "experience",
                              data.experience.filter((_, j) => j !== i)
                            )
                          }
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Company</span>
                        <Input
                          value={exp.company}
                          onChange={(e) =>
                            updateExperience(i, { company: e.target.value })
                          }
                          placeholder="Acme Corp"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Job title</span>
                        <Input
                          value={exp.role}
                          onChange={(e) =>
                            updateExperience(i, { role: e.target.value })
                          }
                          placeholder="Senior Software Engineer"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Start date</span>
                        <Input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) =>
                            updateExperience(i, { startDate: e.target.value })
                          }
                        />
                      </label>
                      <div className="space-y-1.5">
                        <span className="text-sm font-medium">End date</span>
                        {exp.current ? (
                          <div className="h-8 flex items-center text-sm text-brand font-medium">
                            Present
                          </div>
                        ) : (
                          <Input
                            type="month"
                            value={exp.endDate}
                            onChange={(e) =>
                              updateExperience(i, { endDate: e.target.value })
                            }
                          />
                        )}
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) =>
                              updateExperience(i, {
                                current: e.target.checked,
                                endDate: "",
                              })
                            }
                            className="accent-brand"
                          />
                          I currently work here
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">
                        Key achievements / responsibilities
                      </span>
                      {exp.bullets.map((bullet, j) => (
                        <div key={j} className="flex gap-2">
                          <span className="mt-2 text-text-muted text-sm">
                            •
                          </span>
                          <Input
                            value={bullet}
                            onChange={(e) => updateBullet(i, j, e.target.value)}
                            placeholder="Led migration to microservices, reducing deploy time by 40%"
                            className="flex-1"
                          />
                          {exp.bullets.length > 1 && (
                            <button
                              onClick={() => removeBullet(i, j)}
                              className="text-red-400 hover:text-red-600 transition-colors mt-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addBullet(i)}
                        className="text-sm text-brand font-medium flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add bullet
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() =>
                    update("experience", [
                      ...data.experience,
                      { ...emptyWork, bullets: [""] },
                    ])
                  }
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full gap-2"
                  )}
                >
                  <Plus className="w-4 h-4" /> Add another role
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Education
                </h2>
                <p className="text-sm text-text-secondary">
                  Include degrees, diplomas, and relevant certifications.
                </p>

                {data.education.map((edu, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-secondary">
                        Qualification {i + 1}
                      </span>
                      {data.education.length > 1 && (
                        <button
                          onClick={() =>
                            update(
                              "education",
                              data.education.filter((_, j) => j !== i)
                            )
                          }
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Institution</span>
                        <Input
                          value={edu.institution}
                          onChange={(e) =>
                            updateEducation(i, { institution: e.target.value })
                          }
                          placeholder="University of Nairobi"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">
                          Degree / Certificate
                        </span>
                        <Input
                          value={edu.degree}
                          onChange={(e) =>
                            updateEducation(i, { degree: e.target.value })
                          }
                          placeholder="Bachelor of Science"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">
                          Field of study
                        </span>
                        <Input
                          value={edu.field}
                          onChange={(e) =>
                            updateEducation(i, { field: e.target.value })
                          }
                          placeholder="Computer Science"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium">Start</span>
                          <Input
                            type="month"
                            value={edu.startDate}
                            onChange={(e) =>
                              updateEducation(i, { startDate: e.target.value })
                            }
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium">End</span>
                          <Input
                            type="month"
                            value={edu.endDate}
                            onChange={(e) =>
                              updateEducation(i, { endDate: e.target.value })
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() =>
                    update("education", [
                      ...data.education,
                      { ...emptyEducation },
                    ])
                  }
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full gap-2"
                  )}
                >
                  <Plus className="w-4 h-4" /> Add another qualification
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Core skills
                </h2>
                <p className="text-sm text-text-secondary">
                  Group your skills into 4–6 categories. Separate individual
                  skills with a middle dot ( · ) for clean formatting. Use
                  keywords from your target job description for best ATS results.
                </p>

                {data.skillGroups.map((group, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="grid sm:grid-cols-[180px_1fr] gap-3 flex-1">
                      <Input
                        value={group.category}
                        onChange={(e) =>
                          updateSkillGroup(i, { category: e.target.value })
                        }
                        placeholder="Category (e.g. Languages)"
                      />
                      <Input
                        value={group.skills}
                        onChange={(e) =>
                          updateSkillGroup(i, { skills: e.target.value })
                        }
                        placeholder="JavaScript · TypeScript · Python · Go"
                      />
                    </div>
                    {data.skillGroups.length > 1 && (
                      <button
                        onClick={() =>
                          update(
                            "skillGroups",
                            data.skillGroups.filter((_, j) => j !== i)
                          )
                        }
                        className="text-red-400 hover:text-red-600 transition-colors mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() =>
                    update("skillGroups", [
                      ...data.skillGroups,
                      { ...emptySkillGroup },
                    ])
                  }
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full gap-2"
                  )}
                >
                  <Plus className="w-4 h-4" /> Add skill category
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  References
                </h2>
                <p className="text-sm text-text-secondary">
                  Add professional referees, or choose to display
                  &ldquo;References provided upon request&rdquo; instead.
                </p>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-background cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.referencesUponRequest}
                    onChange={(e) =>
                      update("referencesUponRequest", e.target.checked)
                    }
                    className="accent-brand w-4 h-4"
                  />
                  <span className="text-sm font-medium">
                    References provided upon request
                  </span>
                </label>

                {!data.referencesUponRequest && (
                  <>
                    {data.referees.map((ref, i) => (
                      <div
                        key={i}
                        className="border border-border rounded-xl p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-text-secondary">
                            Referee {i + 1}
                          </span>
                          {data.referees.length > 1 && (
                            <button
                              onClick={() =>
                                update(
                                  "referees",
                                  data.referees.filter((_, j) => j !== i)
                                )
                              }
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium">Full name</span>
                            <Input
                              value={ref.name}
                              onChange={(e) =>
                                updateReferee(i, { name: e.target.value })
                              }
                              placeholder="Dr. Amina Osei"
                            />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium">Job title</span>
                            <Input
                              value={ref.title}
                              onChange={(e) =>
                                updateReferee(i, { title: e.target.value })
                              }
                              placeholder="Engineering Director"
                            />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium">Company / Organisation</span>
                            <Input
                              value={ref.company}
                              onChange={(e) =>
                                updateReferee(i, { company: e.target.value })
                              }
                              placeholder="Safaricom PLC"
                            />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium">Email</span>
                            <Input
                              type="email"
                              value={ref.email}
                              onChange={(e) =>
                                updateReferee(i, { email: e.target.value })
                              }
                              placeholder="a.osei@safaricom.co.ke"
                            />
                          </label>
                          <label className="space-y-1.5 sm:col-span-2">
                            <span className="text-sm font-medium">Phone</span>
                            <Input
                              value={ref.phone}
                              onChange={(e) =>
                                updateReferee(i, { phone: e.target.value })
                              }
                              placeholder="+254 720 111 222"
                            />
                          </label>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() =>
                        update("referees", [
                          ...data.referees,
                          { ...emptyReferee },
                        ])
                      }
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full gap-2"
                      )}
                    >
                      <Plus className="w-4 h-4" /> Add another referee
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "gap-2",
                step === 0 && "invisible"
              )}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canGoNext()}
                className={cn(
                  buttonVariants(),
                  "bg-brand hover:bg-brand-mid text-white gap-2 disabled:opacity-40"
                )}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePrint}
                className={cn(
                  buttonVariants(),
                  "bg-brand hover:bg-brand-mid text-white gap-2"
                )}
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Template picker modal */}
      {showTemplates && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowTemplates(false)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[720px] mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Choose a template
                </h2>
                <p className="text-sm text-text-secondary">
                  Select a design that fits your style and industry.
                </p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-text-muted hover:text-foreground text-xl leading-none px-2"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTemplate(t.id);
                    setShowTemplates(false);
                  }}
                  className={cn(
                    "text-left rounded-xl border-2 overflow-hidden transition-all hover:shadow-md",
                    template === t.id
                      ? "border-brand shadow-[0_0_0_3px_var(--brand-light)]"
                      : "border-border hover:border-gray-300"
                  )}
                >
                  {/* Mini preview thumbnail */}
                  <div className="h-[140px] bg-white relative overflow-hidden">
                    <TemplateThumbnail id={t.id} accent={t.accent} />
                    {template === t.id && (
                      <div className="absolute top-2 right-2 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Active
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold mb-0.5">{t.name}</div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Right panel — Live preview */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-[#f0efe9] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card gap-3">
          <span className="text-sm font-semibold text-text-secondary flex-shrink-0">
            Live Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-8 text-xs gap-1.5"
              )}
            >
              <LayoutTemplate className="w-3.5 h-3.5" /> Choose Template
            </button>
            <button
              onClick={handlePrint}
              disabled={!hasContent}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-8 text-xs gap-1.5 disabled:opacity-40"
              )}
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div
            ref={previewRef}
            className="bg-white rounded-lg shadow-md mx-auto overflow-hidden"
            style={{ maxWidth: 680, minHeight: 900 }}
          >
            {!hasContent ? (
              <div className="flex flex-col items-center justify-center h-[600px] text-center text-text-muted p-12">
                <FileText className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">
                  Start filling in the form on the left.
                  <br />
                  Your CV will appear here in real time.
                </p>
              </div>
            ) : (
              <>
                {template === "classic" && <ClassicPreview data={data} />}
                {template === "modern" && <ModernPreview data={data} />}
                {template === "executive" && <ExecutivePreview data={data} />}
                {template === "minimal" && <MinimalPreview data={data} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month] = dateStr.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

/* ── Shared preview helpers ─────────────────────────────── */

function ExperienceEntries({ data }: { data: CvData }) {
  return (
    <>
      {data.experience
        .filter((e) => e.company || e.role)
        .map((exp, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 3,
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: "10pt" }}>
                  {exp.role}
                </span>
                {exp.company && (
                  <span style={{ fontSize: "9.5pt", color: "#555" }}>
                    {" "}— {exp.company}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: "8.5pt",
                  color: "#777",
                  whiteSpace: "nowrap",
                }}
              >
                {formatDate(exp.startDate)} –{" "}
                {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            {exp.bullets.some((b) => b.trim()) && (
              <ul style={{ marginTop: 3 }}>
                {exp.bullets
                  .filter((b) => b.trim())
                  .map((b, j) => (
                    <li
                      key={j}
                      style={{ marginBottom: 2, fontSize: "9.5pt" }}
                    >
                      {b}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        ))}
    </>
  );
}

function EducationEntries({ data }: { data: CvData }) {
  return (
    <>
      {data.education
        .filter((e) => e.institution || e.degree)
        .map((edu, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 3,
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: "10pt" }}>
                  {edu.degree}
                  {edu.field && ` in ${edu.field}`}
                </span>
                {edu.institution && (
                  <span style={{ fontSize: "9.5pt", color: "#555" }}>
                    {" "}— {edu.institution}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: "8.5pt",
                  color: "#777",
                  whiteSpace: "nowrap",
                }}
              >
                {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
              </span>
            </div>
          </div>
        ))}
    </>
  );
}

function SkillRows({ data }: { data: CvData }) {
  return (
    <div>
      {data.skillGroups
        .filter((g) => g.category && g.skills)
        .map((g, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 6,
              lineHeight: 1.5,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: "9.5pt",
                minWidth: 180,
                flexShrink: 0,
              }}
            >
              {g.category}
            </span>
            <span style={{ fontSize: "9.5pt" }}>{g.skills}</span>
          </div>
        ))}
    </div>
  );
}

function ReferencesBlock({ data }: { data: CvData }) {
  if (data.referencesUponRequest) {
    return (
      <p style={{ fontSize: "9.5pt", fontStyle: "italic", color: "#555" }}>
        References provided upon request.
      </p>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px 32px",
      }}
    >
      {data.referees
        .filter((r) => r.name)
        .map((ref, i) => (
          <div key={i}>
            <div style={{ fontWeight: 700, fontSize: "9.5pt" }}>
              {ref.name}
            </div>
            {(ref.title || ref.company) && (
              <div style={{ fontSize: "9pt", color: "#555" }}>
                {ref.title}
                {ref.title && ref.company && ", "}
                {ref.company}
              </div>
            )}
            {ref.email && (
              <div style={{ fontSize: "9pt", color: "#555" }}>{ref.email}</div>
            )}
            {ref.phone && (
              <div style={{ fontSize: "9pt", color: "#555" }}>{ref.phone}</div>
            )}
          </div>
        ))}
    </div>
  );
}

function hasRefs(data: CvData) {
  return data.referencesUponRequest || data.referees.some((r) => r.name);
}

/* ── Classic template ────────────────────────────────────── */

function ClassicSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "10.5pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        borderBottom: "1.5px solid #1a1a1a",
        paddingBottom: 3,
        margin: "16px 0 10px",
      }}
    >
      {children}
    </h2>
  );
}

function ClassicPreview({ data }: { data: CvData }) {
  return (
    <div
      style={{
        fontFamily: "'Palatino Linotype', 'Times New Roman', serif",
        padding: "40px 48px",
      }}
    >
      <h1 style={{ fontSize: "22pt", fontWeight: 700, marginBottom: 2, color: "#1a1a1a" }}>
        {data.fullName || "Your Name"}
      </h1>
      {data.tagline && (
        <div style={{ fontSize: "10pt", color: "#555", marginBottom: 6 }}>
          {data.tagline}
        </div>
      )}
      <div style={{ fontSize: "8.5pt", color: "#555", marginBottom: 18 }}>
        {[data.email, data.phone, data.location, data.linkedin]
          .filter(Boolean)
          .join("  |  ")}
      </div>

      {data.summary && (
        <>
          <ClassicSectionHeading>Professional Summary</ClassicSectionHeading>
          <p style={{ fontSize: "9.5pt", lineHeight: 1.6 }}>{data.summary}</p>
        </>
      )}

      {data.experience.some((e) => e.company || e.role) && (
        <>
          <ClassicSectionHeading>Professional Experience</ClassicSectionHeading>
          <ExperienceEntries data={data} />
        </>
      )}

      {data.education.some((e) => e.institution || e.degree) && (
        <>
          <ClassicSectionHeading>Education</ClassicSectionHeading>
          <EducationEntries data={data} />
        </>
      )}

      {data.skillGroups.some((g) => g.category && g.skills) && (
        <>
          <ClassicSectionHeading>Core Skills</ClassicSectionHeading>
          <SkillRows data={data} />
        </>
      )}

      {hasRefs(data) && (
        <>
          <ClassicSectionHeading>References</ClassicSectionHeading>
          <ReferencesBlock data={data} />
        </>
      )}
    </div>
  );
}

/* ── Modern template ─────────────────────────────────────── */

function ModernSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "10pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        color: "#1A5C3A",
        borderBottom: "2px solid #1A5C3A",
        paddingBottom: 4,
        margin: "20px 0 10px",
      }}
    >
      {children}
    </h2>
  );
}

function ModernPreview({ data }: { data: CvData }) {
  return (
    <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Colored header */}
      <div
        className="modern-header"
        style={{
          background: "#1A5C3A",
          color: "#fff",
          padding: "32px 40px 24px",
        }}
      >
        <h1 style={{ fontSize: "22pt", fontWeight: 700, marginBottom: 2, color: "#fff" }}>
          {data.fullName || "Your Name"}
        </h1>
        {data.tagline && (
          <div
            className="tagline"
            style={{
              fontSize: "10pt",
              color: "rgba(255,255,255,0.85)",
              marginBottom: 6,
            }}
          >
            {data.tagline}
          </div>
        )}
        <div
          className="contact"
          style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.7)" }}
        >
          {[data.email, data.phone, data.location, data.linkedin]
            .filter(Boolean)
            .join("  |  ")}
        </div>
      </div>

      {/* Body */}
      <div className="modern-body" style={{ padding: "24px 40px 40px" }}>
        {data.summary && (
          <>
            <ModernSectionHeading>Professional Summary</ModernSectionHeading>
            <p style={{ fontSize: "9.5pt", lineHeight: 1.65, color: "#2d2d2d" }}>
              {data.summary}
            </p>
          </>
        )}

        {data.experience.some((e) => e.company || e.role) && (
          <>
            <ModernSectionHeading>Professional Experience</ModernSectionHeading>
            <ExperienceEntries data={data} />
          </>
        )}

        {data.education.some((e) => e.institution || e.degree) && (
          <>
            <ModernSectionHeading>Education</ModernSectionHeading>
            <EducationEntries data={data} />
          </>
        )}

        {data.skillGroups.some((g) => g.category && g.skills) && (
          <>
            <ModernSectionHeading>Core Skills</ModernSectionHeading>
            <div>
              {data.skillGroups
                .filter((g) => g.category && g.skills)
                .map((g, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      marginBottom: 8,
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "9.5pt",
                        color: "#1A5C3A",
                        minWidth: 180,
                        flexShrink: 0,
                      }}
                    >
                      {g.category}
                    </span>
                    <span style={{ fontSize: "9.5pt", color: "#2d2d2d" }}>
                      {g.skills}
                    </span>
                  </div>
                ))}
            </div>
          </>
        )}

        {hasRefs(data) && (
          <>
            <ModernSectionHeading>References</ModernSectionHeading>
            <ReferencesBlock data={data} />
          </>
        )}
      </div>
    </div>
  );
}

/* ── Executive template ──────────────────────────────────── */

function ExecSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "10pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        color: "#1B3A5C",
        borderBottom: "2px solid #1B3A5C",
        paddingBottom: 3,
        margin: "18px 0 10px",
      }}
    >
      {children}
    </h2>
  );
}

function ExecutivePreview({ data }: { data: CvData }) {
  return (
    <div
      className="exec-wrap"
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        position: "relative",
        padding: "40px 48px 40px 54px",
      }}
    >
      <div
        className="exec-stripe"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: "#1B3A5C",
        }}
      />

      <h1 style={{ fontSize: "22pt", fontWeight: 700, marginBottom: 2, color: "#1B3A5C" }}>
        {data.fullName || "Your Name"}
      </h1>
      {data.tagline && (
        <div style={{ fontSize: "10pt", color: "#555", marginBottom: 6 }}>
          {data.tagline}
        </div>
      )}
      <div style={{ fontSize: "8.5pt", color: "#555", marginBottom: 18 }}>
        {[data.email, data.phone, data.location, data.linkedin]
          .filter(Boolean)
          .join("  |  ")}
      </div>

      {data.summary && (
        <>
          <ExecSectionHeading>Professional Summary</ExecSectionHeading>
          <p style={{ fontSize: "9.5pt", lineHeight: 1.6 }}>{data.summary}</p>
        </>
      )}

      {data.experience.some((e) => e.company || e.role) && (
        <>
          <ExecSectionHeading>Professional Experience</ExecSectionHeading>
          <ExperienceEntries data={data} />
        </>
      )}

      {data.education.some((e) => e.institution || e.degree) && (
        <>
          <ExecSectionHeading>Education</ExecSectionHeading>
          <EducationEntries data={data} />
        </>
      )}

      {data.skillGroups.some((g) => g.category && g.skills) && (
        <>
          <ExecSectionHeading>Core Skills</ExecSectionHeading>
          <SkillRows data={data} />
        </>
      )}

      {hasRefs(data) && (
        <>
          <ExecSectionHeading>References</ExecSectionHeading>
          <ReferencesBlock data={data} />
        </>
      )}
    </div>
  );
}

/* ── Minimal template ────────────────────────────────────── */

function MinimalSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "9pt",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "2px",
        color: "#888",
        borderBottom: "1px solid #ddd",
        paddingBottom: 4,
        margin: "20px 0 10px",
      }}
    >
      {children}
    </h2>
  );
}

function MinimalPreview({ data }: { data: CvData }) {
  return (
    <div
      style={{
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: "48px 56px",
        color: "#333",
      }}
    >
      <h1
        style={{
          fontSize: "20pt",
          fontWeight: 400,
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        {data.fullName || "Your Name"}
      </h1>
      {data.tagline && (
        <div style={{ fontSize: "10pt", color: "#888", marginBottom: 6 }}>
          {data.tagline}
        </div>
      )}
      <div style={{ fontSize: "8.5pt", color: "#999", marginBottom: 20 }}>
        {[data.email, data.phone, data.location, data.linkedin]
          .filter(Boolean)
          .join("  |  ")}
      </div>

      {data.summary && (
        <>
          <MinimalSectionHeading>Summary</MinimalSectionHeading>
          <p style={{ fontSize: "9.5pt", lineHeight: 1.7, color: "#444" }}>
            {data.summary}
          </p>
        </>
      )}

      {data.experience.some((e) => e.company || e.role) && (
        <>
          <MinimalSectionHeading>Experience</MinimalSectionHeading>
          <ExperienceEntries data={data} />
        </>
      )}

      {data.education.some((e) => e.institution || e.degree) && (
        <>
          <MinimalSectionHeading>Education</MinimalSectionHeading>
          <EducationEntries data={data} />
        </>
      )}

      {data.skillGroups.some((g) => g.category && g.skills) && (
        <>
          <MinimalSectionHeading>Skills</MinimalSectionHeading>
          <div>
            {data.skillGroups
              .filter((g) => g.category && g.skills)
              .map((g, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 6,
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "9pt",
                      color: "#888",
                      minWidth: 160,
                      flexShrink: 0,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {g.category}
                  </span>
                  <span style={{ fontSize: "9.5pt", color: "#444" }}>
                    {g.skills}
                  </span>
                </div>
              ))}
          </div>
        </>
      )}

      {hasRefs(data) && (
        <>
          <MinimalSectionHeading>References</MinimalSectionHeading>
          <ReferencesBlock data={data} />
        </>
      )}
    </div>
  );
}

/* ── Template thumbnails for the picker modal ────────────── */

function TemplateThumbnail({ id, accent }: { id: Template; accent: string }) {
  const lineW = ["60%", "90%", "75%", "85%", "50%"];

  if (id === "modern") {
    return (
      <div style={{ height: "100%" }}>
        <div style={{ background: accent, padding: "12px 16px 10px" }}>
          <div style={{ height: 8, width: "50%", background: "rgba(255,255,255,0.9)", borderRadius: 2, marginBottom: 4 }} />
          <div style={{ height: 4, width: "35%", background: "rgba(255,255,255,0.5)", borderRadius: 2, marginBottom: 3 }} />
          <div style={{ height: 3, width: "70%", background: "rgba(255,255,255,0.3)", borderRadius: 2 }} />
        </div>
        <div style={{ padding: "8px 16px" }}>
          <div style={{ height: 4, width: "30%", background: accent, borderRadius: 2, marginBottom: 6 }} />
          {lineW.map((w, i) => (
            <div key={i} style={{ height: 3, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 3 }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === "executive") {
    return (
      <div style={{ height: "100%", position: "relative", padding: "14px 16px 14px 22px" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
        <div style={{ height: 8, width: "50%", background: accent, borderRadius: 2, marginBottom: 4, opacity: 0.8 }} />
        <div style={{ height: 4, width: "35%", background: "#ccc", borderRadius: 2, marginBottom: 8 }} />
        <div style={{ height: 4, width: "25%", background: accent, borderRadius: 2, marginBottom: 5, opacity: 0.6 }} />
        {lineW.map((w, i) => (
          <div key={i} style={{ height: 3, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 3 }} />
        ))}
      </div>
    );
  }

  if (id === "minimal") {
    return (
      <div style={{ height: "100%", padding: "16px 16px" }}>
        <div style={{ height: 7, width: "45%", background: "#ccc", borderRadius: 2, marginBottom: 4 }} />
        <div style={{ height: 3, width: "30%", background: "#ddd", borderRadius: 2, marginBottom: 10 }} />
        <div style={{ height: 1, width: "100%", background: "#eee", marginBottom: 6 }} />
        {lineW.map((w, i) => (
          <div key={i} style={{ height: 3, width: w, background: "#ebebeb", borderRadius: 2, marginBottom: 3 }} />
        ))}
        <div style={{ height: 1, width: "100%", background: "#eee", marginTop: 4, marginBottom: 6 }} />
        {lineW.slice(0, 3).map((w, i) => (
          <div key={i} style={{ height: 3, width: w, background: "#ebebeb", borderRadius: 2, marginBottom: 3 }} />
        ))}
      </div>
    );
  }

  // classic
  return (
    <div style={{ height: "100%", padding: "14px 16px" }}>
      <div style={{ height: 8, width: "50%", background: accent, borderRadius: 2, marginBottom: 4 }} />
      <div style={{ height: 4, width: "35%", background: "#ccc", borderRadius: 2, marginBottom: 8 }} />
      <div style={{ height: 4, width: "25%", background: accent, borderRadius: 2, marginBottom: 2 }} />
      <div style={{ height: 1, width: "100%", background: accent, marginBottom: 5 }} />
      {lineW.map((w, i) => (
        <div key={i} style={{ height: 3, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 3 }} />
      ))}
      <div style={{ height: 4, width: "30%", background: accent, borderRadius: 2, marginTop: 4, marginBottom: 2 }} />
      <div style={{ height: 1, width: "100%", background: accent, marginBottom: 5 }} />
      {lineW.slice(0, 3).map((w, i) => (
        <div key={i} style={{ height: 3, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 3 }} />
      ))}
    </div>
  );
}
