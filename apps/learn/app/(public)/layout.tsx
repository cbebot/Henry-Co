import { LearnSiteHeader } from "@/components/learn/site-header";
import { LearnSiteFooter } from "@/components/learn/site-footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="learn-shell min-h-screen">
      <LearnSiteHeader />
      {children}
      <LearnSiteFooter />
    </div>
  );
}
