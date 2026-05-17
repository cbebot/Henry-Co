"use client";

/**
 * MetricTraceDrawer — V3 PASS 21 / H5.
 *
 * Click target attached to every MetricCard. Opens a focus-trapped
 * drawer that fetches the trace payload from
 * `/api/owner/reconcile-trace?id=<traceId>` and renders:
 *
 *   - The metric label
 *   - The underlying SQL query (with bound params substituted)
 *   - The first 25 rows of the live result set (or descriptor sample)
 *   - The execution timestamp
 *   - An optional caveat ("excludes refunded orders", "30-day window",
 *     etc.)
 *
 * Anti-pattern #18 — "bare metric" is forbidden. Every metric tile that
 * needs DASH-8 trust must declare a traceId so this drawer can answer
 * "where does this number come from?".
 */

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ExternalLink, Loader2, X } from "lucide-react";

type TracePayload = {
  id: string;
  label: string;
  sql: string;
  rows: Array<Record<string, unknown>>;
  executedAt: string;
  caveat?: string | null;
};

export type MetricTraceDrawerProps = {
  traceId: string;
  label: string;
  /** Optional title for the trigger button — defaults to "View trace". */
  triggerLabel?: string;
  className?: string;
};

export default function MetricTraceDrawer({
  traceId,
  label,
  triggerLabel = "View trace",
  className,
}: MetricTraceDrawerProps) {
  const [open, setOpen] = useState(false);
  const [trace, setTrace] = useState<TracePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dialogId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/owner/reconcile-trace?id=${encodeURIComponent(traceId)}`,
        { credentials: "same-origin" },
      );
      const body = (await res.json().catch(() => null)) as
        | { trace?: TracePayload; error?: string }
        | null;
      if (!res.ok || !body?.trace) {
        setError(body?.error ?? `Trace ${traceId} unavailable.`);
        setTrace(null);
      } else {
        setTrace(body.trace);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trace failed to load.");
    } finally {
      setLoading(false);
    }
  }, [traceId]);

  useEffect(() => {
    if (!open) return;
    void load();
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, load]);

  return (
    <Fragment>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--acct-muted)] transition-colors hover:text-[var(--owner-accent)]"
        }
        aria-haspopup="dialog"
        aria-controls={dialogId}
        title={`Open the trace drawer for ${label}`}
      >
        {triggerLabel}
        <ExternalLink className="h-3 w-3" aria-hidden />
      </button>
      {open ? (
        <div
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${dialogId}-title`}
          className="fixed inset-0 z-[60] flex justify-end bg-black/40 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="flex h-full w-full max-w-lg flex-col border-l border-[var(--acct-line)] bg-[var(--acct-bg)] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--acct-line)] px-5 py-4">
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--owner-accent)]">
                  Trace · {traceId}
                </p>
                <h2 id={`${dialogId}-title`} className="mt-1 text-base font-semibold text-[var(--acct-ink)]">
                  {label}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[var(--acct-line)] bg-[var(--acct-surface)] p-1.5 text-[var(--acct-muted)] hover:text-[var(--acct-ink)]"
                aria-label="Close trace drawer"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
              {loading ? (
                <div className="flex items-center gap-2 text-[var(--acct-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading trace…
                </div>
              ) : null}
              {error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-[var(--acct-red)]/30 bg-[var(--acct-red-soft)] px-3 py-2 text-xs text-[var(--acct-red)]"
                >
                  {error}
                </div>
              ) : null}
              {trace ? (
                <>
                  <section>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--acct-muted)]">
                      SQL filter
                    </p>
                    <pre className="mt-1 max-h-72 overflow-auto rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-3 text-[0.75rem] font-mono leading-relaxed text-[var(--acct-ink)] whitespace-pre-wrap break-words">
                      {trace.sql}
                    </pre>
                  </section>
                  <section>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--acct-muted)]">
                      Result sample
                    </p>
                    {trace.rows.length === 0 ? (
                      <p className="mt-1 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                        Trace returned no rows under the current filter.
                      </p>
                    ) : (
                      <ul className="mt-1 space-y-2">
                        {trace.rows.slice(0, 25).map((row, index) => (
                          <li
                            key={index}
                            className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-3 py-2 font-mono text-[0.7rem] text-[var(--acct-ink)]"
                          >
                            {JSON.stringify(row)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  <section className="text-xs text-[var(--acct-muted)]">
                    <p>
                      <span className="font-semibold text-[var(--acct-ink)]">Executed at:</span>{" "}
                      {new Date(trace.executedAt).toLocaleString()}
                    </p>
                    {trace.caveat ? (
                      <p className="mt-1">
                        <span className="font-semibold text-[var(--acct-ink)]">Caveat:</span> {trace.caveat}
                      </p>
                    ) : null}
                  </section>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </Fragment>
  );
}
