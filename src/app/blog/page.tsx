import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
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
  return (
    <>
      <JsonLd data={blogJsonLd} />
      <section className="bg-brand-dark px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[900px] text-center">
          <span className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gold"><BookOpen className="h-4 w-4" /> Career resources</span>
          <h1 className="font-heading text-[clamp(36px,5vw,64px)] font-black leading-tight tracking-tight">Practical advice for your next career move</h1>
          <p className="mx-auto mt-5 max-w-[680px] text-lg leading-relaxed text-white/65">Clear guidance on CV and resume writing, ATS optimisation, interview preparation, job applications, and long-term career growth.</p>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20" aria-labelledby="latest-guides">
        <div className="mx-auto max-w-[1100px]">
          <h2 id="latest-guides" className="mb-8 font-heading text-3xl font-black tracking-tight">Latest career guides</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <article key={post.slug} className="flex flex-col rounded-2xl border border-border bg-card p-7 transition-shadow hover:shadow-lg">
                <div className="mb-4 flex items-center justify-between gap-3 text-xs font-semibold">
                  <span className="rounded-full bg-brand-light px-3 py-1 text-brand">{post.category}</span>
                  <span className="flex items-center gap-1.5 text-text-muted"><Clock className="h-3.5 w-3.5" /> {post.readingTime}</span>
                </div>
                <h2 className="font-heading text-xl font-extrabold leading-snug tracking-tight"><Link href={`/blog/${post.slug}`} className="hover:text-brand">{post.title}</Link></h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">{post.description}</p>
                <Link href={`/blog/${post.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand">Read guide <ArrowRight className="h-4 w-4" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
