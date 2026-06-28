import { CheckCircle2 } from "lucide-react";
import type { StudioPayment } from "@/lib/studio/types";
import { getStudioProjectCopy } from "@henryco/i18n";
import { getStudioPublicLocale } from "@/lib/locale-server";

type Props = {
  unpaidPayments: StudioPayment[];
  payments: StudioPayment[];
  projectStatus: string;
};

export async function ProjectStatusRail({ unpaidPayments, payments, projectStatus }: Props) {
  const locale = await getStudioPublicLocale();
  const copy = getStudioProjectCopy(locale).statusRail;
  const openInvoice = unpaidPayments.filter((p) => p.status === "requested" || p.status === "overdue");
  const verifying = payments.some((p) => p.status === "processing");
  const anyPaid = payments.some((p) => p.status === "paid");

  const steps = [
    {
      title: copy.stepPaymentTitle,
      body:
        openInvoice.length > 0
          ? copy.stepPaymentBodyOpen
          : copy.stepPaymentBodyNone,
      emphasis: openInvoice.length > 0,
      complete: openInvoice.length === 0 && anyPaid,
    },
    {
      title: copy.stepVerificationTitle,
      body: verifying
        ? copy.stepVerificationBodyActive
        : copy.stepVerificationBodyIdle,
      emphasis: verifying,
      complete: !verifying && anyPaid && openInvoice.length === 0,
    },
    {
      title: copy.stepBuildTitle,
      body: copy.stepBuildBody,
      emphasis: anyPaid && !openInvoice.length && !verifying && ["active", "in_review"].includes(projectStatus),
      complete: projectStatus === "delivered",
    },
    {
      title: copy.stepLaunchTitle,
      body: copy.stepLaunchBody,
      emphasis: projectStatus === "in_review",
      complete: projectStatus === "delivered",
    },
  ];

  return (
    <aside className="space-y-4 lg:sticky lg:top-28">
      <div className="studio-panel rounded-[1.75rem] p-5">
        <div className="studio-kicker">{copy.progressKicker}</div>
        <p className="mt-3 text-xs leading-6 text-[var(--studio-ink-soft)]">
          {copy.progressIntro}
        </p>
        <ol className="mt-6 space-y-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className={`rounded-[1.35rem] border px-4 py-3 ${
                step.emphasis
                  ? "border-[rgba(151,244,243,0.38)] bg-[rgba(151,244,243,0.08)]"
                  : "border-[var(--studio-line)] bg-black/10"
              }`}
            >
              <div className="flex items-start gap-3">
                {step.complete ? (
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--studio-signal)]"
                    aria-hidden
                  />
                ) : (
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--studio-line)] text-[9px] font-semibold text-[var(--studio-ink-soft)]">
                    {i + 1}
                  </span>
                )}
                <div>
                  <div className="text-sm font-semibold text-[var(--studio-ink)]">{step.title}</div>
                  <p className="mt-1 text-xs leading-6 text-[var(--studio-ink-soft)]">{step.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
