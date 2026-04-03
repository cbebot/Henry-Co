// apps/care/components/care/BrandVideo.tsx
import { Play } from "lucide-react";

export default function BrandVideo({
  title = "Company Showreel",
subtitle = "Add a short video here to reinforce trust, process clarity, and service quality.",
  src = "/videos/care-showreel.mp4",
}: {
  title?: string;
  subtitle?: string;
  src?: string;
}) {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-6 sm:px-8 lg:px-10">
      <div className="rounded-[36px] border border-black/10 bg-white/80 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
              Video
            </div>
            <h2 className="mt-3 text-3xl font-black text-zinc-950 dark:text-white sm:text-4xl">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-zinc-600 dark:text-white/68">
              {subtitle}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--accent)]/10 px-4 py-2 text-sm font-semibold text-[color:var(--accent)]">
            <Play className="h-4 w-4" />
            Put file in <span className="font-mono">public/videos/care-showreel.mp4</span>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
          <video className="aspect-video w-full" controls playsInline preload="metadata" src={src} />
        </div>
      </div>
    </section>
  );
}
