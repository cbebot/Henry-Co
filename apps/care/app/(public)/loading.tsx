import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function PublicLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care"
        title="Preparing the public Care experience"
        description="Loading live service menus, pricing context, and the next polished route so the handoff feels immediate."
        bullets={[
          "Loading live booking and pricing context",
          "Preparing the next premium public surface",
          "Keeping support and payment guidance in sync",
        ]}
      />
    </main>
  );
}
