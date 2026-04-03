import CarePublicShell from "@/components/public/CarePublicShell";
import TourProvider from "@/components/tour/TourProvider";
import TourOverlay from "@/components/tour/TourOverlay";
import TourWelcomePrompt from "@/components/tour/TourWelcomePrompt";
import HelpButton from "@/components/tour/HelpButton";
import { publicTour } from "@/lib/tour/machines";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider scope="public" machine={publicTour}>
      <CarePublicShell>{children}</CarePublicShell>
      <TourOverlay />
      <TourWelcomePrompt machine={publicTour} scope="public" />
      <HelpButton machine={publicTour} scope="public" />
    </TourProvider>
  );
}
