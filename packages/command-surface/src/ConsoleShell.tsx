import type { ReactNode } from "react";

function ConsoleBrand({ surfaceLabel }: { surfaceLabel: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="cc-display inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--cc-line-strong)] bg-[var(--cc-elevated)] text-[15px] font-semibold text-[var(--cc-gold-text)]">
        H<span className="px-px text-[var(--cc-faint)]">·</span>O
      </span>
      <div className="leading-tight">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--cc-muted)]">
          Henry Onyx
        </div>
        <div className="cc-display text-[15px] text-[var(--cc-ink)]">{surfaceLabel}</div>
      </div>
    </div>
  );
}

/**
 * The dense console chrome shared by both staged surfaces: a slim sticky bar
 * with the brand lockup + a staging marker + the session switcher, a compact
 * Fraunces hero, the dashboard body, and a footer that names the staging host
 * and the V3-COMMAND-03 boundary.
 */
export function ConsoleShell({
  surfaceLabel,
  title,
  descriptor,
  stagingHost,
  switcher,
  children,
}: {
  surfaceLabel: string;
  title: string;
  descriptor: string;
  stagingHost?: string;
  switcher?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="cc-canvas min-h-screen">
      <header
        className="sticky top-0 z-30 border-b border-[var(--cc-line)] backdrop-blur-md"
        style={{ backgroundColor: "color-mix(in oklab, var(--cc-bg) 82%, transparent)" }}
      >
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-5 py-3">
          <ConsoleBrand surfaceLabel={surfaceLabel} />
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[var(--cc-line-strong)] bg-[var(--cc-gold-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--cc-gold-text)] sm:inline">
              Staged · mock data
            </span>
            {switcher}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-5 py-7">
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cc-gold-text)]">
            V3-COMMAND-02 · Foundation (staged)
          </div>
          <h1 className="cc-display text-[30px] leading-[1.08] text-[var(--cc-ink)] sm:text-[36px]">
            {title}
          </h1>
          <p className="max-w-2xl text-[14px] leading-relaxed text-[var(--cc-muted)]">{descriptor}</p>
        </div>

        <div className="mt-7">{children}</div>

        <footer className="mt-12 border-t border-[var(--cc-line)] pt-5 text-[12px] leading-relaxed text-[var(--cc-faint)]">
          {stagingHost ? <span className="font-mono text-[var(--cc-muted)]">{stagingHost}</span> : null}
          {stagingHost ? " — " : ""}
          staged foundation against mocks. No live data, no cross-division wiring. Live wiring is
          V3-COMMAND-03 (gated on the finance spine + the real domain).
        </footer>
      </main>
    </div>
  );
}
