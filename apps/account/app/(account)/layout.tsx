import { Suspense, type ReactNode } from "react";
import AccountLayoutInner from "./AccountLayoutInner";
import AccountRouteLoading from "@/components/layout/AccountRouteLoading";

/**
 * Suspense-wrapped chrome so the first byte can stream while auth + profile resolve.
 * No artificial delay — fallback only reflects real server work in flight.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <AccountRouteLoading
          title="Opening your account"
          description="Confirming your session and loading navigation."
        />
      }
    >
      <AccountLayoutInner>{children}</AccountLayoutInner>
    </Suspense>
  );
}
