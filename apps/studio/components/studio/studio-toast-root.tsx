import { Suspense } from "react";
import { StudioToastAnchor } from "@/components/studio/studio-toast-anchor";

export function StudioToastRoot() {
  return (
    <Suspense fallback={null}>
      <StudioToastAnchor />
    </Suspense>
  );
}
