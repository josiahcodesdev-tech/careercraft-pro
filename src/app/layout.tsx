import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ScrollToTop } from "@/components/scroll-to-top";
import { PublicLayoutWrapper } from "@/components/public-layout-wrapper";
import { JsonLd } from "@/components/json-ld";
import { SITE_URL } from "@/lib/site-config";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MyCareerCraft",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`,
  description:
    "MyCareerCraft helps professionals shape their careers through expert coaching, CV writing, interview preparation, and personal branding strategies.",
  areaServed: "KE",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    url: `${SITE_URL}/contact`,
  },
};

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const dmSans = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MyCareerCraft — Career Development & Professional Growth",
  description:
    "MyCareerCraft helps professionals shape their careers through expert coaching, CV writing, interview preparation, and personal branding strategies.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <body className="min-h-screen flex flex-col">
        <JsonLd data={organizationJsonLd} />
        <ScrollToTop />
        <PublicLayoutWrapper>{children}</PublicLayoutWrapper>
      </body>
    </html>
  );
}
