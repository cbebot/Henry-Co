import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import type { TrustPassport as JobsTrustPassport, TrustSignal } from "@/lib/jobs/types";
import { StatusPill } from "@/components/workspace-shell";

function toneForRiskBand(band: JobsTrustPassport["riskBand"]) {
  if (band === "low") return "good" as const;
  if (band === "moderate") return "warn" as const;
  return "danger" as const;
}

function toneLabel(signal: TrustSignal["tone"]) {
  if (signal === "good") return "good" as const;
  if (signal === "warn") return "warn" as const;
  if (signal === "danger") return "danger" as const;
  return "neutral" as const;
}

export function TrustPassportPanel({
  title,
  body,
  passport,
  limit = 5,
}: {
  title: string;
  body?: string;
  passport: JobsTrustPassport;
  limit?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[1.7rem] bg-[var(--jobs-paper-soft)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="jobs-kicker">{title}</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-4xl font-semibold tracking-tight">{passport.score}%</span>
              <StatusPill label={passport.label} tone={toneForRiskBand(passport.riskBand)} />
            </div>
            {body ? <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">{body}</p> : null}
          </div>
          <div className="rounded-[1.4rem] bg-white/80 p-4 text-[var(--jobs-accent)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-[var(--jobs-muted)]">{passport.summary}</p>
      </div>

      <div className="grid gap-3">
        {passport.signals.slice(0, limit).map((item) => (
          <div key={item.id} className="rounded-[1.45rem] bg-[var(--jobs-paper-soft)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--jobs-muted)]">{item.value}</div>
              </div>
              <StatusPill label={item.tone} tone={toneLabel(item.tone)} />
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">{item.detail}</p>
            <p className="mt-2 text-xs leading-6 text-[var(--jobs-muted)]">{item.ownerImpact}</p>
          </div>
        ))}
      </div>

      {passport.suspiciousFlags.length > 0 ? (
        <div className="rounded-[1.5rem] bg-[var(--jobs-danger-soft)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--jobs-danger)]">
            <AlertTriangle className="h-4 w-4" />
            Review flags
          </div>
          <div className="mt-3 space-y-2">
            {passport.suspiciousFlags.slice(0, 3).map((item) => (
              <p key={item} className="text-sm leading-7 text-[var(--jobs-ink)]">
                {item}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-[1.5rem] bg-[var(--jobs-paper-soft)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4 text-[var(--jobs-success)]" />
          What improves this trust lane
        </div>
        <div className="mt-3 space-y-2">
          {passport.nextSteps.map((item) => (
            <p key={item} className="text-sm leading-7 text-[var(--jobs-muted)]">
              {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
