import Link from "next/link";

/**
 * The readable half of /interview-prep.
 *
 * The tool above it renders as an app: a form, a preview pane, and almost no
 * prose — 147 words in total, which is nothing for a search engine to weigh on
 * a query as contested as interview preparation. This section is the page's
 * actual content, and it sits below the tool so it costs the working product
 * nothing.
 *
 * Everything here describes what the generator genuinely does. The FAQ answers
 * are duplicated into the page's FAQPage schema, so they have to stay in step:
 * Google requires the answer it shows to be visible on the page.
 */

export const INTERVIEW_PREP_FAQ = [
  {
    question: "How many interview questions do I get?",
    answer:
      "Thirty question-and-answer pairs, covering nine stages of a real interview: opening, experience and skills, behavioural, situational, leadership and teamwork, strengths, culture fit, role-specific, and salary expectations.",
  },
  {
    question: "Are the questions tailored to the job I applied for?",
    answer:
      "Yes. The questions are generated from the job description you paste in, and the model answers are written from the experience in your CV — naming the tools, employers and achievements you actually listed, rather than generic filler.",
  },
  {
    question: "What does interview preparation cost?",
    answer:
      "KES 100 for the full set of thirty questions and answers, downloadable as a PDF. You can read the opening questions free before you decide to pay.",
  },
  {
    question: "Can I use it for a management or supervisory role?",
    answer:
      "Yes. The generator reads the job description to judge whether the role manages people, and weights the situational and leadership questions accordingly — handling underperformance, supervising without micromanaging, keeping a team accountable.",
  },
  {
    question: "Do I need my CV to use it?",
    answer:
      "You need your qualifications and experience in some form — pasted as text or uploaded as a PDF or Word file. The more specific your experience, the more specific the model answers can be. If your CV needs work first, build one with the CV builder and come back.",
  },
  {
    question: "Should I memorise the answers?",
    answer:
      "No. Read them for structure and evidence, then say them in your own words. Memorised answers sound rehearsed to a panel, and an interviewer's follow-up question will find the seams. Use the answers to decide which examples to tell, not the exact sentences.",
  },
];

const SECTIONS = [
  { name: "Opening & About You", detail: "The walk-me-through-your-CV opening, where most interviews are won or lost." },
  { name: "Experience & Skills", detail: "Evidence that you have done the work the job description asks for." },
  { name: "Behavioural", detail: "Tell me about a time when — answered with real examples from your CV." },
  { name: "Situational", detail: "What you would do, judged against how the role actually operates." },
  { name: "Leadership & Teamwork", detail: "Weighted towards supervision and accountability when the role manages people." },
  { name: "Strengths & Self-Awareness", detail: "Including the weakness question, answered without damaging your case." },
  { name: "Culture Fit & Motivation", detail: "Why this employer, and why now." },
  { name: "Role-Specific & Future", detail: "The technical and forward-looking questions particular to the post." },
  { name: "Salary & Expectations", detail: "The question candidates most often answer badly, and the closing." },
];

export function InterviewPrepContent() {
  return (
    <section className="border-t border-border bg-background px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-[820px]">
        <h2 className="font-heading text-3xl font-black tracking-tight">
          Interview preparation built around your job description
        </h2>
        <p className="mt-5 leading-7 text-text-secondary">
          Generic interview question lists prepare you for a generic interview. The panel in
          front of you will ask about the role they advertised and the experience you claimed,
          so preparation works best when it starts from those two documents. Paste the job
          description, add your CV, and you get a full mock interview written for that
          specific pairing — thirty questions with model answers that draw on the tools,
          employers and results already in your own history.
        </p>

        <h2 className="mt-12 font-heading text-2xl font-black tracking-tight">How it works</h2>
        <ol className="mt-5 space-y-4">
          {[
            "Paste the job description, or upload the advert as a PDF, Word file or screenshot.",
            "Add your experience — paste it, or upload your CV and let it read your background.",
            "Read the opening questions free, then unlock the full set and download it as a PDF to revise from.",
          ].map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {i + 1}
              </span>
              <span className="leading-7 text-text-secondary">{step}</span>
            </li>
          ))}
        </ol>

        <h2 className="mt-12 font-heading text-2xl font-black tracking-tight">
          What the thirty questions cover
        </h2>
        <p className="mt-5 leading-7 text-text-secondary">
          The set follows the shape of a real interview from the first handshake to the salary
          conversation, so nothing catches you cold:
        </p>
        <div className="mt-6 space-y-3">
          {SECTIONS.map((section) => (
            <div key={section.name} className="rounded-xl border border-border bg-card p-4">
              <p className="font-bold text-foreground">{section.name}</p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">{section.detail}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 font-heading text-2xl font-black tracking-tight">
          Answer with structure, not with adjectives
        </h2>
        <p className="mt-5 leading-7 text-text-secondary">
          Panels score answers, and the difference between a five and a two is rarely
          confidence — it is evidence. A strong answer names the situation, the task you
          owned, the action you took and the result it produced, with a number attached
          wherever one honestly exists. &ldquo;I improved reporting&rdquo; is an opinion.
          &ldquo;I moved twelve weekly reports into one dashboard and cut the reporting cycle
          from three days to one&rdquo; is a fact a panel can score.
        </p>
        <p className="mt-4 leading-7 text-text-secondary">
          The model answers here are written to that standard, using your own examples. Read
          them for the structure, then rehearse aloud in your own words — an answer recited
          from memory sounds rehearsed, and the first follow-up question will expose it.
        </p>

        <h2 className="mt-12 font-heading text-2xl font-black tracking-tight">
          Preparing for interviews in Kenya
        </h2>
        <p className="mt-5 leading-7 text-text-secondary">
          Most shortlisted candidates here face a panel rather than a single interviewer, often
          with an HR representative, the hiring manager and a technical assessor in the room,
          each scoring against a rubric. Expect to be asked about your salary expectation
          directly, to account for any gaps in your dates, and — for NGO, county and donor-funded
          posts — to show that you understand reporting, compliance and the communities the
          programme serves. Prepare a figure and a reason for it before you walk in.
        </p>
        <p className="mt-4 leading-7 text-text-secondary">
          Preparation also starts before the interview: your CV is what got you into the room,
          and it is what the panel reads while you talk. If it needs work,{" "}
          <Link href="/cv-builder" className="font-semibold text-brand underline underline-offset-2">
            build an ATS-friendly CV
          </Link>{" "}
          or{" "}
          <Link href="/cv-transform" className="font-semibold text-brand underline underline-offset-2">
            reformat your existing one
          </Link>{" "}
          first, then come back and prepare for the interview it earns you. Our{" "}
          <Link
            href="/blog/how-to-prepare-for-a-job-interview"
            className="font-semibold text-brand underline underline-offset-2"
          >
            practical guide to interview preparation
          </Link>{" "}
          covers the groundwork in more detail.
        </p>

        <h2 id="faq" className="mt-12 font-heading text-2xl font-black tracking-tight">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-4">
          {INTERVIEW_PREP_FAQ.map((item) => (
            <details key={item.question} className="rounded-xl border border-border bg-card p-5">
              <summary className="cursor-pointer font-bold text-foreground">{item.question}</summary>
              <p className="mt-3 leading-7 text-text-secondary">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
