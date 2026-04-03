import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function InboxLoading() {
  return (
    <div className="p-4 sm:p-6">
      <CareLoadingStage
        eyebrow="Henry & Co. Care support"
        title="Preparing the inbox workspace"
        description="Loading the mailbox rail, the active thread detail, and the next clean reply surface for support."
        bullets={[
          "Syncing the active mailbox filters",
          "Loading the current thread detail",
          "Preparing the next support handoff",
        ]}
      />
    </div>
  );
}
