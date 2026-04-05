import Link from "next/link";

type StaffSurfaceRetiredProps = {
  division: string;
  surfaceLabel?: string;
  title?: string;
  body?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function StaffSurfaceRetired({
  division,
  surfaceLabel = "Staff workspace retired",
  title,
  body,
  primaryHref = "/",
  primaryLabel = "Return to the public site",
  secondaryHref,
  secondaryLabel,
}: StaffSurfaceRetiredProps) {
  const headline =
    title || `${division} staff surfaces have been retired while the next premium workspace is rebuilt.`;
  const summary =
    body ||
    "The previous internal dashboard routes have been disabled to avoid stale tooling, broken flows, and fragmented staff experiences. Business data and protected backend logic remain in place for the clean rebuild.";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(208,178,98,0.18),transparent_32%),linear-gradient(180deg,#060814_0%,#0a0f1b_48%,#05070d_100%)] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-6 shadow-[0_30px_110px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="inline-flex items-center rounded-full border border-[rgba(210,180,111,0.28)] bg-[rgba(210,180,111,0.12)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgba(248,229,187,0.92)]">
            {surfaceLabel}
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
            {headline}
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
            {summary}
          </p>

          <div className="mt-8 grid gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-white/72 sm:grid-cols-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/44">
                Division
              </div>
              <div className="mt-2 text-base font-semibold text-white">{division}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/44">
                Route status
              </div>
              <div className="mt-2 text-base font-semibold text-white">Retired</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/44">
                Rebuild mode
              </div>
              <div className="mt-2 text-base font-semibold text-white">Premium workspace reset</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#f5e5b7_0%,#d0b262_52%,#9a7f34_100%)] px-5 py-3 text-sm font-semibold text-[#0b1119] shadow-[0_18px_44px_rgba(208,178,98,0.24)] transition hover:opacity-95"
            >
              {primaryLabel}
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white/88 transition hover:bg-white/[0.08]"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
