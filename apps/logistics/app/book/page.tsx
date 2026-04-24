import type { Metadata } from "next";
import BookRequestForm from "@/components/booking/BookRequestForm";
import { createAdminSupabase } from "@/lib/supabase";
import { getLogisticsZones } from "@/lib/logistics/data";
import { getLogisticsViewer } from "@/lib/logistics/auth";

export const metadata: Metadata = {
  title: "Book a delivery | HenryCo Logistics",
  description: "Submit a pickup and delivery request with governed pricing and live tracking.",
};

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const [zones, viewer] = await Promise.all([getLogisticsZones(), getLogisticsViewer()]);
  const savedAddresses = viewer.user
    ? await loadSavedAddresses(viewer.user.id)
    : [];

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">Book a delivery.</h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-[var(--logistics-muted)] sm:text-base">
          Sender, recipient, and where to meet both sides. Tracking code is issued immediately; milestones update as dispatch progresses.
        </p>
        <div className="mt-8">
          <BookRequestForm zones={zones} defaultMode="book" savedAddresses={savedAddresses} />
        </div>
      </div>
    </main>
  );
}

async function loadSavedAddresses(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_addresses")
    .select("id, label, line1, city, state, is_default")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(6);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.label || row.line1 || "Saved address"),
    fullAddress: [row.line1, row.city, row.state].filter(Boolean).join(", "),
    line1: String(row.line1 || ""),
    city: String(row.city || ""),
    region: String(row.state || ""),
  }));
}
