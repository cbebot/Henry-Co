import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function ServicesLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care services"
        title="Our services"
        description="The full Care service catalog."
        bullets={[
          "Current service lineup",
          "Premium service comparison",
          "Service and support details",
        ]}
      />
    </main>
  );
}
