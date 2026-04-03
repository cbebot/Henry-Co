import Link from "next/link";
import { COMPANY } from "@henryco/config";
import {
  LayoutDashboard,
  Settings,
  Tags,
  MessageSquareQuote,
  PackageSearch,
  Building2,
} from "lucide-react";

const care = COMPANY.divisions.care;

const nav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Settings", href: "/admin#settings", icon: Settings },
  { label: "Pricing", href: "/admin#pricing", icon: Tags },
  { label: "Reviews", href: "/admin#reviews", icon: MessageSquareQuote },
  { label: "Bookings", href: "/admin#bookings", icon: PackageSearch },
  { label: "Divisions", href: "/admin#divisions", icon: Building2 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050914] text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-white/[0.03] px-5 py-6">
          <Link href="/" className="block">
            <div className="text-lg font-black tracking-[0.02em]">{care.name}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
              Admin Console
            </div>
          </Link>

          <div className="mt-8 space-y-2">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/75 transition hover:border-[color:var(--accent)]/25 hover:bg-white/[0.05] hover:text-white"
                >
                  <Icon className="h-4 w-4 text-[color:var(--accent)]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050914]/80 px-6 py-5 backdrop-blur-2xl sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm uppercase tracking-[0.16em] text-white/45">
                  Henry & Co. Admin
                </div>
                <div className="mt-1 text-2xl font-black tracking-[-0.02em]">
                  {care.shortName} Dashboard
                </div>
              </div>

              <Link
                href="/"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
              >
                Back to website
              </Link>
            </div>
          </header>

          <main className="px-6 py-8 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}