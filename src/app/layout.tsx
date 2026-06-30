import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ScrollToTop } from "@/components/scroll-to-top";
import { PublicLayoutWrapper } from "@/components/public-layout-wrapper";
import { ClientAuthProvider } from "@/lib/client-auth";

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
  title: "CareerCraft Pro — Career Development & Professional Growth",
  description:
    "CareerCraft Pro helps professionals shape their careers through expert coaching, CV writing, interview preparation, and personal branding strategies.",
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
        <ScrollToTop />
        <ClientAuthProvider>
          <PublicLayoutWrapper>{children}</PublicLayoutWrapper>
        </ClientAuthProvider>
      </body>
    </html>
  );
}
