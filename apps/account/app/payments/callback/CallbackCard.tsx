import type { ReactNode } from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

type Tone = "success" | "processing" | "error";

const TONE: Record<Tone, { Icon: typeof CheckCircle2; color: string }> = {
  success: { Icon: CheckCircle2, color: "var(--acct-green)" },
  processing: { Icon: Clock, color: "var(--acct-gold)" },
  error: { Icon: AlertCircle, color: "var(--acct-gold)" },
};

/**
 * Shared, provider-agnostic status card for the hosted-checkout return
 * (/payments/callback). Pure presentational (no hooks) so the server page can
 * render the error states and the client can render the live status with the
 * SAME structure — keeping layout stable (CLS≈0) as the status settles.
 */
export function CallbackCard({
  tone,
  eyebrow,
  title,
  body,
  children,
}: {
  tone: Tone;
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  const { Icon, color } = TONE[tone];
  return (
    <div className="acct-card overflow-hidden p-0">
      <div className="px-6 py-7 sm:px-8 sm:py-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg)]">
            <Icon size={24} style={{ color }} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em]" style={{ color }}>
              {eyebrow}
            </p>
            <h1 className="acct-display mt-2 text-2xl leading-tight text-[var(--acct-ink)]">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--acct-muted)]">{body}</p>
          </div>
        </div>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
}
