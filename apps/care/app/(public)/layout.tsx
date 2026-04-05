import { LocaleProvider } from "@henryco/i18n/react";
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
      </LocaleProvider>
    </TourProvider>
  );
}
