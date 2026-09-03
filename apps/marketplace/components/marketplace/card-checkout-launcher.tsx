"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

function formatNgn(amountMajor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(amountMajor)));
  } catch {
    return `${currency || "NGN"} ${Math.max(0, Math.round(amountMajor)).toLocaleString()}`;
  }
}

/**
 * Drives the card charge for an order: POSTs once to /api/checkout/card (a POST so
 * no prefetch can start a charge) and follows the opaque hosted-checkout action. The
 * payment provider is never named — the buyer sees "secure payment" to Henry Onyx.
 */
export function CardCheckoutLauncher({
  orderNo,
  amountMajor,
  currency,
}: {
  orderNo: string;
  amountMajor: number;
  currency: string;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const amountLabel = formatNgn(amountMajor, currency);

  const start = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/checkout/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo }),
      });
      const data = (await res.json().catch(() => null)) as { redirectUrl?: string; error?: string } | null;
      if (res.ok && data?.redirectUrl) {
        // Full navigation (not a client route push) — the hosted checkout is off-app.
        window.location.assign(data.redirectUrl);
        return;
      }
      setError(data?.error || t("We couldn't start card payment. Please try again."));
    } catch {
      setError(t("We couldn't reach the payment service. Check your connection and try again."));
    }
    // t is a stable per-render translator; the request only depends on orderNo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNo]);

  useEffect(() => {
    if (started.current) return; // guard React StrictMode's double-invoke
    started.current = true;
    void start();
  }, [start]);

  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center"
      style={{
        ["--launch-accent" as never]: "var(--market-brass, var(--home-accent))",
        ["--launch-ink" as never]: "var(--market-ink, var(--home-ink))",
        ["--launch-soft" as never]: "var(--market-muted, var(--home-ink-70))",
      }}
    >
      <span
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
        style={{ borderColor: "var(--home-line-15)", color: "var(--launch-soft)" }}
      >
        <Lock className="h-3.5 w-3.5" style={{ color: "var(--launch-accent)" }} aria-hidden />
        {t("Secured payment")}
      </span>

      <p className="mt-6 text-sm font-medium" style={{ color: "var(--launch-soft)" }}>
        {t("Order")} {orderNo}
      </p>
      <p className="mt-1 text-3xl font-semibold tabular-nums" style={{ color: "var(--launch-ink)" }}>
        {amountLabel}
      </p>

      {error ? (
        <div className="mt-8 w-full">
          <p className="text-sm" style={{ color: "var(--launch-ink)" }}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => void start()}
            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition [@media(hover:hover)]:hover:brightness-110"
            style={{ background: "var(--launch-accent)", color: "#000" }}
          >
            {t("Try again")}
          </button>
          <Link
            href={`/pay/${orderNo}`}
            className="mt-4 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold"
            style={{ color: "var(--launch-soft)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("Back to order")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-3">
          <span
            className="h-7 w-7 animate-spin rounded-full border-2 border-current border-t-transparent"
            style={{ color: "var(--launch-accent)" }}
            aria-hidden
          />
          <p className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--launch-soft)" }}>
            <ShieldCheck className="h-4 w-4" aria-hidden />
            {t("Opening secure checkout…")}
          </p>
        </div>
      )}
    </main>
  );
}
