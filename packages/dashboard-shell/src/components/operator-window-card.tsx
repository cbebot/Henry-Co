import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Panel } from "./panel";
import { Section } from "./section";
import { ActionButton } from "./action-button";
import { CSS_VARS } from "../tokens/color";

/**
 * OperatorWindowCard — the shared operator WINDOW (AWARE-SP4).
 *
 * The dashboard is the RECORD; the division workspace is the TOOL. Every
 * division's operator window (vendor, agent, instructor, studio team, …) is
 * the SAME shape: state the viewer's standing, and open the one next step —
 * the real division workspace — in one tap. Copy + icon + href are passed in
 * per division; the card owns none of it, so nothing is hardcoded and the
 * window reads identically everywhere.
 *
 * The CTA opens a cross-domain division route (`target=_blank`) because the
 * workspace is served by the division app, not the account shell.
 */
export function OperatorWindowCard({
  icon,
  kicker,
  headline,
  description,
  ctaLabel,
  ctaHref,
  footnote,
}: {
  icon: ReactNode;
  kicker: string;
  headline: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  footnote?: string;
}) {
  return (
    <Panel tone="raised">
      <Section
        kicker={kicker}
        headline={headline}
        description={description}
        action={
          <ActionButton href={ctaHref} target="_blank" tone="primary" icon={icon}>
            {ctaLabel}
          </ActionButton>
        }
      >
        {footnote ? (
          <span
            style={{
              fontSize: "0.75rem",
              color: `var(${CSS_VARS.inkMuted})`,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            {footnote}
            <ArrowRight size={13} aria-hidden />
          </span>
        ) : null}
      </Section>
    </Panel>
  );
}
