import { AlertTriangle } from "lucide-react";

/**
 * Inline validation message shown beneath a brief field. Rendered only when
 * a `message` is present, so callers can pass `errors[key]` unconditionally.
 *
 * The `field` value doubles as the scroll-target anchor: the builder jumps to
 * `[data-field="…"]` when a blocked Continue / Submit needs to surface the
 * first error. Colour uses the shared `--studio-warn` token (with the same
 * amber fallback the rest of the studio uses) and `role="alert"` so the
 * message is announced the moment it appears.
 */
export function FieldError({ field, message }: { field: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      data-field={field}
      role="alert"
      className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-snug text-[color:var(--studio-warn,_var(--home-accent-text))]"
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}
