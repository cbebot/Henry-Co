/**
 * V3-INNER-L-LEARN — the course room (the one learner-facing rendered surface)
 * runs on Register L: the shared light-primary, theme-aware Henry Onyx dashboard
 * system. Scoped to the course room only — the rest of /learner is delegated to
 * apps/account (redirect shells), so the scope is mounted here, not on /learner.
 * Serif display preserved. Dark is the device-preference flip, not the default.
 */
export default function CourseRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="learn-workspace-light">{children}</div>;
}
