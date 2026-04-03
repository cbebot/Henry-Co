import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function OwnerLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-12">
      <CareLoadingStage
        eyebrow="Henry & Co. Care owner"
        title="Preparing the owner workspace"
        description="Loading executive metrics, security transport, and the latest operational controls for this dashboard."
        bullets={[
          "Syncing live owner metrics",
          "Loading transport and security context",
          "Preparing controlled workspace actions",
        ]}
      />
    </div>
  );
}
