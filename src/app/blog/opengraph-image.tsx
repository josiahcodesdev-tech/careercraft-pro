import { createOgImage, ogImageSize, ogImageContentType } from "@/lib/og-image";

export const alt = "Career Advice — MyCareerCraft";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return createOgImage(
    "Career Advice",
    "Practical guidance on CVs, interviews and career growth in Kenya"
  );
}
