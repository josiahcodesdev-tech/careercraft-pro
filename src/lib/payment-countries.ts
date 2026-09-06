/**
 * Where we can take money, and what it costs there.
 *
 * PayHero collects across Africa from the same Kenyan account, so adding a
 * country is a matter of describing its money and its phone numbers rather
 * than integrating anything new. Prices are set per country in round local
 * numbers, not converted from KES at run time: a live FX rate would produce
 * amounts like "UGX 1,087", and mobile-money networks reject very small
 * amounts outright.
 *
 * `enabled` gates a country in the payment modal. Leave a country off until a
 * real payment has been put through it end to end — a country that takes a
 * customer's money and then fails to confirm is worse than one we don't offer.
 */

export type ProductId = "cv" | "interview";

export interface MobileNetwork {
  /** Shown to the payer. */
  label: string;
  /** Value sent to PayHero as `provider`. */
  provider: string;
  /** Local prefixes after the dial code, e.g. "77" for a Ugandan 077 number. */
  prefixes: string[];
}

export interface PaymentCountry {
  code: string;
  name: string;
  flag: string;
  /** International dial code, without the plus. */
  dialCode: string;
  currency: string;
  /** Digits expected after the dial code. */
  nationalDigits: number;
  networks: MobileNetwork[];
  prices: Record<ProductId, number>;
  /** Placeholder shown in the phone field. */
  hint: string;
  enabled: boolean;
  /** Shown under a country we cannot take money for yet. */
  note?: string;
}

export const PAYMENT_COUNTRIES: PaymentCountry[] = [
  {
    code: "KE",
    name: "Kenya",
    flag: "🇰🇪",
    dialCode: "254",
    currency: "KES",
    nationalDigits: 9,
    networks: [
      { label: "M-Pesa", provider: "m-pesa", prefixes: ["7", "1"] },
    ],
    prices: { cv: 40, interview: 100 },
    hint: "07XX XXX XXX",
    enabled: true,
  },
  {
    code: "UG",
    name: "Uganda",
    flag: "🇺🇬",
    dialCode: "256",
    currency: "UGX",
    nationalDigits: 9,
    networks: [
      { label: "MTN MoMo", provider: "mtn", prefixes: ["76", "77", "78", "79"] },
      { label: "Airtel Money", provider: "airtel", prefixes: ["70", "74", "75"] },
    ],
    // A local price point, not a conversion of the Kenyan one: UGX 3,000 is
    // roughly KES 110, and well clear of the networks' minimum collection.
    prices: { cv: 3000, interview: 6500 },
    hint: "07XX XXX XXX",
    enabled: false,
    note: "Coming soon",
  },
  {
    code: "TZ",
    name: "Tanzania",
    flag: "🇹🇿",
    dialCode: "255",
    currency: "TZS",
    nationalDigits: 9,
    networks: [
      { label: "M-Pesa", provider: "m-pesa", prefixes: ["74", "75", "76"] },
      { label: "Mixx by Yas", provider: "tigo", prefixes: ["65", "67", "71"] },
      { label: "Airtel Money", provider: "airtel", prefixes: ["68", "69", "78"] },
      { label: "Halopesa", provider: "halotel", prefixes: ["61", "62"] },
    ],
    // A local price point, not a conversion: TZS 3,000 is roughly KES 150.
    // Converting literally would give TZS 800, under the minimum most
    // Tanzanian networks will collect anyway.
    prices: { cv: 3000, interview: 6500 },
    hint: "07XX XXX XXX",
    enabled: false,
    note: "Coming soon",
  },
  {
    code: "SS",
    name: "South Sudan",
    flag: "🇸🇸",
    dialCode: "211",
    currency: "SSP",
    nationalDigits: 9,
    networks: [
      { label: "MTN MoMo", provider: "mtn", prefixes: ["92"] },
      { label: "m-Gurush", provider: "mgurush", prefixes: ["91", "97"] },
    ],
    // Left at zero deliberately: the South Sudanese pound moves too fast to
    // hard-code a price before we know which rail PayHero actually settles on
    // and in what currency.
    prices: { cv: 0, interview: 0 },
    hint: "09XX XXX XXX",
    enabled: false,
    note: "Not yet available",
  },
];

export const DEFAULT_COUNTRY = "KE";

export function findCountry(code: string | undefined): PaymentCountry | undefined {
  return PAYMENT_COUNTRIES.find((c) => c.code === (code ?? DEFAULT_COUNTRY));
}

export function enabledCountries(): PaymentCountry[] {
  return PAYMENT_COUNTRIES.filter((c) => c.enabled);
}

export function priceFor(country: PaymentCountry, product: ProductId): number {
  return country.prices[product];
}

/** "KES 40", "UGX 1,500" — grouped, since local prices run to thousands. */
export function formatPrice(country: PaymentCountry, product: ProductId): string {
  return `${country.currency} ${country.prices[product].toLocaleString("en-US")}`;
}

/**
 * Strip a local number down to dial code + national digits, accepting the
 * shapes people actually type: 0712…, +254712…, 254712…, 712….
 */
export function normalisePhone(raw: string, country: PaymentCountry): string {
  let phone = raw.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  if (phone.startsWith(country.dialCode)) phone = phone.slice(country.dialCode.length);
  if (phone.startsWith("0")) phone = phone.slice(1);
  return country.dialCode + phone;
}

/** The network a normalised number belongs to, or undefined if none matches. */
export function networkFor(phone: string, country: PaymentCountry): MobileNetwork | undefined {
  const national = phone.slice(country.dialCode.length);
  return country.networks.find((n) => n.prefixes.some((p) => national.startsWith(p)));
}

export function isValidPhone(phone: string, country: PaymentCountry): boolean {
  const national = phone.slice(country.dialCode.length);
  if (national.length !== country.nationalDigits) return false;
  if (!/^\d+$/.test(national)) return false;
  return networkFor(phone, country) !== undefined;
}
