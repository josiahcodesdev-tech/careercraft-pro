import { createOgImage, ogImageSize, ogImageContentType } from "@/lib/og-image";

export const alt = "ATS-Friendly CV Builder — MyCareerCraft";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return createOgImage(
    "Build an ATS-Friendly CV",
    "Professional templates, AI-enhanced writing — KES 40"
  );
}
