import { createOgImage, ogImageSize, ogImageContentType } from "@/lib/og-image";

export const alt = "Proposal Writing & Grants — MyCareerCraft";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return createOgImage(
    "Proposal & Grant Writing",
    "Professional grant and project proposals that win funding"
  );
}
