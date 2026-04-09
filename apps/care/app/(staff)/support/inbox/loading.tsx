import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function InboxLoading() {
  return (
    <div className="p-4 sm:p-6">
      <CareLoadingStage
        eyebrow="Henry & Co. Care support"
        title="Support inbox"
        description="Mailbox, active threads, and reply workspace."
        bullets={[
          "Active mailbox filters",
          "Current thread detail",
          "Reply workspace",
        ]}
      />
    </div>
  );
}
