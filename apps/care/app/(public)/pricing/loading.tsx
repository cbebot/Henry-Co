import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function PricingLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care pricing"
        title="Loading live pricing context"
        description="Pulling the current service catalog, pricing visibility, and approval-controlled rates for this view."
        bullets={[
          "Loading governed pricing data",
          "Preparing service and package detail",
          "Syncing the latest premium rate view",
        ]}
      />
    </main>
  );
}
