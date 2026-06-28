import Link from "next/link";

const serviceLinks = [
  { href: "/services", label: "Career assessment" },
  { href: "/services", label: "CV & resume writing" },
  { href: "/services", label: "Interview coaching" },
  { href: "/services", label: "Personal branding" },
];

const companyLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "w-4 h-4"} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "w-4 h-4"} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.7 16h4.3L8.3 4H4z" /><path d="M4 20l6.8-9.3" /><path d="M20 4l-6.8 9.3" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "w-4 h-4"} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const socialLinks = [
  { href: "#", label: "LinkedIn", icon: LinkedinIcon },
  { href: "#", label: "X", icon: XIcon },
  { href: "#", label: "Instagram", icon: InstagramIcon },
];

export function Footer() {
  return (
    <footer className="bg-brand-dark text-white/40">
      <div className="max-w-[1100px] mx-auto px-8 pt-12 pb-6">
        <div className="flex flex-wrap justify-between gap-8 mb-8">
          <div>
            <div className="font-heading text-lg font-extrabold text-white/70 mb-2">
              CareerCraft Pro
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
          <p className="text-xs">&copy; 2026 CareerCraft Pro. All rights reserved.</p>
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
