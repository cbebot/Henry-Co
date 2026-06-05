function readEnv(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export type VapidConfig = {
  publicKey: string;
  privateKey: string;
  /** RFC 8292 `sub`: a mailto:/https: contact for the push service to reach us. */
  subject: string;
};

/**
 * Server-only VAPID config for sending web push. Returns null when unconfigured
 * so the dispatcher degrades to a no-op for the web channel instead of throwing
 * (native + email still deliver). Generate keys once: `npx web-push generate-vapid-keys`.
 */
export function getVapidConfig(): VapidConfig | null {
  const publicKey =
    readEnv("PUSH_VAPID_PUBLIC_KEY") || readEnv("NEXT_PUBLIC_PUSH_VAPID_PUBLIC_KEY");
  const privateKey = readEnv("PUSH_VAPID_PRIVATE_KEY");
  if (!publicKey || !privateKey) return null;

  const explicitSubject = readEnv("PUSH_VAPID_SUBJECT");
  const baseDomain = readEnv("NEXT_PUBLIC_BASE_DOMAIN");
  const subject =
    explicitSubject ||
    (baseDomain ? `mailto:security@${baseDomain}` : "https://github.com/web-push-libs/web-push");

  return { publicKey, privateKey, subject };
}

/**
 * The VAPID public key the browser needs to call `PushManager.subscribe`. Safe
 * to expose to the client (it is the public half of the keypair).
 */
export function getPublicVapidKey(): string | null {
  return (
    readEnv("NEXT_PUBLIC_PUSH_VAPID_PUBLIC_KEY") || readEnv("PUSH_VAPID_PUBLIC_KEY") || null
  );
}
