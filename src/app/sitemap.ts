import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { blogPosts } from "@/lib/blog-posts";

/**
 * `lastModified` is a claim about when the page's content last changed, and a
 * sitemap that stamps every page with the build time is making that claim
 * falsely for pages nobody has touched in months — at which point crawlers
 * stop believing any of it. So the date each page reports depends on how the
 * page actually changes:
 *
 * - Content pages carry an explicit date. They change rarely and deliberately;
 *   bump the date here in the same commit that changes the page.
 * - Tool pages take the build time. They are the product, they change with
 *   nearly every deploy, and a hand-kept date for them would be wrong within
 *   the week.
 * - Blog pages carry the dates the posts themselves declare.
 */
const CONTENT_UPDATED: Record<string, string> = {
  "": "2026-08-22",
  services: "2026-08-22",
  proposals: "2026-07-08",
  contact: "2026-07-08",
};

export default function sitemap(): MetadataRoute.Sitemap {
  const deployedAt = new Date();

  /** The newest post is what makes the blog index new. */
  const newestPost = blogPosts.reduce(
    (latest, post) => (post.updatedAt > latest ? post.updatedAt : latest),
    blogPosts[0]?.updatedAt ?? "2026-08-22"
  );

  const pages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(CONTENT_UPDATED[""]),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: new Date(CONTENT_UPDATED.services),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/interview-prep`,
      lastModified: deployedAt,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/cv-builder`,
      lastModified: deployedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/cv-transform`,
      lastModified: deployedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/proposals`,
      lastModified: new Date(CONTENT_UPDATED.proposals),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(CONTENT_UPDATED.contact),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(newestPost),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  return [
    ...pages,
    ...blogPosts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
