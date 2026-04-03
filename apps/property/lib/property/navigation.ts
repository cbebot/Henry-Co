export function getWorkspaceNavigation(active: string) {
  return [
    { href: "/owner", label: "Owner", active: active === "/owner" },
    { href: "/agent", label: "Agent", active: active === "/agent" },
    { href: "/operations", label: "Operations", active: active === "/operations" },
    { href: "/moderation", label: "Moderation", active: active === "/moderation" },
    { href: "/support", label: "Support", active: active === "/support" },
    { href: "/admin", label: "Admin", active: active === "/admin" },
  ];
}
