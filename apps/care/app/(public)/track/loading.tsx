import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function TrackLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care tracking"
        title="Your service timeline"
        description="Live booking status, payments, and progress."
        bullets={[
          "Live booking reference",
          "Payment and proof context",
          "Service timeline",
        ]}
      />
    </main>
  );
}
