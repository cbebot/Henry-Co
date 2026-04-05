import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function RootLoading() {
  return (
    <main className="min-h-screen bg-[#08101C] px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care"
        title="Loading Henry & Co. Care"
        description="Preparing your bookings, tracking, and support services."
      />
    </main>
  );
}
