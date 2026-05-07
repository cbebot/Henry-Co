import type { ReactNode } from "react";

/**
 * WorkspaceSlot — the main content container of the unified shell.
 *
 * Renders its children inside a max-width-constrained, scroll-managed
 * region positioned to the right of the WorkspaceRail and below the
 * IdentityBar. DASH-1 ships this as a thin layout wrapper; DASH-2
 * onward composes module home widgets inside.
 *
 * The component is intentionally minimal — every layout / scroll /
 * inset concern handled here, content rendering left entirely to the
 * caller. This keeps the shell composable: a host app can wrap the
 * existing customer-overview content directly inside `<WorkspaceSlot>`
 * and gain the chrome positioning without changing the content.
 */
export type WorkspaceSlotProps = {
  children: ReactNode;
  /** Optional max-width override. Default: 80rem. */
  maxWidth?: string;
};

export function WorkspaceSlot({ children, maxWidth = "80rem" }: WorkspaceSlotProps) {
  return (
    <main
      style={{
        flex: 1,
        minWidth: 0,
        padding: "1.25rem 1rem 4rem",
      }}
    >
      <div
        style={{
          maxWidth,
          marginLeft: "auto",
          marginRight: "auto",
          width: "100%",
        }}
      >
        {children}
      </div>
    </main>
  );
}
