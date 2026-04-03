import Link from "next/link";
import { getCompany } from "@henryco/brand";

const companyLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const legalLinks = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms & conditions", href: "/terms" },
];

export default function Footer() {
  const company = getCompany("hub") as
    | {
        parentBrand?: string;
        title?: string;
      }
    | undefined;

  const brandTitle = company?.parentBrand?.trim() || "Henry & Co.";
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="mt-20 border-t transition-colors duration-300"
      style={{
        borderColor: "var(--site-border)",
        background: "var(--site-footer-bg)",
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <div className="text-xl font-semibold text-[var(--site-text)]">
            {brandTitle}
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--site-text-soft)]">
            A premium multi-division corporate gateway designed to present the
            Henry &amp; Co. ecosystem with clarity, trust, and long-term brand
            discipline.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>
      </div>

      <div
        className="border-t px-4 py-5 text-center text-xs text-[var(--site-text-muted)] sm:px-6 lg:px-8"
        style={{ borderColor: "var(--site-border)" }}
      >
        © {currentYear} {brandTitle}. All rights reserved.
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-text-muted)]">
        {title}
      </div>
      <div className="mt-4 grid gap-2">
        {links.map((item) => (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            className="text-sm text-[var(--site-text-soft)] transition hover:text-[var(--site-text)]"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}