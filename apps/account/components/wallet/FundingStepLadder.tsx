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

export function FundingStepLadder({ proofUploaded, proofUploadedAtIso, confirmed }: Props) {
  const steps: Step[] = [
    {
      title: "Transfer funds",
      desc: "Use the account details on this page to send your bank transfer.",
      state: proofUploaded || confirmed ? "done" : "active",
    },
    {
      title: "Upload proof",
      desc: proofUploaded
        ? proofUploadedAtIso
          ? `Uploaded ${new Date(proofUploadedAtIso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`
          : "Proof file is attached."
        : "Attach the receipt or PDF confirmation so finance can verify.",
      state: proofUploaded ? "done" : "active",
    },
    {
      title: "Finance review",
      desc: confirmed
        ? "Confirmed. Balance has moved into your available wallet."
        : "Our finance team confirms the bank reference matches.",
      state: confirmed ? "done" : proofUploaded ? "active" : "todo",
    },
  ];
  return (
    <div className="acct-wal__ladder" aria-label="Funding progress">
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
        Funding steps
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
