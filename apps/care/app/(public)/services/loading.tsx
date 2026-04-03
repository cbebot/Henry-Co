import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function ServicesLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care services"
        title="Loading the service lineup"
        description="Preparing the service catalog, delivery context, and the next premium public section."
        bullets={[
          "Loading the current service lineup",
          "Preparing the next premium comparison view",
          "Syncing service and support context",
        ]}
      />
    </main>
  );
}
