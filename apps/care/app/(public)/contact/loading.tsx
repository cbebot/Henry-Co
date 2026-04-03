import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function ContactLoading() {
  return (
    <main className="px-5 py-6 sm:px-8 sm:py-8">
      <CareLoadingStage
        eyebrow="Henry & Co. Care support"
        title="Opening the Care desk"
        description="Loading direct channels, live support guidance, and the next clear messaging surface."
        bullets={[
          "Loading support and contact channels",
          "Preparing the message handoff",
          "Syncing response expectations and guidance",
        ]}
      />
    </main>
  );
}
