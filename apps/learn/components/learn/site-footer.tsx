import Link from "next/link";
import { getDivisionConfig } from "@henryco/config";
import { getAccountLearnUrl } from "@/lib/learn/links";

const learn = getDivisionConfig("learn");

export function LearnSiteFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--learn-line)] bg-black/10">
      <div
        aria-hidden
        className="pointer-events-none mx-auto h-px max-w-[92rem] bg-gradient-to-r from-transparent via-[var(--learn-mint-soft)]/40 to-transparent"
      />
      <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.3fr_1fr_1fr_1fr] xl:px-10">
        <div className="space-y-5">
          <p className="learn-kicker">{learn.name}</p>
          <p className="max-w-md text-sm leading-7 text-[var(--learn-ink-soft)]">
            Practical courses, clear progress, verified certificates. Learn on your schedule and
            pick up where you left off in your HenryCo account.
          </p>
          <div className="space-y-1.5 text-sm text-[var(--learn-ink-soft)]">
            <p className="font-medium text-[var(--learn-ink)]">{learn.supportEmail}</p>
            <p>{learn.supportPhone}</p>
            <p className="text-[var(--learn-ink-soft)]/85">Mon–Fri, 9:00–18:00 WAT</p>
          </div>
        </div>

        <FooterColumn
          title="Explore"
          links={[
            { href: "/courses", label: "Courses" },
            { href: "/paths", label: "Paths" },
            { href: "/academy", label: "How it works" },
            { href: "/certifications", label: "Certificates" },
          ]}
        />
        <FooterColumn
          title="Engage"
          links={[
            { href: "/teach", label: "Teach with HenryCo" },
            { href: "/trust", label: "Trust" },
            { href: "/help", label: "Help" },
          ]}
        />
        <FooterColumn
          title="HenryCo"
          links={[
            { href: getAccountLearnUrl(), label: "HenryCo account — Learn", external: true },
          ]}
        />
      </div>

      <div className="border-t border-[var(--learn-line)] px-5 py-5 text-xs text-[var(--learn-ink-soft)] sm:px-8 xl:px-10">
        <div className="mx-auto flex max-w-[92rem] flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>© {new Date().getFullYear()} {learn.name}. All rights reserved.</span>
            <Link href="/trust" className="transition hover:text-[var(--learn-ink)]">
              Trust
            </Link>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--learn-mint-soft)]" />
            Designed and built in-house by HenryCo Studio for the HenryCo ecosystem
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string; external?: boolean }>;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
        {title}
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        {links.map((link) =>
          link.external ? (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--learn-ink)] transition hover:text-[var(--learn-mint-soft)]"
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="text-[var(--learn-ink)] transition hover:text-[var(--learn-mint-soft)]"
            >
              {link.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
