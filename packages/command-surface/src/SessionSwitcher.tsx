/**
 * A controlled segmented control used on staging to flip the mock viewer
 * (owner / staff / customer, or a staff member's division scope) so the access
 * boundary is demonstrable live. Presentational — the page owns the state.
 */
export function SessionSwitcher<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (key: T) => void;
  label?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      {label ? (
        <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-[var(--cc-muted)] md:inline">
          {label}
        </span>
      ) : null}
      <div className="inline-flex rounded-[var(--cc-radius-sm)] border border-[var(--cc-line-strong)] bg-[var(--cc-panel)] p-0.5">
        {options.map((option) => {
          const active = option.key === value;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              aria-pressed={active}
              className="rounded-[7px] px-2.5 py-1 text-[12px] font-semibold transition-colors hover:text-[var(--cc-ink-soft)]"
              style={
                active
                  ? { background: "var(--cc-elevated)", color: "var(--cc-gold-text)" }
                  : { color: "var(--cc-muted)" }
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
