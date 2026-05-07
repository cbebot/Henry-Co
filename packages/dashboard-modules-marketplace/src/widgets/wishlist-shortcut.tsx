import { Panel, Section, ActionButton, DivisionImage } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Bookmark, ArrowRight } from "lucide-react";
import { formatMoney } from "../format";
import type { MarketplaceSnapshot } from "../data";

/**
 * WishlistShortcut — surfaces the viewer's saved-for-later marketplace
 * items, deep-linked into `/marketplace/saved`. Consumes
 * `@henryco/cart-saved-items` types via the snapshot.
 *
 * The widget renders product imagery via DivisionImage so Cloudinary
 * URLs get auto-loader optimisation (closes anti-pattern #2).
 */
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
            href="/marketplace/saved"
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
              const href = (snapshot.href as string | undefined) ?? "/marketplace/saved";
              const image = (snapshot.image as string | undefined) ?? null;
              const title = (snapshot.title as string | undefined) ?? "Saved item";
              const price = snapshot.priceKobo as number | undefined;
              const currency = (snapshot.currency as string | undefined) ?? "NGN";

              return (
                <li key={item.id}>
                  <a
                    href={href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.5rem",
                      borderRadius: "0.75rem",
                      border: `1px solid var(${CSS_VARS.hairline})`,
                      backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                      color: `var(${CSS_VARS.ink})`,
                      textDecoration: "none",
                    }}
                  >
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
