import { HenryCoActivityIndicator } from "../loading/HenryCoActivityIndicator";

/**
 * Shared public route loading — no timers, resolves with the route when data is ready.
 */
export function HenryCoPublicRouteLoading({
  title = "Loading",
  subtitle = "Preparing this view.",
  className = "",
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 ${className}`}
    >
      <HenryCoActivityIndicator className="text-zinc-700 dark:text-white/80" label={title} />
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-white/60">{subtitle}</p>
      </div>
    </div>
  );
}
