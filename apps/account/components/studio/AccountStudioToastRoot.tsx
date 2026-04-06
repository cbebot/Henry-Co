import { Suspense } from "react";
import { AccountStudioToastAnchor } from "@/components/studio/AccountStudioToastAnchor";

export function AccountStudioToastRoot() {
  return (
    <Suspense fallback={null}>
      <AccountStudioToastAnchor />
    </Suspense>
  );
}
