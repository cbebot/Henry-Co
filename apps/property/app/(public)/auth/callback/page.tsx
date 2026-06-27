"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPropertySubmitCopy } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getSharedAccountPropertyUrl, sanitizePropertyAuthReturnTarget } from "@/lib/property/links";

export default function PropertyAuthCallbackPage() {
  const locale = useHenryCoLocale();
  const copy = getPropertySubmitCopy(locale);
  const searchParams = useSearchParams();
  const [message, setMessage] = useState(copy.callback.completing);

  useEffect(() => {
    let active = true;
    const nextPath = sanitizePropertyAuthReturnTarget(
      searchParams.get("next"),
      getSharedAccountPropertyUrl(),
      window.location.origin
    );

    async function completeAuth() {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const errorDescription = hashParams.get("error_description");

      if (errorDescription) {
        if (active) setMessage(errorDescription);
        return;
      }

      if (!accessToken || !refreshToken) {
        if (active) setMessage(copy.callback.missingCredentials);
        return;
      }

      const target = new URL("/auth/session", window.location.origin);
      target.searchParams.set("access_token", accessToken);
      target.searchParams.set("refresh_token", refreshToken);
      target.searchParams.set("next", nextPath);
      window.location.replace(target.toString());
    }

    void completeAuth();

    return () => {
      active = false;
    };
  }, [searchParams, copy.callback.missingCredentials]);

  return (
    <main className="mx-auto max-w-[42rem] px-5 py-14 sm:px-8">
      <div className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">{copy.callback.kicker}</div>
        <h1 className="property-heading mt-4">{copy.callback.heading}</h1>
        <p className="mt-4 text-base leading-8 text-[var(--property-ink-soft)]">{message}</p>
      </div>
    </main>
  );
}
