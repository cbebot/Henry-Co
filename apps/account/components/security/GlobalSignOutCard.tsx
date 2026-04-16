"use client";

import { useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { ButtonPendingContent } from "@henryco/ui";

export default function GlobalSignOutCard() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOutEverywhere = async () => {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      window.location.assign("/login?signed_out=all");
    } catch {
      setError("We couldn't end every HenryCo session right now. Try again in a moment.");
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
            End every HenryCo session
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">
            This signs the current account out across HenryCo divisions and devices, then returns
            you to the account login surface.
          </p>
          <p className="mt-2 text-xs leading-6 text-[var(--acct-muted)]">
            Recent device and session activity stays visible below even though live per-device
            revocation is not yet exposed as a separate control.
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
              pendingLabel="Ending all sessions..."
              spinnerLabel="Ending all sessions"
              textClassName="inline-flex items-center gap-2 font-semibold"
            >
              <>
                <LogOut size={16} />
                Sign out all HenryCo sessions
              </>
            </ButtonPendingContent>
          </button>
        </div>
      </div>
    </div>
  );
}
