/**
 * V3-INNER-L-LEARN — the instructor console runs on Register L: the shared,
 * light-primary, theme-aware Henry Onyx dashboard system (apps/account is the
 * reference). A learn instructor is a division *business* participant (not
 * platform staff), so the console stays in the division app on Register L
 * (docs/v3/inner-surfaces-map.md §2.1 / §5.A).
 *
 * The `.learn-workspace-light` scope (app/globals.css) re-grounds the learn
 * forest tokens on the light register + the configured teal-green accent and
 * re-tones the bespoke `.learn-*` utilities — so /instructor reads as a sibling
 * of the account dashboard. Serif display preserved. Dark is the
 * device-preference flip, not the default — the forced-dark console defect is
 * gone here.
 */
export default function InstructorWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="learn-workspace-light">{children}</div>;
}
