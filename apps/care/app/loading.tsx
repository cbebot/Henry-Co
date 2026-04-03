import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function RootLoading() {
  return (
    <main className="min-h-screen bg-[#08101C] px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care"
        title="Warming up the Care platform"
        description="Restoring the live booking, tracking, support, and workspace state so the next screen arrives already composed."
      />
    </main>
  );
}
