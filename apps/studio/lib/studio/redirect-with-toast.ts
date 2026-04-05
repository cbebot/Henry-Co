/** Appends a short-lived `studioToast` query param for client-side confirmation banners. */
export function withStudioToast(redirectPath: string, toastKey: string) {
  const safePath = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
  const sep = safePath.includes("?") ? "&" : "?";
  return `${safePath}${sep}studioToast=${encodeURIComponent(toastKey)}`;
}
