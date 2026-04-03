import Link from "next/link";

export function SiteFooter({
  title,
  note,
  links
}: {
  title: string;
  note?: string;
  links?: { label: string; href: string }[];
}) {
  return (
    <footer className="mt-16 border-t border-black/10 py-10 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            {note ? (
              <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                {note}
              </div>
            ) : null}
          </div>
          {links?.length ? (
            <div className="flex flex-wrap gap-4 text-sm text-black/70 dark:text-white/70">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="hover:underline">
                  {l.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}