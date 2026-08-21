export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  cta: { label: string; href: string };
  sections: BlogSection[];
  faq: { question: string; answer: string }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-create-an-ats-friendly-cv",
    title: "How to Create an ATS-Friendly CV That Gets Read",
    description: "Learn how to format, write, and tailor an ATS-friendly CV so recruitment software and hiring managers can understand your experience.",
    category: "CV Writing",
    publishedAt: "2026-08-22",
    updatedAt: "2026-08-22",
    readingTime: "7 min read",
    cta: { label: "Build an ATS-friendly CV", href: "/cv-builder" },
    sections: [
      { heading: "What makes a CV ATS-friendly?", paragraphs: ["An applicant tracking system scans a CV for readable structure, relevant skills, job titles, dates, and evidence that matches the vacancy. A strong ATS CV is not plain because design is forbidden; it is clear because important information is easy to identify.", "Your CV must also work for a human reader. Once the system processes it, a recruiter still needs to understand your value quickly."], bullets: ["Use familiar section names such as Work Experience, Education, and Skills.", "Keep dates and job titles consistent.", "Use keywords from the job description naturally and truthfully.", "Choose a simple layout with a clear reading order."] },
      { heading: "Write achievements, not job descriptions", paragraphs: ["Avoid filling each role with generic responsibilities. Explain what you improved, delivered, supported, saved, increased, or completed. Add numbers where they are accurate and useful."], bullets: ["Weak: Responsible for customer service.", "Stronger: Resolved 40+ customer enquiries each day while maintaining a 95% satisfaction score.", "Weak: Managed social media.", "Stronger: Planned a three-month content campaign that increased qualified enquiries by 28%."] },
      { heading: "Tailor every important application", paragraphs: ["A single generic CV rarely communicates an equally strong fit for every role. Compare the vacancy with your experience, identify its recurring skills and priorities, and bring the most relevant evidence closer to the top.", "Never add skills you do not possess. Tailoring means selecting and describing genuine experience in the language employers use." ] },
      { heading: "Final ATS CV checklist", paragraphs: ["Before submitting, check that the document can be copied as normal text, contact details are accurate, headings are descriptive, spelling is consistent, and the file name is professional."], bullets: ["One clear professional headline", "A concise, role-specific profile", "Reverse-chronological experience", "Relevant skills supported by evidence", "PDF or Word format when requested by the employer"] },
    ],
    faq: [
      { question: "Do ATS systems reject every CV with columns?", answer: "Not every system does, but complex columns, tables, and floating elements can create an unreliable reading order. A simple structure is the safer choice." },
      { question: "Should I repeat keywords many times?", answer: "No. Use relevant terms where they accurately describe your skills and results. Repetition without substance makes the CV weaker for human readers." },
    ],
  },
  {
    slug: "best-resume-maker-features",
    title: "What to Look for in the Best Resume Maker",
    description: "Compare the features that matter in a resume maker, from ATS-safe templates and tailored content to Word and PDF downloads.",
    category: "Resume Builder",
    publishedAt: "2026-08-22",
    updatedAt: "2026-08-22",
    readingTime: "6 min read",
    cta: { label: "Try our CV and resume builder", href: "/cv-builder" },
    sections: [
      { heading: "The best resume maker improves the content", paragraphs: ["A polished template cannot compensate for vague experience. A useful resume maker should help you create a focused summary, organise experience, and turn responsibilities into evidence-based achievements."], bullets: ["Guidance for every major section", "Suggestions that remain editable", "Support for role-specific tailoring", "Clear previews throughout the process"] },
      { heading: "ATS-safe templates matter", paragraphs: ["Good templates balance personality with predictable structure. Recruiters should be able to scan the page, and recruitment systems should be able to extract the same information."], bullets: ["Readable fonts and contrast", "Consistent headings and spacing", "No essential information trapped in images", "A sensible one- or two-page layout"] },
      { heading: "Check export quality and control", paragraphs: ["Before choosing a builder, confirm that it creates dependable PDF or Word files and lets you edit every claim. You should own the final wording and be able to update the document for future applications."] },
      { heading: "Choose for your market and career stage", paragraphs: ["A graduate, an experienced specialist, and an executive need different emphasis. In Kenya, employers may use CV and resume interchangeably, so the tool should support a professional document suitable for local and international applications."] },
    ],
    faq: [
      { question: "Is a CV builder better than writing from scratch?", answer: "A builder can make structure and formatting faster. The result is strongest when you still tailor the content and verify every detail." },
      { question: "Can I use the same resume for every job?", answer: "Keep a master resume, then create a focused version for each important role by prioritising the most relevant experience and skills." },
    ],
  },
  {
    slug: "how-to-prepare-for-a-job-interview",
    title: "How to Prepare for a Job Interview: A Practical Guide",
    description: "Prepare stronger interview answers, research the employer, practise common questions, and enter your next interview with confidence.",
    category: "Interview Preparation",
    publishedAt: "2026-08-22",
    updatedAt: "2026-08-22",
    readingTime: "8 min read",
    cta: { label: "Start personalised interview prep", href: "/interview-prep" },
    sections: [
      { heading: "Start with the role, not a list of questions", paragraphs: ["Read the job description closely and group its requirements into skills, outcomes, and behaviours. Your preparation should prove that you understand the work and can connect your experience to it."], bullets: ["Which problems will this person solve?", "Which skills appear more than once?", "What results would success produce?", "Which examples from your experience provide evidence?"] },
      { heading: "Build a bank of STAR examples", paragraphs: ["Prepare flexible stories using Situation, Task, Action, and Result. Focus most of the answer on what you personally did and what changed because of it."], bullets: ["A difficult problem you solved", "A conflict or disagreement you handled", "A time you improved a process", "A mistake and what you learned", "A result you are proud of"] },
      { heading: "Practise aloud", paragraphs: ["Thinking through an answer is different from delivering it. Say your answers aloud, record yourself, and listen for long introductions, unclear results, or repeated filler words. Aim for a natural explanation instead of memorising a script."] },
      { heading: "Prepare questions for the employer", paragraphs: ["Good questions demonstrate judgment and help you evaluate the opportunity. Ask about expectations, team priorities, challenges, feedback, and how performance will be measured."] },
    ],
    faq: [
      { question: "How long should an interview answer be?", answer: "Many answers work well in one to two minutes, but complexity varies. Be complete, relevant, and alert to the interviewer's cues." },
      { question: "How can I reduce interview anxiety?", answer: "Prepare evidence, practise under realistic conditions, confirm logistics early, and use a short breathing routine before the conversation." },
    ],
  },
  {
    slug: "career-growth-plan",
    title: "How to Build a Career Growth Plan You Can Actually Follow",
    description: "Create a practical career development plan with a clear direction, skill priorities, measurable actions, and regular reviews.",
    category: "Career Growth",
    publishedAt: "2026-08-22",
    updatedAt: "2026-08-22",
    readingTime: "7 min read",
    cta: { label: "Discuss your career direction", href: "/contact" },
    sections: [
      { heading: "Define progress for yourself", paragraphs: ["Career growth does not always mean a new title. It may mean higher income, deeper expertise, leadership, flexibility, meaningful work, or a transition into another field. Choose a direction that reflects your priorities." ] },
      { heading: "Assess your current position", paragraphs: ["Review your strongest evidence, gaps, interests, reputation, relationships, and constraints. Ask trusted colleagues which strengths they rely on and where they see room for growth."], bullets: ["Skills you can already demonstrate", "Skills required for the next step", "Projects that would create evidence", "People and communities that can support you"] },
      { heading: "Turn a goal into a 90-day plan", paragraphs: ["Long plans often become vague. Select one meaningful outcome for the next 90 days and define weekly actions. For example, complete a portfolio project, lead a measurable initiative, or conduct six conversations with people in a target field."] },
      { heading: "Make your progress visible", paragraphs: ["Keep a record of results, feedback, completed learning, and new responsibilities. This evidence supports performance conversations, applications, interviews, and salary negotiations."] },
    ],
    faq: [
      { question: "How often should I review my career plan?", answer: "Review actions monthly and direction every three to six months, or whenever your circumstances change significantly." },
      { question: "What if I do not know my ideal career?", answer: "Choose a useful next experiment rather than waiting for certainty. Small projects, conversations, and short courses can reveal what fits." },
    ],
  },
  {
    slug: "cv-writing-tips-for-kenya",
    title: "CV Writing Tips for Job Seekers in Kenya",
    description: "Write a clear professional CV for Kenyan and international employers, with practical guidance on structure, achievements, references, and tailoring.",
    category: "CV Writing",
    publishedAt: "2026-08-22",
    updatedAt: "2026-08-22",
    readingTime: "7 min read",
    cta: { label: "Create your professional CV", href: "/cv-builder" },
    sections: [
      { heading: "Lead with relevance", paragraphs: ["Recruiters need to identify your target role and strongest evidence quickly. Begin with accurate contact information, a focused professional headline, and a short profile aligned with the opportunity." ] },
      { heading: "Use a clear CV structure", paragraphs: ["For most professionals, reverse-chronological experience is the clearest format. Recent and relevant roles receive the most detail, while older or less relevant work can be shorter."], bullets: ["Contact details and professional headline", "Profile or summary", "Work experience and achievements", "Education and relevant certifications", "Technical and professional skills"] },
      { heading: "Handle personal details carefully", paragraphs: ["Do not include sensitive personal details merely because an old template requests them. Include information the employer genuinely needs, follow the application instructions, and protect unnecessary private data."] },
      { heading: "References and document length", paragraphs: ["Follow the employer's instructions about references. You can usually provide them later unless the application requests them. Keep the document concise enough to scan while retaining evidence relevant to the role." ] },
    ],
    faq: [
      { question: "Is a CV different from a resume in Kenya?", answer: "Employers often use the words interchangeably for a job-application document. Follow the vacancy's wording and prioritise relevant, concise evidence." },
      { question: "Should my Kenyan CV include a photo?", answer: "Usually a photo is unnecessary unless the employer or nature of the role specifically requires one. A skills-focused CV also reduces avoidable bias." },
    ],
  },
  {
    slug: "how-to-tailor-your-cv-to-a-job-description",
    title: "How to Tailor Your CV to a Job Description",
    description: "Use a job description to identify priority skills, select relevant achievements, and tailor your CV without keyword stuffing.",
    category: "Job Applications",
    publishedAt: "2026-08-22",
    updatedAt: "2026-08-22",
    readingTime: "6 min read",
    cta: { label: "Transform and tailor your CV", href: "/cv-transform" },
    sections: [
      { heading: "Identify the employer's priorities", paragraphs: ["Separate essential requirements from optional ones. Note repeated skills, the outcomes attached to the role, and the language used to describe the work." ] },
      { heading: "Match priorities to honest evidence", paragraphs: ["Create a simple list pairing each major requirement with an example from your employment, education, volunteering, or projects. If you cannot support a keyword with evidence, do not claim it." ] },
      { heading: "Rewrite the high-impact sections", paragraphs: ["Update the headline, profile, skills, and most relevant experience bullets. Move strong matching evidence into positions where a recruiter will see it quickly."], bullets: ["Mirror standard industry terminology where accurate.", "Describe actions and results instead of listing traits.", "Remove irrelevant detail that hides stronger evidence.", "Check that the final document still reads naturally."] },
      { heading: "Quality-check the tailored version", paragraphs: ["Confirm that the employer name and role are correct, dates remain consistent, claims are accurate, and the file name clearly identifies you and the position." ] },
    ],
    faq: [
      { question: "How much should I change for each application?", answer: "Focus on the profile, key skills, and relevant achievement bullets. The amount depends on how different the target role is from your master CV." },
      { question: "Is copying the job description good for ATS?", answer: "No. Use relevant terminology, but support it with your own evidence. Large copied passages are unhelpful and may appear dishonest." },
    ],
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
