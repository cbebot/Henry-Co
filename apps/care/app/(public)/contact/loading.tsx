import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function ContactLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care support"
        title="Direct support channels"
        description="Every way to reach the Care team."
        bullets={[
          "Support and contact channels",
          "Messaging options",
          "Response guidance",
        ]}
      />
    </main>
  );
}
