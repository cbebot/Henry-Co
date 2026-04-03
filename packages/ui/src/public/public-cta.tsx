import { ArrowRight } from "lucide-react";
import { PublicButton } from "./public-button";

export function PublicCTA({
  title,
  description,
  primary,
  secondary,
}: {
  title: string;
  description: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-6 sm:px-8 lg:px-10">
      <div className="relative overflow-hidden rounded-[36px] border border-black/10 bg-white/80 px-8 py-14 shadow-[0_25px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_25px_90px_rgba(0,0,0,0.28)] sm:px-10 lg:px-14">
        <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-[#C9A227]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-44 w-44 rounded-full bg-black/5 blur-3xl dark:bg-white/5" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A227]">
              Ready when you are
            </div>
            <h3 className="mt-3 text-3xl font-black tracking-[-0.03em] text-zinc-950 dark:text-white sm:text-4xl">
              {title}
            </h3>
            <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-white/68 sm:text-base">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <PublicButton href={primary.href} size="lg">
              {primary.label}
              <ArrowRight className="h-5 w-5" />
            </PublicButton>

            {secondary ? (
              <PublicButton href={secondary.href} variant="secondary" size="lg">
                {secondary.label}
              </PublicButton>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}