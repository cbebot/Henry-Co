export function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function divisionLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}
