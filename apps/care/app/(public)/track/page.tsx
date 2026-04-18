// apps/care/app/(public)/track/page.tsx
import type { Metadata } from "next";
import { getDivisionConfig } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import TrackLookupClient from "@/components/care/TrackLookupClient";
import { getCarePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const care = getDivisionConfig("care");

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCarePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return {
    title: `${t("Track Service")} | ${care.name}`,
    description: t(
      "Track garment care, home cleaning, and office cleaning with a service-family-aware timeline and booking details."
    ),
  };
}

export default async function TrackPage() {
  const locale = await getCarePublicLocale();

  return <TrackLookupClient locale={locale} />;
}
