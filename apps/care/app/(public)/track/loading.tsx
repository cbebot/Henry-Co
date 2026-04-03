import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function TrackLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care tracking"
        title="Pulling your live service timeline"
        description="Loading the latest booking stage, payment context, and the correct service-family timeline for this tracking route."
        bullets={[
          "Resolving the live booking reference",
          "Pulling payment and proof context",
          "Preparing the correct service timeline",
        ]}
      />
    </main>
  );
}
