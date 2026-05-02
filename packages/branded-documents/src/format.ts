const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
});

export function formatKobo(amountKobo: number | null | undefined, currency = "NGN") {
  const value = Number(amountKobo) || 0;
  if (currency === "NGN") {
    return NGN.format(value / 100);
  }
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(value / 100);
}

export function formatDate(value: string | Date | null | undefined, locale = "en-NG") {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined, locale = "en-NG") {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function titleCase(value: string | null | undefined) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function statusToLabel(status: string | null | undefined) {
  return titleCase(status || "");
}
