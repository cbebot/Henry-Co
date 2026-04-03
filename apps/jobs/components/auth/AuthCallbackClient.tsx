"use client";

import { useEffect, useEffectEvent, useState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSharedAccountLoginUrl } from "@/lib/account";

type CallbackState = {
  title: string;
  body: string;
  error: boolean;
};

const initialState: CallbackState = {
  title: "Securing your HenryCo Jobs session",
  body: "We are validating your sign-in and restoring the Jobs module.",
  error: false,
};

function normalizeNext(next: string | null) {
  if (!next || !next.startsWith("/")) {
    return "/candidate";
  }

  return next;
}

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CallbackState>(initialState);

  const completeSession = useEffectEvent(async () => {
    const next = normalizeNext(searchParams.get("next"));
    const code = searchParams.get("code");
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    const response = await fetch("/auth/session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        code,
        accessToken,
        refreshToken,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || "We could not complete your sign-in.");
    }

    if (window.location.hash) {
      const cleanUrl = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    startTransition(() => {
      router.replace(next);
      router.refresh();
    });
  });

  useEffect(() => {
    let cancelled = false;

    completeSession().catch((error) => {
      if (cancelled) {
        return;
      }

      setState({
        title: "We could not complete your sign-in",
        body: error instanceof Error ? error.message : "Please request another secure sign-in link and try again.",
        error: true,
      });

      const next = normalizeNext(searchParams.get("next"));
      window.setTimeout(() => {
        const loginUrl = new URL(getSharedAccountLoginUrl(next));
        loginUrl.searchParams.set("error", "auth");
        window.location.replace(loginUrl.toString());
      }, 1800);
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="jobs-panel w-full rounded-[2rem] p-8 text-center sm:p-10">
      <div
        className={[
          "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
          state.error
            ? "bg-[var(--jobs-danger-soft)] text-[var(--jobs-danger)]"
            : "bg-[var(--jobs-success-soft)] text-[var(--jobs-success)]",
        ].join(" ")}
      >
        {state.error ? "!" : <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">{state.title}</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">{state.body}</p>
    </div>
  );
}
