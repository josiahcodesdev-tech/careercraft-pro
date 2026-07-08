import { createOgImage, ogImageSize, ogImageContentType } from "@/lib/og-image";

export const alt = "MyCareerCraft — Career Development & Professional Growth";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return createOgImage(
    "Land the job you actually want",
    "AI-personalised interview prep, ATS-ready CVs & career coaching"
  );
}
