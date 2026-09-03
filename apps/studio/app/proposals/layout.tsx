/**
 * V3-INNER-L-STUDIO-TAIL — the proposal room runs on Register L. Like
 * `/project`, `/proposals/[id]` is reached by access-key (shared proposal
 * deep-links) and by staff; both render the same client-facing commercial
 * record. Mounting `.studio-workspace-light` re-grounds the studio tokens
 * onto the shared light-primary Henry Onyx dashboard register with the
 * configured teal accent (the scope neutralizes the dark studio-shell mesh
 * on the light canvas). Dark is the device-preference flip, not the default.
 * See app/globals.css.
 */
export default function ProposalsRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio-workspace-light studio-page studio-shell min-h-screen">
      {children}
    </div>
  );
}
