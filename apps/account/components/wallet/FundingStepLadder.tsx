import { getAccountWalletExtraCopy } from "@henryco/i18n";
import { getAccountAppLocale } from "@/lib/locale-server";

type StepState = "todo" | "active" | "done";

type Step = {
  title: string;
  desc: string;
  state: StepState;
};

type Props = {
  proofUploaded: boolean;
  proofUploadedAtIso: string | null;
  confirmed: boolean;
};

export async function FundingStepLadder({ proofUploaded, proofUploadedAtIso, confirmed }: Props) {
  const locale = await getAccountAppLocale();
  const copy = getAccountWalletExtraCopy(locale).ladder;
  const steps: Step[] = [
    {
      title: copy.transferTitle,
      desc: copy.transferDesc,
      state: proofUploaded || confirmed ? "done" : "active",
    },
    {
      title: copy.uploadTitle,
      desc: proofUploaded
        ? proofUploadedAtIso
          ? copy.uploadedAt(new Date(proofUploadedAtIso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }))
          : copy.uploadDescAttached
        : copy.uploadDescDefault,
      state: proofUploaded ? "done" : "active",
    },
    {
      title: copy.reviewTitle,
      desc: confirmed
        ? copy.reviewDescConfirmed
        : copy.reviewDescPending,
      state: confirmed ? "done" : proofUploaded ? "active" : "todo",
    },
  ];
  return (
    <div className="acct-wal__ladder" aria-label={copy.ariaLabel}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--acct-muted)",
          margin: "0 0 4px",
        }}
      >
        {copy.kicker}
      </p>
      {steps.map((step, idx) => (
        <div className="acct-wal__step" key={step.title}>
          <div className="acct-wal__step-rail">
            <span className="acct-wal__step-bubble" data-state={step.state} aria-hidden>
              {idx + 1}
            </span>
          </div>
          <span className="acct-wal__step-title">{step.title}</span>
          <span className="acct-wal__step-desc">{step.desc}</span>
        </div>
      ))}
    </div>
  );
}
