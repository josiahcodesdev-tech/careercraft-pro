import { SITE_URL } from "@/lib/site-config";

export function createServiceJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  price?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: opts.name,
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.url}`,
    provider: {
      "@type": "Organization",
      name: "MyCareerCraft",
      url: SITE_URL,
    },
    areaServed: "KE",
    ...(opts.price
      ? {
          offers: {
            "@type": "Offer",
            price: opts.price,
            priceCurrency: "KES",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}
