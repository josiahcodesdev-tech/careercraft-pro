import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";

// Google Tag Manager container (used for Google Analytics). The ID is public.
const GTM_ID = "GTM-WN796MND";
import { ScrollToTop } from "@/components/scroll-to-top";
import { PublicLayoutWrapper } from "@/components/public-layout-wrapper";
import { JsonLd } from "@/components/json-ld";
import { SITE_URL } from "@/lib/site-config";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "ProfessionalService"],
  "@id": `${SITE_URL}/#organization`,
  name: "MyCareerCraft",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`,
  description:
    "MyCareerCraft helps professionals shape their careers through expert coaching, CV writing, interview preparation, and personal branding strategies.",
  telephone: "+254110242289",
  email: "josiahcodes.dev@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Nairobi",
    addressCountry: "KE",
  },
  areaServed: [
    { "@type": "Country", name: "Kenya" },
    { "@type": "AdministrativeArea", name: "Worldwide" },
  ],
  sameAs: ["https://wa.me/254110242289"],
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
  applicationName: "MyCareerCraft",
  authors: [{ name: "MyCareerCraft", url: SITE_URL }],
  creator: "MyCareerCraft",
  publisher: "MyCareerCraft",
  category: "career development",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title: "MyCareerCraft — Career Development & Professional Growth",
    description:
      "ATS-ready CV writing, personalised interview preparation, and career coaching for professionals in Kenya and beyond.",
    url: "/",
    siteName: "MyCareerCraft",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyCareerCraft — Career Development & Professional Growth",
    description:
      "ATS-ready CV writing, personalised interview preparation, and career coaching for professionals in Kenya and beyond.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <JsonLd data={organizationJsonLd} />
        <ScrollToTop />
        <PublicLayoutWrapper>{children}</PublicLayoutWrapper>
      </body>
    </html>
  );
}
