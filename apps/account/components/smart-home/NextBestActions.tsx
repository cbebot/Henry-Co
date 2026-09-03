import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Panel, Section } from "@henryco/dashboard-shell";
import { CardTelemetry } from "@henryco/ui";
import type { NextBestAction } from "@/lib/smart-home/recommender";

/**
 * NextBestActions — server-rendered up to 3 ranked CTAs.
 *
 * Replaces the legacy "Smart Recommendations" gated panel that only
 * surfaced when `flags.intelligence_recommendations` was on. The
 * deterministic ranker runs unconditionally so the Smart Home is
 * never empty for an active user. When the flag is on, the caller
 * can SUPERSEDE the deterministic actions with a richer recommender
 * (V3 territory) — the contract here stays stable.
 *
 * Visual signature:
 *   - kicker (module/division name)
 *   - bold label
 *   - 1-line reason
 *   - trailing arrow
 *
 * No icons-as-decoration, no urgency theatre — confidence is encoded
 * as a subtle accent strip on the left edge for high-confidence
 * actions only.
 */
export type NextBestActionsProps = {
  actions: ReadonlyArray<NextBestAction>;
};

export function NextBestActions({ actions }: NextBestActionsProps) {
  if (actions.length === 0) return null;
  return (
    <Section
      kicker="Suggested"
      headline="Next-best actions"
      action={
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            color: "var(--hc-accent-text, #C9A227)",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          <Sparkles size={14} /> Live ranker
        </span>
      }
    >
      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(18rem, 1fr))",
        }}
      >
        {actions.slice(0, 3).map((action) => (
          // V3-11 (one-job-per-card): these are the canonical Class-A
          // "exact next step" cards. CardTelemetry is a zero-DOM
          // (display:contents) client wrapper — it fires
          // `henry.ui.card.rendered` on mount and `henry.ui.card.clicked`
          // on activation, so the owner card-clickthrough tile can rank
          // weak next steps empirically. It adds no markup, no copy, and
          // leaves the server-rendered Link/Panel untouched.
          <CardTelemetry
            key={action.id}
            cardId={`account.next-best.${action.id}`}
            classification="A"
            division={action.kicker}
            target={action.href}
          >
            <Panel tone="flat" padding="lg">
            <Link
              href={action.href}
              style={{
                display: "block",
                position: "relative",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              {action.confidence === "high" ? (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: -16,
                    top: 0,
                    bottom: 0,
                    width: "3px",
                    backgroundColor: "var(--hc-accent, #C9A227)",
                    borderRadius: "2px",
                  }}
                />
              ) : null}
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--acct-muted, #6B7280)",
                  margin: 0,
                }}
              >
                {action.kicker}
              </p>
              <p
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  marginTop: "0.4rem",
                  marginBottom: "0.35rem",
                  color: "var(--acct-ink, #0F172A)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                {action.label} <ArrowRight size={14} aria-hidden />
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--acct-muted, #6B7280)",
                  margin: 0,
                  maxWidth: "44ch",
                }}
              >
                {action.reason}
              </p>
              {action.confidence !== "low" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    marginTop: "0.6rem",
                    paddingInline: "0.5rem",
                    paddingBlock: "0.2rem",
                    borderRadius: "999px",
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    backgroundColor:
                      action.confidence === "high"
                        ? "var(--hc-accent-soft)"
                        : "color-mix(in srgb, var(--acct-muted) 12%, transparent)",
                    color:
                      action.confidence === "high"
                        ? "var(--hc-accent-text, #8C6B0F)"
                        : "var(--acct-muted, #6B7280)",
                  }}
                >
                  {action.confidence === "high" ? "High match" : "Likely useful"}
                </span>
              ) : null}
            </Link>
            </Panel>
          </CardTelemetry>
        ))}
      </div>
    </Section>
  );
}
