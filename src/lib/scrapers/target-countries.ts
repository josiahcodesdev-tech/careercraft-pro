// African nations where English is an official or primary working language —
// the pool of countries this feed's leads should come from. `iso3` is used
// for ReliefWeb's API country filter; `aliases` are used to text-match
// DevNetJobs' free-text location field (which has no structured country
// data, just a comma-separated string like "Nepal, Bangladesh, Pakistan").
export const TARGET_COUNTRIES: { name: string; iso3: string; aliases: string[] }[] = [
  { name: "Nigeria", iso3: "NGA", aliases: ["Nigeria"] },
  { name: "Ghana", iso3: "GHA", aliases: ["Ghana"] },
  { name: "Kenya", iso3: "KEN", aliases: ["Kenya"] },
  { name: "Uganda", iso3: "UGA", aliases: ["Uganda"] },
  { name: "Tanzania", iso3: "TZA", aliases: ["Tanzania"] },
  { name: "South Africa", iso3: "ZAF", aliases: ["South Africa"] },
  { name: "Zambia", iso3: "ZMB", aliases: ["Zambia"] },
  { name: "Zimbabwe", iso3: "ZWE", aliases: ["Zimbabwe"] },
  { name: "Malawi", iso3: "MWI", aliases: ["Malawi"] },
  { name: "Sierra Leone", iso3: "SLE", aliases: ["Sierra Leone"] },
  { name: "Liberia", iso3: "LBR", aliases: ["Liberia"] },
  { name: "Gambia", iso3: "GMB", aliases: ["Gambia"] },
  { name: "Botswana", iso3: "BWA", aliases: ["Botswana"] },
  { name: "Namibia", iso3: "NAM", aliases: ["Namibia"] },
  { name: "Lesotho", iso3: "LSO", aliases: ["Lesotho"] },
  { name: "Eswatini", iso3: "SWZ", aliases: ["Eswatini", "Swaziland"] },
  { name: "Rwanda", iso3: "RWA", aliases: ["Rwanda"] },
  { name: "South Sudan", iso3: "SSD", aliases: ["South Sudan"] },
  { name: "Cameroon", iso3: "CMR", aliases: ["Cameroon"] },
  { name: "Mauritius", iso3: "MUS", aliases: ["Mauritius"] },
  { name: "Seychelles", iso3: "SYC", aliases: ["Seychelles"] },
];

export const TARGET_COUNTRY_ISO3 = TARGET_COUNTRIES.map((c) => c.iso3);

export function matchesTargetCountry(text: string | undefined | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return TARGET_COUNTRIES.some((c) => c.aliases.some((alias) => lower.includes(alias.toLowerCase())));
}
