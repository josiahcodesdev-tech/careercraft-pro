import { createOgImage, ogImageSize, ogImageContentType } from "@/lib/og-image";

export const alt = "Transform Your CV to ATS — MyCareerCraft";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return createOgImage(
    "Transform Your CV to ATS Format",
    "Upload your CV and get it reformatted & tailored instantly — KES 50"
  );
}
