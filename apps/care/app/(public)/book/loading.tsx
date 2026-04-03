import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function BookLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care booking"
        title="Preparing your booking workspace"
        description="Loading service pricing, payment guidance, and the live booking form so you can move straight into the request."
        bullets={[
          "Loading service and garment pricing",
          "Preparing payment and support guidance",
          "Restoring the booking handoff",
        ]}
      />
    </main>
  );
}
