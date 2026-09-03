"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent } from "@henryco/ui";
import { toast } from "@henryco/ui/feedback";
import { postPropertyAction } from "@/lib/property/client-actions";

type Props = {
  listingId: string;
  slug: string;
  isSaved: boolean;
};

/**
 * V3-ACTIONS-01 — save/remove a property in place. Progressive enhancement:
 * the native form post (no JS) keeps the legacy redirect path; with JS the
 * submission rides fetch, the pending state lives on this control, the
 * V3-FEEDBACK-01 toast acknowledges, and data refreshes via soft
 * revalidation — scroll and focus survive.
 */
export function SavePropertyButton({ listingId, slug, isSaved }: Props) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const router = useRouter();
  const [saved, setSaved] = useState(isSaved);
  const [pending, setPending] = useState(false);

  // Server truth wins once a refresh delivers it.
  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);

    setPending(true);
    try {
      const result = await postPropertyAction(formData);

      if (!result.ok) {
        if (result.loginUrl) {
          window.location.href = result.loginUrl;
          return;
        }
        toast.error(t("Saved listings could not be updated."), {
          body: result.error || t("Check your connection and try again."),
        });
        return;
      }

      const nowSaved = result.payload.saved === true;
      setSaved(nowSaved);
      if (nowSaved) {
        toast.success(t("Property saved to your account."), { chime: true });
      } else {
        toast.success(t("Property removed from saved listings."));
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action="/api/property" method="POST" onSubmit={(event) => void handleSubmit(event)}>
      <input type="hidden" name="intent" value="wishlist_toggle" />
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="return_to" value={`/property/${slug}`} />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="property-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--property-accent-strong)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] disabled:cursor-wait disabled:opacity-80"
      >
        <ButtonPendingContent
          pending={pending}
          pendingLabel={saved ? t("Updating saved state") : t("Saving property")}
          spinnerLabel={saved ? t("Updating saved state") : t("Saving property")}
        >
          <span className="inline-flex items-center gap-2">
            <Heart className="h-4 w-4" />
            {saved ? t("Remove from saved") : t("Save property")}
          </span>
        </ButtonPendingContent>
      </button>
    </form>
  );
}
