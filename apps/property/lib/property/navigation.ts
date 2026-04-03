export function getAccountNavigation(active: string) {
  return [
    { href: "/account", label: "Overview", active: active === "/account" },
    { href: "/account/saved", label: "Saved", active: active === "/account/saved" },
    { href: "/account/inquiries", label: "Inquiries", active: active === "/account/inquiries" },
    { href: "/account/viewings", label: "Viewings", active: active === "/account/viewings" },
    { href: "/account/listings", label: "My listings", active: active === "/account/listings" },
  ];
}

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
