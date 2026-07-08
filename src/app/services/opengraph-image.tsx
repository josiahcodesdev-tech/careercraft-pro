import { createOgImage, ogImageSize, ogImageContentType } from "@/lib/og-image";

export const alt = "Our Services — MyCareerCraft";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return createOgImage(
    "Our Services",
    "Career assessment, CV writing, interview coaching & personal branding"
  );
}
