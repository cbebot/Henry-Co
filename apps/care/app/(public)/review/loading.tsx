import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function ReviewLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care reviews"
        title="Verified client reviews"
        description="Authentic feedback from Care clients."
        bullets={[
          "Verified review history",
          "Submission form",
          "Service verification details",
        ]}
      />
    </main>
  );
}
