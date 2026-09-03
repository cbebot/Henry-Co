import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Building2, UserRound, Repeat } from "lucide-react";

import { BUSINESS_HOME_HREF, type BusinessSnapshot } from "../data";
import { roleLabel } from "../format";

/**
 * ActingContextCard — surfaces the viewer's current acting context
 * (`acting.kind`): acting as themselves ("Personal") or on behalf of a
 * business. Backed by the canonical `resolveActingContextForUser`
 * snapshot; the role, when acting as a business, is the server-re-derived
 * membership role — never read from the cookie. Deep-links to `/business`
 * where the context switcher lives.
 */
export function ActingContextCard({ snapshot }: { snapshot: BusinessSnapshot }) {
  const { acting } = snapshot;
  const isBusiness = acting.kind === "business";
  const headline = isBusiness ? acting.businessName ?? "Business" : "Personal";

  return (
    <Panel tone="raised">
      <Section
        kicker="Acting as"
        headline={headline}
        action={
          <ActionButton
            href={BUSINESS_HOME_HREF}
            tone="ghost"
            icon={<Repeat size={14} />}
            iconPosition="trailing"
          >
            Switch
          </ActionButton>
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span
            aria-hidden
            style={{
              color: `var(${CSS_VARS.accentText})`,
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
            {isBusiness ? <Building2 size={16} /> : <UserRound size={16} />}
          </span>
          <span
            style={{
              fontSize: "0.8125rem",
              color: `var(${CSS_VARS.inkSoft})`,
              lineHeight: 1.4,
            }}
          >
            {isBusiness
              ? `You're acting on behalf of this business${
                  acting.role ? ` as ${roleLabel(acting.role).toLowerCase()}` : ""
                }.`
              : "You're acting as yourself. Switch to a business to act on its behalf."}
          </span>
        </div>
      </Section>
    </Panel>
  );
}
