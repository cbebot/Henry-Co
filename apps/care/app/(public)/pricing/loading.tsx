import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function PricingLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care pricing"
        title="Service pricing"
        description="Current rates, packages, and service details."
        bullets={[
          "Governed pricing data",
          "Service and package details",
          "Premium rate schedule",
        ]}
      />
    </main>
  );
}
