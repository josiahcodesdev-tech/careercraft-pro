import { createOgImage, ogImageSize, ogImageContentType } from "@/lib/og-image";
import { blogPosts, getBlogPost } from "@/lib/blog-posts";

export const alt = "MyCareerCraft career advice";
export const size = ogImageSize;
export const contentType = ogImageContentType;

// Built alongside the posts themselves rather than rendered per request — the
// posts are static, and a share card that has to be generated on demand is one
// the first person to share the link waits for.
export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  return createOgImage(
    post?.title ?? "Career advice",
    post ? `${post.category} · ${post.readingTime}` : "Practical guidance on CVs, interviews and career growth"
  );
}
