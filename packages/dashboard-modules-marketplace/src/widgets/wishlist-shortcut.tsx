import Link from "next/link";
import { Panel, Section, ActionButton, DivisionImage } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Bookmark, ArrowRight } from "lucide-react";
import { getDivisionUrl } from "@henryco/config";
import { formatMoney } from "../format";
import type { MarketplaceSnapshot } from "../data";

/**
 * WishlistShortcut — surfaces the viewer's saved-for-later marketplace
 * items, deep-linked into `/saved-items` (the canonical cross-division
 * saved surface). Consumes `@henryco/cart-saved-items` types via the
 * snapshot.
 *
 * The widget renders product imagery via DivisionImage so Cloudinary
 * URLs get auto-loader optimisation (closes anti-pattern #2).
 *
 * PASS 22 issue #1+#2 — `/marketplace/saved` was a dead route on the
 * account shell. The "Open saved" CTA now points at `/saved-items` and
 * navigates via Next/Link (no full reload). Per-product hrefs that ship
 * inside the saved-item snapshot are resolved against the marketplace
 * subdomain so a relative path like `/products/abc` lands on the real
 * product page instead of 404'ing against the account shell.
 */
const MARKETPLACE_ORIGIN = getDivisionUrl("marketplace").replace(/\/$/, "");

function resolveItemHref(href: string | null | undefined): {
  href: string;
  external: boolean;
} {
  if (!href) return { href: "/saved-items", external: false };
  // Absolute URL — keep as-is; let the target site own the route.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(href)) {
    return { href, external: true };
  }
  // Hash / mailto / tel — leave alone.
  if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return { href, external: true };
  }
  // Relative path — assume the marketplace stored it. Resolve against the
  // marketplace origin so it works when rendered inside the account shell.
  return {
    href: `${MARKETPLACE_ORIGIN}${href.startsWith("/") ? href : `/${href}`}`,
    external: true,
  };
}
export function WishlistShortcut({
  snapshot,
}: {
  snapshot: MarketplaceSnapshot;
}) {
  const { savedItems, savedItemsCount } = snapshot;

  return (
    <Panel tone="raised">
      <Section
        kicker="Saved"
        headline={
          savedItemsCount > 0
            ? `${savedItemsCount} item${savedItemsCount === 1 ? "" : "s"} saved`
            : "Save items for later"
        }
        action={
          <ActionButton
            href="/saved-items"
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open saved
          </ActionButton>
        }
      >
        {savedItems.length === 0 ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: `var(${CSS_VARS.inkSoft})`,
              margin: 0,
            }}
          >
            Tap the bookmark on any product to keep it here for 90 days.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: "0.5rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
            }}
          >
            {savedItems.slice(0, 3).map((item) => {
              const snapshot = item.itemSnapshot;
              const resolved = resolveItemHref(snapshot.href as string | undefined);
              const image = (snapshot.image as string | undefined) ?? null;
              const title = (snapshot.title as string | undefined) ?? "Saved item";
              const price = snapshot.priceKobo as number | undefined;
              const currency = (snapshot.currency as string | undefined) ?? "NGN";
              const tileStyle = {
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem",
                borderRadius: "0.75rem",
                border: `1px solid var(${CSS_VARS.hairline})`,
                backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                color: `var(${CSS_VARS.ink})`,
                textDecoration: "none",
              } as const;
              const TileLink = resolved.external
                ? ({ children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
                    <a {...rest} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  )
                : ({ children, href, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
                    <Link href={href ?? "/saved-items"} {...rest}>
                      {children}
                    </Link>
                  );

              return (
                <li key={item.id}>
                  <TileLink href={resolved.href} style={tileStyle}>
                    {image ? (
                      <DivisionImage
                        src={image}
                        alt={title}
                        width={48}
                        height={48}
                        radius="0.5rem"
                      />
                    ) : (
                      <span
                        aria-hidden
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "0.5rem",
                          backgroundColor: `var(${CSS_VARS.accentSoft})`,
                          color: `var(${CSS_VARS.accentText})`,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Bookmark size={16} />
                      </span>
                    )}
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
                        {title}
                      </span>
                      {price != null ? (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: `var(${CSS_VARS.inkMuted})`,
                          }}
                        >
                          {formatMoney(price, currency)}
                        </span>
                      ) : null}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </Panel>
  );
}
