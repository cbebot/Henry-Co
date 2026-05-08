import {
  Panel,
  Section,
  ActionButton,
  EmptyState,
} from "@henryco/dashboard-shell/components";
import { CSS_VARS, typeStyle } from "@henryco/dashboard-shell/tokens";
import { LifeBuoy, Plus, MessageSquare } from "lucide-react";
import type { SupportSnapshot } from "../data";
import { statusLabel, divisionLabel, timeAgo } from "../format";

/**
 * OpenRequestsPanel — the support module's headline widget. Lists up
 * to 3 most recent active threads with status + division + last-activity
 * label. Includes embedded "New request" action. When there are no
 * active threads but the user has history, surfaces a "All caught up"
 * empty state with a quiet "View archive" link.
 */
export function OpenRequestsPanel({ snapshot }: { snapshot: SupportSnapshot }) {
  const { recentOpen, openCount, hasAnyHistory } = snapshot;

  if (recentOpen.length === 0) {
    return (
      <Panel tone="raised">
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          <p
            style={{
              ...typeStyle("kicker"),
              color: `var(${CSS_VARS.inkMuted})`,
              margin: 0,
            }}
          >
            Support requests
          </p>
          <span
            aria-hidden
            style={{ color: `var(${CSS_VARS.accentText})`, display: "inline-flex" }}
          >
            <LifeBuoy size={18} />
          </span>
        </header>
        <EmptyState
          kicker={hasAnyHistory ? "Inbox clear" : "We're here when you need us"}
          headline={hasAnyHistory ? "All caught up." : "No requests yet."}
          body={
            hasAnyHistory
              ? "Open a new request and our team replies within working hours."
              : "Open a request and our team will reply within working hours."
          }
          action={
            <ActionButton
              href="/support/new"
              tone="primary"
              icon={<Plus size={16} aria-hidden />}
            >
              Create request
            </ActionButton>
          }
          align="start"
        />
      </Panel>
    );
  }

  return (
    <Panel tone="raised">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          marginBottom: "0.25rem",
        }}
      >
        <div>
          <p
            style={{
              ...typeStyle("kicker"),
              color: `var(${CSS_VARS.inkMuted})`,
              margin: 0,
            }}
          >
            Support requests
          </p>
          <p
            style={{
              ...typeStyle("title"),
              color: `var(${CSS_VARS.ink})`,
              margin: "0.25rem 0 0",
            }}
          >
            {openCount} open
          </p>
        </div>
        <span
          aria-hidden
          style={{ color: `var(${CSS_VARS.accentText})`, display: "inline-flex" }}
        >
          <LifeBuoy size={18} />
        </span>
      </header>

      <Section>
        <ul
          style={{
            listStyle: "none",
            margin: "0.75rem 0 0",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {recentOpen.map((thread) => {
            const division = divisionLabel(thread.division);
            const meta = [
              statusLabel(thread.status),
              division,
              timeAgo(thread.updatedAt),
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={thread.id}>
                <a
                  href={`/support/${thread.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.5rem 0",
                    borderTop: `1px solid var(${CSS_VARS.hairline})`,
                    color: `var(${CSS_VARS.ink})`,
                    textDecoration: "none",
                  }}
                >
                  <MessageSquare
                    size={16}
                    aria-hidden
                    style={{ color: `var(${CSS_VARS.inkMuted})`, flexShrink: 0 }}
                  />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.125rem",
                    }}
                  >
                    <span
                      style={{
                        ...typeStyle("body"),
                        fontWeight: 600,
                        color: `var(${CSS_VARS.ink})`,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {thread.subject}
                    </span>
                    <span
                      style={{
                        ...typeStyle("small"),
                        color: `var(${CSS_VARS.inkSoft})`,
                      }}
                    >
                      {meta}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </Section>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginTop: "0.75rem",
        }}
      >
        <ActionButton
          href="/support/new"
          tone="primary"
          icon={<Plus size={16} aria-hidden />}
        >
          New request
        </ActionButton>
        <ActionButton href="/support" tone="secondary">
          View all
        </ActionButton>
      </div>
    </Panel>
  );
}
