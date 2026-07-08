import { createOgImage, ogImageSize, ogImageContentType } from "@/lib/og-image";

export const alt = "Interview Preparation — MyCareerCraft";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return createOgImage(
    "Ace Your Next Interview",
    "Personalised AI mock interviews with model answers — KES 100"
  );
}
