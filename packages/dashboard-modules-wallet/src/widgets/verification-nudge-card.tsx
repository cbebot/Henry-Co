import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { ShieldCheck } from "lucide-react";

/**
 * VerificationNudgeCard — SMART (2026-07-10), trust-aware nudge.
 *
 * Rendered ONLY when the viewer is not identity-verified (real profile state,
 * read live). Withdrawals are KYC-gated; instead of letting the viewer hit
 * that wall at the withdrawal form, the wallet states the unlock step up
 * front — one calm card, one exact action, no manufactured urgency.
 */
export function VerificationNudgeCard() {
  return (
    <Panel tone="flat">
      <Section
        kicker="Withdrawals"
        headline="Verify to enable withdrawals"
        description="Payouts unlock once your identity is verified. It takes a few minutes and you only do it once."
        action={
          <ActionButton href="/security" tone="primary" icon={<ShieldCheck size={14} />}>
            Start verification
          </ActionButton>
        }
      >
        <span style={{ fontSize: "0.75rem", color: `var(${CSS_VARS.inkMuted})` }}>
          Your wallet, cards, and orders keep working while you verify.
        </span>
      </Section>
    </Panel>
  );
}
