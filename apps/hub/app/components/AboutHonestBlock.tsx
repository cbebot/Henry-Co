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
 * are omitted (no "—" filler that reads as empty), and the note is a clean
 * editorial card with real links — the former dashed empty-avatar placeholder
 * is gone, in keeping with the "concrete divisions over team-photo grids"
 * direction (V3 PASS 21).
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
    <section className="mx-auto max-w-[88rem] px-5 py-14 sm:px-8 lg:px-10">
      <div className="grid gap-12 border-t border-white/10 pt-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[#d6a851]">
            {copy.eyebrow}
          </p>
          <h2 className="mt-4 max-w-2xl text-balance text-[1.55rem] font-semibold leading-[1.18] tracking-[-0.012em] text-white sm:text-[1.95rem]">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-2xl text-pretty text-[15px] leading-[1.75] text-white/74 sm:text-base">
            {copy.body}
          </p>

          {figures.length ? (
            <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {figures.map((figure) => (
                <div
                  key={figure.label}
                  className="border-t border-white/10 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:first:border-l-0 sm:first:pl-0"
                >
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/64">
                    {figure.label}
                  </dt>
                  <dd className="mt-2 text-[1.45rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.65rem]">
                    {figure.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        <aside className="lg:pt-2">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[#d6a851]">
              {copy.founderEyebrow}
            </p>
            <p className="mt-4 text-base font-semibold tracking-tight text-white">
              {copy.founderPlaceholderTitle}
            </p>
            <p className="mt-3 text-[13.5px] leading-7 text-white/72">
              {copy.founderPlaceholderBody}
            </p>
            <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {noteLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group flex items-center justify-between gap-3 py-3 text-sm font-medium text-white/82 transition hover:text-white"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-[#d6a851] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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
