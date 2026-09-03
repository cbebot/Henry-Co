import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/**
 * WidgetOpenOverlay — makes an entire home-widget card navigate to
 * `widget.href` ("clicking anywhere on the widget's chrome navigates
 * here", per the HomeWidget contract) WITHOUT nesting interactive
 * elements.
 *
 * The widget bodies (BalanceCard, RecentTransactionsCard, …) embed
 * their own <a>/<button> ActionButtons, so wrapping the card in a
 * <Link> would nest interactive elements — invalid HTML that throws a
 * hydration error. Instead this renders an absolutely-positioned anchor
 * stretched over the card. The host cell MUST be `position: relative`
 * and carry the `hc-widget-linkable` class; a scoped CSS rule
 * (see apps/account/app/globals.css) lifts the card's embedded controls
 * above this overlay (z-index 2 > 1) so they keep working, while taps on
 * the surrounding chrome fall through to this overlay and open the full
 * surface. Mirrors the MetricStrip ArrowUpRight affordance.
 *
 * Only render this when the widget actually declares an `href`.
 */
export function WidgetOpenOverlay({
  href,
  label,
}: {
  href: string;
  /** Accessible name for the link — typically the widget's title. */
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="hc-widget-open-overlay"
    >
      <ArrowUpRight
        size={14}
        aria-hidden
        className="hc-widget-open-overlay__hint"
      />
    </Link>
  );
}
