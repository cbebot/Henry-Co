"use client";

import { useState } from "react";
import { getAccountCopy, useHenryCoLocale } from "@henryco/i18n";
import { LogOut, ShieldCheck } from "lucide-react";
import { ButtonPendingContent } from "@henryco/ui";
import { logoutEverywhere } from "@henryco/auth/client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function GlobalSignOutCard() {
  const locale = useHenryCoLocale();
  const copy = getAccountCopy(locale);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOutEverywhere = async () => {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      // V3-02 S7: hit the dedicated sign-out-everywhere endpoint
      // FIRST so the server can publish the Supabase Realtime
      // broadcast on `user:<id>:session` before invalidating the
      // global refresh tokens. Then run logout-everywhere on THIS
      // device to tear down henryco_* storage + cookies + broadcast
      // sign-out across this device's tabs.
      const response = await fetch("/api/security/sign-out-everywhere", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Sign-out-everywhere failed");
      }
      const supabase = createSupabaseBrowser();
      await logoutEverywhere({
        supabase,
        serverLogoutUrl: null,
        suppressBroadcast: false,
        reason: "force",
        redirectTo: "/login?signed_out=all",
      });
    } catch {
      setError(copy.globalSignOut.unavailable);
      setPending(false);
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--acct-red-soft)]">
          <ShieldCheck size={18} className="text-[var(--acct-red)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--acct-ink)]">
            {copy.globalSignOut.title}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">
            {copy.globalSignOut.description}
          </p>
          <p className="mt-2 text-xs leading-6 text-[var(--acct-muted)]">
            {copy.globalSignOut.note}
          </p>
          {error ? (
            <div className="mt-3 rounded-xl bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]">
              {error}
            </div>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleSignOutEverywhere()}
            className="acct-button-secondary mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl"
          >
            <ButtonPendingContent
              pending={pending}
              pendingLabel={copy.globalSignOut.ending}
              spinnerLabel={copy.globalSignOut.ending}
              textClassName="inline-flex items-center gap-2 font-semibold"
            >
              <>
                <LogOut size={16} />
                {copy.globalSignOut.endAllSessions}
              </>
            </ButtonPendingContent>
          </button>
        </div>
      </div>
    </div>
  );
}
