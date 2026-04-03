// apps/care/app/(public)/track/page.tsx
import type { Metadata } from "next";
import { getDivisionConfig } from "@henryco/config";
import TrackLookupClient from "@/components/care/TrackLookupClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const care = getDivisionConfig("care");

export const metadata: Metadata = {
  title: `Track Service | ${care.name}`,
  description:
    "Track garment care, home cleaning, and office cleaning with a service-family-aware timeline and booking details.",
};

export default function TrackPage() {
  return <TrackLookupClient />;
}
