import type { HubPublicCopy } from "@henryco/i18n";
import { ArrowUpRight } from "lucide-react";
import type { CompanySettingsRecord } from "../lib/company-settings-shared";
import type { DivisionRow } from "../lib/divisions";

type AboutFigure = {
  label: string;
  value: string;
};

function deriveCity(settings: CompanySettingsRecord): string | null {
  const raw = settings.office_address?.trim() || settings.address?.trim() || "";
  if (!raw) return null;
  // Take the first comma-separated segment as the city/region label.
  const first = raw.split(",")[0]?.trim();
  return first || null;
}

function deriveYearEstablished(settings: CompanySettingsRecord): string | null {
  const created = settings.created_at?.trim() || "";
  if (!created) return null;
  const date = new Date(created);
  if (Number.isNaN(date.getTime())) return null;
  return String(date.getUTCFullYear());
}

/**
 * AboutHonestBlock — a single editorial paragraph + a "By the numbers" ledger
 * computed from real config, plus a founder note. Figures with no real value
 * are omitted (no "—" filler that reads as empty). V3-PUBLIC-DESIGN-01 moved it
 * onto the theme-aware `--home-*` public design system so it matches the rest of
 * the now-light/dark hub (it previously hardcoded a permanent-dark palette).
 */
export default function AboutHonestBlock({
  settings,
  divisions,
  copy,
}: {
  settings: CompanySettingsRecord;
  divisions: DivisionRow[];
  copy: HubPublicCopy["aboutHonest"];
}) {
  const liveCount = divisions.filter((d) => d.status === "active").length;
  const yearEstablished = deriveYearEstablished(settings);
  const city = deriveCity(settings);

  const figures: AboutFigure[] = [
    { label: copy.figureDivisionsLive, value: liveCount > 0 ? String(liveCount) : null },
    { label: copy.figureYearEstablished, value: yearEstablished },
    { label: copy.figureOperatingCity, value: city },
  ].flatMap((figure) =>
    figure.value ? [{ label: figure.label, value: figure.value }] : [],
  );

  const noteLinks = [
    { label: copy.linkReachCompany, href: "/contact" },
    { label: copy.linkBrowseDivisions, href: "/#divisions" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:px-8">
      <div className="grid gap-12 border-t border-[color:var(--home-line)] pt-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="home-eyebrow text-[color:var(--home-accent-text)]">{copy.eyebrow}</p>
          <h2 className="home-headline mt-4 max-w-2xl text-balance">{copy.title}</h2>
          <p className="mt-5 max-w-2xl text-pretty text-[15px] leading-[1.75] text-[color:var(--home-ink-65)] sm:text-base">
            {copy.body}
          </p>

          {figures.length ? (
            <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {figures.map((figure) => (
                <div
                  key={figure.label}
                  className="border-t border-[color:var(--home-line)] pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:first:border-l-0 sm:first:pl-0"
                >
                  <dt className="home-eyebrow text-[color:var(--home-ink-50)]">{figure.label}</dt>
                  <dd className="mt-2 text-[1.45rem] font-semibold leading-tight tracking-tight text-[color:var(--home-ink)] sm:text-[1.65rem]">
                    {figure.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        <aside className="lg:pt-2">
          <div className="rounded-[1.6rem] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-6 sm:p-8">
            <p className="home-eyebrow text-[color:var(--home-accent-text)]">{copy.founderEyebrow}</p>
            <p className="mt-4 text-base font-semibold tracking-tight text-[color:var(--home-ink)]">
              {copy.founderPlaceholderTitle}
            </p>
            <p className="mt-3 text-[13.5px] leading-7 text-[color:var(--home-ink-65)]">
              {copy.founderPlaceholderBody}
            </p>
            <ul className="mt-6 divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)]">
              {noteLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="home-focus group flex items-center justify-between gap-3 py-3 text-sm font-medium text-[color:var(--home-ink-70)] transition hover:text-[color:var(--home-ink)]"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-[color:var(--home-accent-text)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
