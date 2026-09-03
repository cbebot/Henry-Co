"use client";

import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

export default function VendorError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useHenryCoLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-[var(--market-paper-white)]">
        {t("Something went wrong in your workspace")}
      </h1>
      <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
        {t("Your data is safe. Try again, or return to the overview while we look into it.")}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-[var(--market-line-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--market-paper-white)] transition hover:border-[var(--market-brass)]"
        >
          {t("Try again")}
        </button>
        <Link
          href="/vendor"
          className="rounded-full border border-[var(--market-line)] px-5 py-2.5 text-sm font-semibold text-[var(--market-muted)] transition hover:text-[var(--market-paper-white)]"
        >
          {t("Back to overview")}
        </Link>
      </div>
    </div>
  );
}
