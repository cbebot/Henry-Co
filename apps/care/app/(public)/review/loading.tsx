import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function ReviewLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care reviews"
        title="Preparing the verified review desk"
        description="Loading review guidance, verification cues, and the live submission surface for the next client proof."
        bullets={[
          "Loading verified review context",
          "Preparing the next submission step",
          "Restoring service verification cues",
        ]}
      />
    </main>
  );
}
