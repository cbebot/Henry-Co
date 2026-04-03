import type { ReactNode } from "react";

export default function OwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_540px_at_18%_8%,rgba(201,162,39,0.18),transparent_58%),radial-gradient(900px_520px_at_82%_18%,rgba(59,130,246,0.10),transparent_58%),radial-gradient(900px_520px_at_50%_100%,rgba(168,85,247,0.10),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:24px_24px] opacity-30" />
      </div>
      {children}
    </div>
  );
}