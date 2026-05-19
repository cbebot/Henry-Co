import Link from "next/link";
import { getDivisionConfig } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getStudioPublicLocale } from "@/lib/locale-server";

const studio = getDivisionConfig("studio");

export async function StudioSiteFooter({
  supportEmail,
  supportPhone,
  accountHref,
  loginHref,
}: {
  supportEmail: string | null;
  supportPhone: string | null;
  accountHref: string;
  loginHref: string;
}) {
  const locale = await getStudioPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const columns = [
    {
      title: t("Platform"),
      links: [
        { href: "/services", label: t("Services") },
        { href: "/pricing", label: t("Packages") },
        { href: "/work", label: t("Case studies") },
        { href: "/teams", label: t("Teams") },
      ],
    },
    {
      title: t("Buying flow"),
      links: [
        { href: "/request", label: t("Start a project") },
        { href: "/process", label: t("Process") },
        { href: "/trust", label: t("Trust") },
        { href: "/faq", label: t("FAQ") },
      ],
    },
    {
      title: t("Workspace"),
      links: [
        { href: accountHref, label: t("HenryCo account") },
        { href: loginHref, label: t("Shared sign in") },
        { href: "/contact", label: t("Contact") },
      ],
    },
  ];

  return (
    <footer className="mt-20 border-t border-[var(--studio-line)] bg-[linear-gradient(180deg,rgba(5,12,17,0.2),rgba(5,12,17,0.6))]">
      <div
        aria-hidden
        className="pointer-events-none mx-auto h-px max-w-[92rem] bg-gradient-to-r from-transparent via-[var(--studio-signal)]/40 to-transparent"
      />
      <div className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <div className="studio-kicker">{t(studio.name)}</div>
            <p className="max-w-md text-sm leading-7 text-[var(--studio-ink-soft)]">
              {t("Serious software, delivered with sharper process and cleaner handoff. Project history lives inside your HenryCo account from first brief to final launch.")}
            </p>
            <div className="space-y-1.5 text-sm text-[var(--studio-ink-soft)]">
              <p className="font-medium text-[var(--studio-ink)]">{supportEmail || studio.supportEmail}</p>
              <p>{supportPhone || studio.supportPhone}</p>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
                {column.title}
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {column.links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start gap-3 border-t border-[var(--studio-line)] pt-5 text-xs text-[var(--studio-ink-soft)]/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>&copy; {new Date().getFullYear()} {t(studio.name)}. {t("All rights reserved.")}</span>
            <Link href="/trust" className="transition hover:text-[var(--studio-ink)]">
              {t("Trust")}
            </Link>
            <Link href={loginHref} className="transition hover:text-[var(--studio-ink)]">
              {t("Sign in")}
            </Link>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--studio-signal)]" />
            {t("Designed and built in-house by HenryCo Studio for the HenryCo ecosystem")}
          </span>
        </div>
      </div>
    </footer>
  );
}
