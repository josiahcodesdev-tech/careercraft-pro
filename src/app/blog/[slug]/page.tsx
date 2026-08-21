import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { blogPosts, getBlogPost } from "@/lib/blog-posts";
import { SITE_URL } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return blogPosts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;
  return {
    title: `${post.title} — MyCareerCraft`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: { title: post.title, description: post.description, url, siteName: "MyCareerCraft", locale: "en_KE", type: "article", publishedTime: post.publishedAt, modifiedTime: post.updatedAt },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BlogPosting", "@id": `${url}#article`, headline: post.title, description: post.description, datePublished: post.publishedAt, dateModified: post.updatedAt, mainEntityOfPage: { "@type": "WebPage", "@id": url }, author: { "@id": `${SITE_URL}/#organization` }, publisher: { "@id": `${SITE_URL}/#organization` }, inLanguage: "en-KE", articleSection: post.category },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Career Advice", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ] },
      { "@type": "FAQPage", mainEntity: post.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    ],
  };

  const related = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <article>
        <header className="bg-[#f5f3ee] px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-[820px]">
            <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-brand"><ArrowLeft className="h-4 w-4" /> Career advice</Link>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold"><span className="rounded-full bg-brand-light px-3 py-1 text-brand">{post.category}</span><span className="flex items-center gap-1.5 text-text-muted"><Clock className="h-3.5 w-3.5" /> {post.readingTime}</span></div>
            <h1 className="font-heading text-[clamp(38px,5vw,62px)] font-black leading-[1.05] tracking-[-0.035em] text-[#101510]">{post.title}</h1>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">{post.description}</p>
            <p className="mt-5 text-sm text-text-muted"><time dateTime={post.publishedAt}>Published 22 August 2026</time> · MyCareerCraft</p>
          </div>
        </header>

        <div className="mx-auto max-w-[820px] px-5 py-14 sm:px-8 sm:py-20">
          <div className="space-y-12">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-heading text-2xl font-black tracking-tight text-foreground sm:text-3xl">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-[17px] leading-8 text-text-secondary">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
                {section.bullets && <ul className="mt-5 space-y-3">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-3 text-[16px] leading-7 text-text-secondary"><Check className="mt-1 h-5 w-5 flex-none text-brand" /> <span>{bullet}</span></li>)}</ul>}
              </section>
            ))}
          </div>

          <section className="mt-14 rounded-2xl bg-brand p-8 text-white sm:p-10" aria-labelledby="article-action">
            <h2 id="article-action" className="font-heading text-2xl font-black">Put this advice into action</h2>
            <p className="mt-2 text-white/70">Use MyCareerCraft&apos;s practical tools and expert support to take the next step.</p>
            <Link href={post.cta.href} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand">{post.cta.label} <ArrowRight className="h-4 w-4" /></Link>
          </section>

          <section className="mt-14" aria-labelledby="questions">
            <h2 id="questions" className="font-heading text-3xl font-black tracking-tight">Frequently asked questions</h2>
            <div className="mt-6 space-y-4">{post.faq.map((item) => <details key={item.question} className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer font-bold text-foreground">{item.question}</summary><p className="mt-3 leading-7 text-text-secondary">{item.answer}</p></details>)}</div>
          </section>

          <aside className="mt-14 border-t border-border pt-10" aria-labelledby="related-guides">
            <h2 id="related-guides" className="font-heading text-2xl font-black">More career guides</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">{related.map((item) => <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-xl border border-border p-5 font-bold leading-snug transition-colors hover:border-brand hover:text-brand">{item.title}</Link>)}</div>
          </aside>
        </div>
      </article>
    </>
  );
}
