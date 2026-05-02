import type { DivisionKey } from "@henryco/config";

type VerificationMeta = {
  google?: string;
  other?: Record<string, string | string[]>;
};

function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : undefined;
}

export function getVerificationMeta(key: DivisionKey | "account"): VerificationMeta | undefined {
  const upper = key.toUpperCase();
  const google = readEnv(`NEXT_PUBLIC_SEARCH_CONSOLE_${upper}`);
  const bing = readEnv(`NEXT_PUBLIC_BING_VERIFY_${upper}`);
  const yandex = readEnv(`NEXT_PUBLIC_YANDEX_VERIFY_${upper}`);

  if (!google && !bing && !yandex) return undefined;

  const other: Record<string, string> = {};
  if (bing) other["msvalidate.01"] = bing;
  if (yandex) other["yandex-verification"] = yandex;

  return {
    google,
    other: Object.keys(other).length ? other : undefined,
  };
}
