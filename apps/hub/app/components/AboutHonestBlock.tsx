import type { HubPublicCopy } from "@henryco/i18n";
import type { CompanySettingsRecord } from "../lib/company-settings-shared";
import type { DivisionRow } from "../lib/divisions";

type AboutFigure = {
  label: string;
  value: string;
};

function deriveCity(settings: CompanySettingsRecord): string | null {
  const raw =
    settings.office_address?.trim() ||
    settings.address?.trim() ||
    "";
  if (!raw) return null;
  // Take the first comma-separated segment as the city/region label.
  const first = raw.split(",")[0]?.trim();
  return first || null;
}

function deriveYearEstablished(
  settings: CompanySettingsRecord
): string | null {
  const created = settings.created_at?.trim() || "";
  if (!created) return null;
  const date = new Date(created);
  if (Number.isNaN(date.getTime())) return null;
  return String(date.getUTCFullYear());
}

/**
 * AboutHonestBlock — replaces the three near-identical CMS sections
 * ("What we are building / How the group is structured / What guides the
 * business") with a single editorial paragraph + a By the numbers strip
 * pulled from real config + a designed founder-note placeholder so the
 * shape is correct and ready for content. (CHROME-01B FIX 2.)
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
    {
      label: copy.figureDivisionsLive,
      value: liveCount > 0 ? String(liveCount) : "—",
    },
    {
      label: copy.figureYearEstablished,
      value: yearEstablished ?? "—",
    },
    {
      label: copy.figureOperatingCity,
      value: city ?? "—",
    },
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

          <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {figures.map((figure) => (
              <div
                key={figure.label}
                className="border-t border-white/10 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:first:border-l-0 sm:first:pl-0"
              >
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  {figure.label}
                </dt>
                <dd className="mt-2 text-[1.45rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.65rem]">
                  {figure.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="lg:pt-2">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[#d6a851]">
              {copy.founderEyebrow}
            </p>
            <div className="mt-5 flex items-start gap-5">
              <div
                aria-hidden
                className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-dashed border-white/15 bg-black/30 text-white/40"
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em]">
                  {copy.founderPhotoPlaceholder}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-white">
                  {copy.founderPlaceholderTitle}
                </p>
                <p className="mt-2 text-[13px] leading-7 text-white/62">
                  {copy.founderPlaceholderBody}
                </p>
              </div>
            </div>
            <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
              <li className="flex items-baseline gap-3 py-3 text-sm">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  {copy.linkReachCompany}
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                  /contact
                </span>
              </li>
              <li className="flex items-baseline gap-3 py-3 text-sm">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  {copy.linkBrowseDivisions}
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                  /#divisions
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
