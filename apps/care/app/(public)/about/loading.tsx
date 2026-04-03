import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function AboutLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care"
        title="Preparing the Care story"
        description="Loading the service story, operating standards, and the next polished public section."
        bullets={[
          "Loading brand and trust signals",
          "Preparing premium service positioning",
          "Syncing the next public route",
        ]}
      />
    </main>
  );
}
