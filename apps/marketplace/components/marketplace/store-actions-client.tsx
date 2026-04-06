"use client";

import Link from "next/link";
import { Store, UserRound } from "lucide-react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import { useMarketplaceFollows } from "@/components/marketplace/runtime-provider";

export function StoreActionsClient({ vendorSlug }: { vendorSlug: string }) {
  const { isFollowing, pendingFollowSlugs, toggleFollow } = useMarketplaceFollows();
  const busy = pendingFollowSlugs.includes(vendorSlug);
  const following = isFollowing(vendorSlug);

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={() => void toggleFollow(vendorSlug)}
        className="market-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait"
      >
        {busy ? <HenryCoActivityIndicator size="sm" label="Updating store follow" /> : null}
        {busy ? "Updating..." : following ? "Following store" : "Follow this store"}
      </button>
      <Link
        href="/account/following"
        className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
      >
        <UserRound className="h-4 w-4" />
        Saved stores
      </Link>
      <Link
        href="/search?verified=1"
        className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
      >
        <Store className="h-4 w-4" />
        Browse related
      </Link>
    </div>
  );
}
