import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Clock,
  FileCheck2,
  FileText,
  Mic2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { blogPosts } from "@/lib/blog-posts";
import { SITE_URL } from "@/lib/site-config";

const title = "Career Advice, CV & Interview Preparation Blog — MyCareerCraft";
const description = "Practical career advice for writing ATS-friendly CVs and resumes, preparing for interviews, applying for jobs, and building a stronger career.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/blog" },
  openGraph: { title, description, url: "/blog", siteName: "MyCareerCraft", locale: "en_KE", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": `${SITE_URL}/blog#blog`,
  name: "MyCareerCraft Career Advice",
  description,
  url: `${SITE_URL}/blog`,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en-KE",
  blogPost: blogPosts.map((post) => ({
    "@type": "BlogPosting",
    headline: post.title,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt,
  })),
};

export default function BlogPage() {
  const [featured, ...guides] = blogPosts;
  const cardStyles = [
    { icon: FileText, color: "bg-[#e8f1ec] text-brand" },
    { icon: Mic2, color: "bg-[#f8edd4] text-[#9b6a00]" },
    { icon: TrendingUp, color: "bg-[#e8eef7] text-[#355c91]" },
    { icon: BriefcaseBusiness, color: "bg-[#f3eaf4] text-[#78517b]" },
    { icon: FileCheck2, color: "bg-[#e9f2f0] text-[#27665a]" },
  ];

  return (
    <>
      <JsonLd data={blogJsonLd} />
      <section className="relative overflow-hidden border-b border-brand/10 bg-[#f5f3ee] px-5 py-16 sm:px-8 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 text-brand/10" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "26px 26px", maskImage: "linear-gradient(to right, #000, transparent 80%)" }} />
        <div className="relative mx-auto grid max-w-[1160px] items-end gap-10 lg:grid-cols-[1fr_340px]">
          <div className="max-w-[760px]">
            <span className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-brand"><BookOpen className="h-4 w-4" /> MyCareerCraft journal</span>
            <h1 className="font-heading text-[clamp(44px,6vw,76px)] font-black leading-[0.98] tracking-[-0.05em] text-[#101510]">Smarter moves for a stronger career.</h1>
            <p className="mt-6 max-w-[650px] text-lg leading-relaxed text-text-secondary sm:text-xl">Straightforward guidance for better CVs, confident interviews, stronger applications, and sustainable career growth.</p>
          </div>
          <div className="rounded-2xl border border-brand/10 bg-white/70 p-6 backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-gold">Explore by topic</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["CV writing", "Resume builder", "Interviews", "Career growth", "Job applications"].map((topic) => (
                <span key={topic} className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-secondary">{topic}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1160px]">
          <section aria-labelledby="featured-guide">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Editor&apos;s pick</p>
                <h2 id="featured-guide" className="mt-2 font-heading text-3xl font-black tracking-tight">Start here</h2>
              </div>
              <span className="hidden text-sm text-text-muted sm:block">Practical, jargon-free guidance</span>
            </div>
            <article className="group grid overflow-hidden rounded-3xl border border-border bg-white shadow-[0_12px_40px_rgba(25,50,35,0.06)] md:grid-cols-[0.82fr_1.18fr]">
              <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-brand-dark p-10 text-white">
                <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[38px] border-white/5" />
                <div aria-hidden className="absolute -bottom-20 -left-16 h-60 w-60 rounded-full bg-gold/10" />
                <div className="relative text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"><FileCheck2 className="h-8 w-8 text-gold" /></div>
                  <p className="mt-5 font-heading text-xl font-extrabold">CV essentials</p>
                  <p className="mt-1 text-sm text-white/55">Built for people and ATS software</p>
                </div>
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold"><span className="rounded-full bg-brand-light px-3 py-1 text-brand">{featured.category}</span><span className="flex items-center gap-1.5 text-text-muted"><Clock className="h-3.5 w-3.5" /> {featured.readingTime}</span></div>
                <h3 className="mt-5 font-heading text-[clamp(26px,3vw,38px)] font-black leading-tight tracking-tight"><Link href={`/blog/${featured.slug}`} className="transition-colors group-hover:text-brand">{featured.title}</Link></h3>
                <p className="mt-4 leading-relaxed text-text-secondary">{featured.description}</p>
                <Link href={`/blog/${featured.slug}`} className="mt-7 inline-flex items-center gap-2 text-sm font-black text-brand">Read the complete guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
              </div>
            </article>
          </section>

          <section className="mt-16 sm:mt-20" aria-labelledby="latest-guides">
            <div className="mb-7">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Learn and grow</p>
              <h2 id="latest-guides" className="mt-2 font-heading text-3xl font-black tracking-tight">More career guides</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {guides.map((post, index) => {
                const style = cardStyles[index];
                const Icon = style.icon;
                return (
                  <article key={post.slug} className="group flex min-h-[320px] flex-col rounded-2xl border border-border bg-white p-7 transition-all hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_14px_32px_rgba(25,50,35,0.08)]">
                    <div className="flex items-start justify-between gap-4"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.color}`}><Icon className="h-5 w-5" /></span><span className="flex items-center gap-1.5 pt-1 text-xs font-medium text-text-muted"><Clock className="h-3.5 w-3.5" /> {post.readingTime}</span></div>
                    <p className="mt-6 text-xs font-black uppercase tracking-[0.12em] text-brand">{post.category}</p>
                    <h3 className="mt-2 font-heading text-xl font-extrabold leading-snug tracking-tight"><Link href={`/blog/${post.slug}`} className="transition-colors group-hover:text-brand">{post.title}</Link></h3>
                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-text-secondary">{post.description}</p>
                    <Link href={`/blog/${post.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand">Read guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="relative mt-16 overflow-hidden rounded-3xl bg-brand-dark px-7 py-10 text-white sm:mt-20 sm:px-12 sm:py-12" aria-labelledby="career-cta">
            <Sparkles aria-hidden className="absolute right-8 top-8 h-24 w-24 text-white/[0.04]" />
            <div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
              <div className="max-w-[650px]"><p className="text-xs font-black uppercase tracking-[0.14em] text-gold">Ready to move forward?</p><h2 id="career-cta" className="mt-2 font-heading text-3xl font-black tracking-tight">Turn good advice into a stronger application.</h2><p className="mt-3 text-white/60">Build an ATS-ready CV or get personalised support for your next career move.</p></div>
              <Link href="/cv-builder" className="inline-flex flex-none items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-brand transition-transform hover:-translate-y-0.5">Build your CV <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
