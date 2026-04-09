import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function AboutLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care"
        title="The Care story"
        description="Our standards, our promise."
        bullets={[
          "Brand and trust signals",
          "Premium service positioning",
          "Company heritage",
        ]}
      />
    </main>
  );
}
