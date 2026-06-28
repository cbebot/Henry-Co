import Link from "next/link";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { getDivisionConfig } from "@henryco/config";
import { GraduationCap, ArrowRight } from "lucide-react";

import { LEARN_HOME_HREF, getLearnQuickActions } from "../data";

/**
 * LearnEntryCard — the honest entry-point widget for Henry Onyx Academy.
 * Surfaces the division's real quick actions (browse / continue /
 * certificates), each deep-linking to the live `/learn` surface.
 */
export function LearnEntryCard() {
  const learn = getDivisionConfig("learn");
  const actions = getLearnQuickActions();

  return (
    <Panel tone="raised">
      <Section
        kicker={learn.shortName}
        headline="Keep learning"
        description="Explore the catalog, continue a course, and collect your certificates."
        action={
          <ActionButton
            href={LEARN_HOME_HREF}
            tone="primary"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open Academy
          </ActionButton>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: `1px solid var(${CSS_VARS.hairline})`,
                backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                color: `var(${CSS_VARS.ink})`,
                textDecoration: "none",
              }}
            >
              <span
                aria-hidden
                style={{
                  color: learn.accentText,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "0.5rem",
                  backgroundColor: `var(${CSS_VARS.accentSoft})`,
                  flexShrink: 0,
                }}
              >
                <GraduationCap size={16} />
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{action.label}</span>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: `var(${CSS_VARS.inkSoft})`,
                    lineHeight: 1.4,
                  }}
                >
                  {action.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Section>
    </Panel>
  );
}
