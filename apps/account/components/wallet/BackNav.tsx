import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  href: string;
  label: string;
};

export function BackNav({ href, label }: Props) {
  return (
    <div className="acct-wal__nav">
      <Link href={href} className="acct-wal__nav-back" aria-label={label}>
        <ArrowLeft size={14} aria-hidden /> {label}
      </Link>
    </div>
  );
}
