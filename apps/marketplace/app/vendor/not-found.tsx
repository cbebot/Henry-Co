import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export default async function VendorNotFound() {
  const locale = await getMarketplacePublicLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-[var(--market-paper-white)]">
        {t("That page isn't in your workspace")}
      </h1>
      <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
        {t("It may have moved. Everything you manage is reachable from the overview.")}
      </p>
      <Link
        href="/vendor"
        className="mt-6 inline-block rounded-full border border-[var(--market-line-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--market-paper-white)] transition hover:border-[var(--market-brass)]"
      >
        {t("Back to overview")}
      </Link>
    </div>
  );
}
