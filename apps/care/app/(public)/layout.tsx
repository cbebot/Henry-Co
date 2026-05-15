import { LocaleProvider } from "@henryco/i18n/react";
import { NotificationsToastViewport } from "@henryco/dashboard-shell";
import CarePublicShell from "@/components/public/CarePublicShell";
import TourProvider from "@/components/tour/TourProvider";
import TourOverlay from "@/components/tour/TourOverlay";
import TourWelcomePrompt from "@/components/tour/TourWelcomePrompt";
import HelpButton from "@/components/tour/HelpButton";
import { getCarePublicLocale } from "@/lib/locale-server";
import { publicTour } from "@/lib/tour/machines";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const locale = await getCarePublicLocale();

  return (
    <TourProvider scope="public" machine={publicTour}>
      <LocaleProvider locale={locale}>
        <CarePublicShell>{children}</CarePublicShell>
        <TourOverlay />
        <TourWelcomePrompt machine={publicTour} scope="public" />
        <HelpButton machine={publicTour} scope="public" />
        {/* V3 PASS 21 — surface customer realtime signals (status
            changes, payment requests, etc.) shell-wide on the care
            public surfaces. Audience='customer' so staff signals do
            not leak. */}
        <NotificationsToastViewport audience="customer" />
      </LocaleProvider>
    </TourProvider>
  );
}
