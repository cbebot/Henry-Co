import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function PublicLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care"
        title="HenryCo Care"
        description="Service menus, pricing, and everything you need."
        bullets={[
          "Live booking and pricing",
          "Premium service catalog",
          "Support and payment guidance",
        ]}
      />
    </main>
  );
}
