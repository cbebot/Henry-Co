import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function BookLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care booking"
        title="Your booking workspace"
        description="Service details, pricing, and your booking form."
        bullets={[
          "Service and garment pricing",
          "Payment and support guidance",
          "Booking form",
        ]}
      />
    </main>
  );
}
