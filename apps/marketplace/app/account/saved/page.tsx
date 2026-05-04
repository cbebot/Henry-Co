import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookmarkPlus, ShoppingBag } from "lucide-react";
import {
  listSavedItems,
  removeSavedItem,
  restoreSavedItem,
} from "@henryco/cart-saved-items/server";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { getMarketplaceViewer, requireMarketplaceUser } from "@/lib/marketplace/auth";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { createAdminSupabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * /account/saved — saved-for-later items.
 *
 * Linked from the cart-experience and cart-drawer when a buyer
 * presses "Save for later". Was previously a 404 (linked but never
 * built). Mirrors the structure of /account/wishlist but reads from
 * the cross-division saved_items table via the cart-saved-items
 * package, scoped to the marketplace division.
 *
 * Restore + remove POST back to /api/saved-items, which is already
 * wired and authoritative. Each row carries a `?restore=1` form
 * action — no client JS needed for the basic round-trip.
 */
export default async function AccountSavedPage() {
  const viewer = await requireMarketplaceUser("/account/saved");
  const admin = createAdminSupabase();
  const items = await listSavedItems(admin, viewer.user!.id, {
    division: "marketplace",
  });

  return (
    <WorkspaceShell
      title="Saved for later"
      description="Items you moved out of the cart so they don't lock up your basket — restore one when you're ready, or clear it."
      {...accountWorkspaceNav("/account/saved")}
    >
      {items.length === 0 ? (
        <EmptyState
          title="No saved items yet."
          body="When you press 'Save for later' on a cart item it lands here, with the price you locked in. Saved items live for 90 days; we'll warn you if anything is about to expire."
          ctaHref="/search"
          ctaLabel="Browse the marketplace"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <SavedItemCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </WorkspaceShell>
  );
}

function SavedItemCard({
  item,
}: {
  item: Awaited<ReturnType<typeof listSavedItems>>[number];
}) {
  const snapshot = item.itemSnapshot ?? {};
  const title = String(snapshot.title || "Saved item");
  const subtitle = snapshot.subtitle ? String(snapshot.subtitle) : null;
  const image = snapshot.image ? String(snapshot.image) : null;
  const href = snapshot.href ? String(snapshot.href) : null;
  const vendorName = snapshot.vendorName ? String(snapshot.vendorName) : null;
  const currency = String(snapshot.currency || "NGN");
  const priceKobo = typeof snapshot.priceKobo === "number" ? snapshot.priceKobo : null;
  const compareKobo = typeof snapshot.compareAtKobo === "number" ? snapshot.compareAtKobo : null;
  const priceLabel =
    priceKobo != null ? formatCurrency(priceKobo / 100, currency) : null;
  const compareLabel =
    compareKobo != null && compareKobo !== priceKobo
      ? formatCurrency(compareKobo / 100, currency)
      : null;

  return (
    <li className="market-paper flex flex-col overflow-hidden rounded-[1.5rem]">
      {image ? (
        <div className="relative aspect-[4/3] bg-black/30">
          {/* href present → wrap image in a link to the product */}
          {href ? (
            <Link href={href} className="absolute inset-0">
              <Image
                src={image}
                alt={title}
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 95vw"
                className="object-cover transition duration-300 hover:scale-[1.02]"
              />
            </Link>
          ) : (
            <Image
              src={image}
              alt={title}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 95vw"
              className="object-cover"
            />
          )}
        </div>
      ) : (
        <div className="aspect-[4/3] bg-gradient-to-br from-[var(--market-bg-elevated)] to-[var(--market-bg-soft)]" />
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        {vendorName ? (
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
            {vendorName}
          </p>
        ) : null}
        <p className="text-[15px] font-semibold leading-snug tracking-[-0.005em] text-[var(--market-paper-white)]">
          {href ? (
            <Link href={href} className="hover:text-[var(--market-brass)]">
              {title}
            </Link>
          ) : (
            title
          )}
        </p>
        {subtitle ? (
          <p className="line-clamp-2 text-[13px] leading-6 text-[var(--market-muted)]">
            {subtitle}
          </p>
        ) : null}

        <div className="mt-auto flex items-baseline justify-between gap-3 pt-2">
          <div>
            {priceLabel ? (
              <p className="text-[15px] font-semibold tracking-tight tabular-nums text-[var(--market-paper-white)]">
                {priceLabel}
              </p>
            ) : null}
            {compareLabel ? (
              <p className="text-[12px] tabular-nums text-[var(--market-muted)] line-through">
                {compareLabel}
              </p>
            ) : null}
          </div>
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-[var(--market-muted)]">
            Saved {formatDate(item.addedAt)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--market-line)] pt-4">
          <RestoreForm savedItemId={item.id} />
          <RemoveForm savedItemId={item.id} />
        </div>
      </div>
    </li>
  );
}

// Server actions — restore/remove without going through /api/saved-items.
// Both call the same package primitives the API route uses, so behaviour
// stays identical. revalidatePath keeps the page list fresh after each
// action and also refreshes the cart so a restore lands immediately.
async function restoreAction(formData: FormData) {
  "use server";
  const { revalidatePath } = await import("next/cache");
  const savedItemId = String(formData.get("savedItemId") || "").trim();
  if (!savedItemId) return;
  const viewer = await getMarketplaceViewer();
  if (!viewer.user) return;
  const admin = createAdminSupabase();
  await restoreSavedItem(admin, viewer.user.id, savedItemId);
  revalidatePath("/account/saved");
  revalidatePath("/cart");
}

async function removeAction(formData: FormData) {
  "use server";
  const { revalidatePath } = await import("next/cache");
  const savedItemId = String(formData.get("savedItemId") || "").trim();
  if (!savedItemId) return;
  const viewer = await getMarketplaceViewer();
  if (!viewer.user) return;
  const admin = createAdminSupabase();
  await removeSavedItem(admin, viewer.user.id, savedItemId);
  revalidatePath("/account/saved");
}

function RestoreForm({ savedItemId }: { savedItemId: string }) {
  return (
    <form action={restoreAction} className="contents">
      <input type="hidden" name="savedItemId" value={savedItemId} />
      <button
        type="submit"
        className="
          market-button-primary inline-flex items-center gap-1.5
          rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition outline-none
          focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55
          focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d]
          active:translate-y-[0.5px]
        "
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        Restore to cart
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

function RemoveForm({ savedItemId }: { savedItemId: string }) {
  return (
    <form action={removeAction} className="contents">
      <input type="hidden" name="savedItemId" value={savedItemId} />
      <button
        type="submit"
        className="
          inline-flex items-center gap-1.5 rounded-full
          border border-red-500/30 bg-transparent px-3.5 py-2 text-[12.5px] font-semibold
          text-red-500 transition hover:border-red-400/50 hover:text-red-400
        "
        aria-label="Remove saved item"
      >
        <BookmarkPlus className="h-3.5 w-3.5 rotate-45" aria-hidden />
        Clear
      </button>
    </form>
  );
}
