import Link from "next/link";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type FooterGroup = {
  title: string;
  links: FooterLink[];
};

export function PublicFooter({
  brand,
  description,
  support,
  groups,
}: {
  brand: string;
  description: string;
  support: {
    email: string;
    phone: string;
  };
  groups: FooterGroup[];
}) {
  return (
    <footer className="mt-20 border-t border-black/10 bg-white/70 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[1.25fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <div className="text-lg font-black tracking-[0.02em] text-zinc-950 dark:text-white">
            {brand}
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-zinc-600 dark:text-white/65">
            {description}
          </p>

          <div className="mt-6 space-y-2 text-sm text-zinc-700 dark:text-white/75">
            <div>{support.email}</div>
            <div>{support.phone}</div>
          </div>
        </div>

        {groups.map((group) => (
          <div key={group.title}>
            <div className="text-sm font-semibold text-zinc-950 dark:text-white">
              {group.title}
            </div>
            <div className="mt-4 space-y-3">
              {group.links.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm text-zinc-600 transition hover:text-zinc-950 dark:text-white/65 dark:hover:text-white"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block text-sm text-zinc-600 transition hover:text-zinc-950 dark:text-white/65 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-black/10 px-6 py-5 text-xs text-zinc-500 dark:border-white/10 dark:text-white/45 sm:px-8 lg:px-10">
        © {new Date().getFullYear()} {brand}. All rights reserved.
      </div>
    </footer>
  );
}