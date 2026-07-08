import { createOgImage, ogImageSize, ogImageContentType } from "@/lib/og-image";

export const alt = "Get in Touch — MyCareerCraft";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return createOgImage(
    "Let's Talk About Your Career",
    "Reach out via WhatsApp, email, or phone — we reply within hours"
  );
}
