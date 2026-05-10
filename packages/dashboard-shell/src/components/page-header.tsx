import type { ReactNode } from "react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";

/**
 * PageHeader — kicker + title + optional description + optional action.
 *
 * Visual signature matches V5-CLEAR's apps/account/components/layout/PageHeader.tsx
 * pattern (from `apps/account/app/(account)/page.tsx:158-161` usage),
 * but now lives at the shell level so every module surface uses the
 * same heading geometry.
 *
 * Anti-pattern #20 (copy not in HenryCo voice): the PageHeader passes
 * copy through unchanged — voice is the caller's responsibility. This
 * component just ensures the visual signature.
 */
export type PageHeaderProps = {
  /** All-caps eyebrow above the title. */
  kicker?: string;
  /** Page title — rendered as `<h1>`. */
  title: string;
  /** Optional one-line description. */
  description?: string;
  /** Optional trailing action (e.g. "Edit", "Refresh"). */
  action?: ReactNode;
};

export function PageHeader({ kicker, title, description, action }: PageHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <div>
        {kicker ? (
          <p
            style={{
              ...typeStyle("kicker"),
              color: `var(${CSS_VARS.accentText})`,
              marginBottom: "0.5rem",
            }}
          >
            {kicker}
          </p>
        ) : null}
        <h1
          style={{
            ...typeStyle("h1"),
            color: `var(${CSS_VARS.textPrimary})`,
            margin: 0,
          }}
        >
          {title}
        </h1>
        {description ? (
          <p
            style={{
              ...typeStyle("bodyLg"),
              color: `var(${CSS_VARS.textSecondary})`,
              marginTop: "0.625rem",
              maxWidth: "65ch",
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
