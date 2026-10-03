import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import ReviewForm from "@/components/care/ReviewForm";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";
import { getCarePublicLocale } from "@/lib/locale-server";

export const metadata: Metadata = {
  title: "Verified Review | Henry Onyx Fabric Care",
  description: "Leave a verified review for a completed Henry Onyx Fabric Care booking.",
};

export default async function ReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{
    code?: string;
    phone?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const code = String(params.code || "").trim().toUpperCase();
  const phone = String(params.phone || "").trim();
  const locale = await getCarePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="px-4 pb-24 pt-10 sm:px-6 lg:px-10"
      style={
        {
          "--accent": CARE_ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-[92rem] grid items-start gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <section>
          <h1 className="max-w-3xl text-balance care-display text-[color:var(--home-ink)]">
            {t("Review a completed booking.")}
          </h1>
        </section>

        <ReviewForm initialTrackingCode={code} initialPhone={phone} />
      </div>
    </main>
  );
}
