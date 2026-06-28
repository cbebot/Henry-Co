import Link from "next/link";
import { Panel, Section, Chip, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Building2, Plus, ArrowRight } from "lucide-react";

import { BUSINESS_HOME_HREF, type BusinessSnapshot } from "../data";
import { roleLabel, statusChipTone, titleCaseStatus } from "../format";

/**
 * BusinessesCard — the viewer's verified company identities, each with
 * their role and the business's lifecycle/verification status. Rows
 * deep-link to the live `/business/<slug>` surface.
 *
 * Empty state: typographic minimalism (anti-pattern #16). A viewer with
 * no memberships sees an honest "create your company identity" entry
 * point — never a fabricated zero metric.
 */
export function BusinessesCard({ snapshot }: { snapshot: BusinessSnapshot }) {
  const { businesses, businessesCount } = snapshot;

  if (businessesCount === 0) {
    return (
      <Panel tone="flat">
        <Section
          kicker="Business"
          headline="Create your company identity"
          description="Stand up a verified business beside your personal account — add members, assign roles, and act on its behalf across Henry Onyx."
          action={
            <ActionButton href={BUSINESS_HOME_HREF} tone="primary" icon={<Plus size={14} />}>
              Create business
            </ActionButton>
          }
        >
          <p
            style={{
              fontSize: "0.8125rem",
              color: `var(${CSS_VARS.inkSoft})`,
              margin: 0,
            }}
          >
            You don&apos;t belong to any business yet.
          </p>
        </Section>
      </Panel>
    );
  }

  return (
    <Panel tone="raised">
      <Section
        kicker="Your businesses"
        headline={`${businessesCount} ${businessesCount === 1 ? "business" : "businesses"}`}
        action={
          <ActionButton
            href={BUSINESS_HOME_HREF}
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            View all
          </ActionButton>
        }
      >
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {businesses.slice(0, 3).map((business) => (
            <li key={business.id}>
              <Link
                href={`${BUSINESS_HOME_HREF}/${business.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  border: `1px solid var(${CSS_VARS.hairline})`,
                  backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                  color: `var(${CSS_VARS.ink})`,
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    minWidth: 0,
                  }}
                >
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
                    <Building2 size={16} />
                  </span>
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {business.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: `var(${CSS_VARS.inkMuted})`,
                      }}
                    >
                      {roleLabel(business.role)}
                    </span>
                  </span>
                </div>
                <Chip tone={statusChipTone(business.status)}>
                  {titleCaseStatus(business.status)}
                </Chip>
              </Link>
            </li>
          ))}
        </ol>
      </Section>
    </Panel>
  );
}
