import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { Bookmark, Eye, ShoppingCart } from "lucide-react";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import type { CustomerOverviewSnapshot } from "../data";

/**
 * WelcomeBackWidget — V2-CART-01 surface promoted to the registered
 * customer-overview module. Shows three paths back into in-flight
 * work: saved items, recently viewed, cart recovery. The full
 * `WelcomeBackSurface` already lives at
 * `apps/account/components/saved-items/WelcomeBackSurface.tsx`; the
 * module-registered widget is a calmer entry-point card the home
 * grid renders as a wide-tile signal.
 */
export type WelcomeBackWidgetProps = {
  snapshot: CustomerOverviewSnapshot;
  /** When true, renders the cart-recovery row even with zero saved
   *  items (the cart_recovery surface fires on its own dedupe key). */
  hasCartRecovery?: boolean;
  /** First-name greeting; falls back to "Welcome back". */
  firstName?: string | null;
};

export function WelcomeBackWidget({
  snapshot,
  hasCartRecovery,
  firstName,
}: WelcomeBackWidgetProps) {
  const { savedItemsCount } = snapshot;
  const hint =
    savedItemsCount > 0
      ? `${savedItemsCount} saved item${savedItemsCount === 1 ? "" : "s"} waiting`
      : hasCartRecovery
        ? "Your cart is ready to resume"
        : "Pick up where you left off";

  const greeting = firstName ? `Welcome back, ${firstName}` : "Welcome back";

  return (
    <Panel tone="raised">
      <Section
        kicker="Pick up"
        headline={greeting}
        description={hint}
        action={
          <ActionButton href="/saved" tone="ghost" icon={<Bookmark size={14} />}>
            View saved
          </ActionButton>
        }
      >
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
          }}
        >
          <ResumeTile
            href="/saved"
            label="Saved for later"
            kicker={
              savedItemsCount > 0
                ? `${savedItemsCount} item${savedItemsCount === 1 ? "" : "s"}`
                : "Add items here"
            }
            icon={<Bookmark size={18} aria-hidden />}
          />
          <ResumeTile
            href="/marketplace/recently-viewed"
            label="Recently viewed"
            kicker="Keep browsing"
            icon={<Eye size={18} aria-hidden />}
          />
          {hasCartRecovery ? (
            <ResumeTile
              href="/marketplace"
              label="Resume cart"
              kicker="Picks up where you left off"
              icon={<ShoppingCart size={18} aria-hidden />}
            />
          ) : null}
        </div>
      </Section>
    </Panel>
  );
}

function ResumeTile({
  href,
  label,
  kicker,
  icon,
}: {
  href: string;
  label: string;
  kicker: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
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
          color: `var(${CSS_VARS.accentText})`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2rem",
          height: "2rem",
          borderRadius: "0.5rem",
          backgroundColor: `var(${CSS_VARS.accentSoft})`,
        }}
      >
        {icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{label}</span>
        <span
          style={{
            fontSize: "0.75rem",
            color: `var(${CSS_VARS.inkMuted})`,
          }}
        >
          {kicker}
        </span>
      </span>
    </a>
  );
}
