import { CareLoadingStage } from "@/components/ui/CareLoading";

export default function OwnerLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-12">
      <CareLoadingStage
        eyebrow="Henry & Co. Care owner"
        title="Owner workspace"
        description="Executive metrics, security, and operational controls."
        bullets={[
          "Live owner metrics",
          "Transport and security context",
          "Controlled workspace actions",
        ]}
      />
    </div>
  );
}
