import Link from "next/link";

const serviceLinks = [
  { href: "/services", label: "Career assessment" },
  { href: "/services", label: "CV & cover letters" },
  { href: "/services", label: "Interview coaching" },
  { href: "/services", label: "Personal branding" },
  { href: "/services", label: "Career transition" },
  { href: "/services", label: "Proposal writing & grants" },
];

const companyLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "w-4 h-4"} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const socialLinks = [
  { href: "https://wa.me/254110242289", label: "WhatsApp", icon: WhatsAppIcon },
];

export function Footer() {
  return (
    <footer className="bg-brand-dark text-white/40">
      <div className="max-w-[1100px] mx-auto px-8 pt-12 pb-6">
        <div className="flex flex-wrap justify-between gap-8 mb-8">
          <div>
            <div className="font-heading text-lg font-extrabold text-white/70 mb-2">
              MyCareerCraft
            </div>
            <p className="text-sm text-white/35 max-w-[280px] leading-relaxed">
              Helping professionals discover their potential, sharpen their
              positioning, and build careers they&apos;re proud of.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
              Services
            </h5>
            <ul className="flex flex-col gap-1.5">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gold/80 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
              Company
            </h5>
            <ul className="flex flex-col gap-1.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gold/80 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-wrap justify-between items-center gap-4">
          <p className="text-xs">&copy; 2026 MyCareerCraft. All rights reserved.</p>
          <div className="flex gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="w-8 h-8 rounded-lg bg-white/6 flex items-center justify-center hover:bg-white/12 transition-colors"
              >
                <social.icon className="w-4 h-4 text-white/50" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
