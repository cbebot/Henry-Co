import { CheckCircle2 } from "lucide-react";
import type { StudioPayment } from "@/lib/studio/types";

type Props = {
  unpaidPayments: StudioPayment[];
  payments: StudioPayment[];
  projectStatus: string;
};

export function ProjectStatusRail({ unpaidPayments, payments, projectStatus }: Props) {
  const openInvoice = unpaidPayments.filter((p) => p.status === "requested" || p.status === "overdue");
  const verifying = payments.some((p) => p.status === "processing");
  const anyPaid = payments.some((p) => p.status === "paid");

  const steps = [
    {
      title: "Payment",
      body:
        openInvoice.length > 0
          ? "Complete your transfer and upload proof to unlock scheduled work."
          : "No outstanding payments at this time.",
      emphasis: openInvoice.length > 0,
      complete: openInvoice.length === 0 && anyPaid,
    },
    {
      title: "Verification",
      body: verifying
        ? "Our finance team is reviewing your proof. This page updates automatically once confirmed."
        : "After you upload proof, our team verifies the transfer privately before confirming.",
      emphasis: verifying,
      complete: !verifying && anyPaid && openInvoice.length === 0,
    },
    {
      title: "Build & delivery",
      body: "Your team works through milestones, sharing updates and files directly in this workspace.",
      emphasis: anyPaid && !openInvoice.length && !verifying && ["active", "in_review"].includes(projectStatus),
      complete: projectStatus === "delivered",
    },
    {
      title: "Launch & handoff",
      body: "Final review, domain setup, and go-live — handled together, not rushed.",
      emphasis: projectStatus === "in_review",
      complete: projectStatus === "delivered",
    },
  ];

  return (
    <aside className="space-y-4 lg:sticky lg:top-28">
      <div className="studio-panel rounded-[1.75rem] p-5">
        <div className="studio-kicker">Project progress</div>
        <p className="mt-3 text-xs leading-6 text-[var(--studio-ink-soft)]">
          Your project follows a clear sequence: payment, verification, build, and launch. This panel tracks where you are.
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
