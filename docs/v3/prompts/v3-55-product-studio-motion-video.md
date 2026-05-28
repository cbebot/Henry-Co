# V3-55 — Product: Studio Motion + Video Services

**Pass ID:** V3-55 | **Phase:** G | **Pillar:** P1
**Deps:** V3-12 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Studio Motion engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Studio motion/video services." V3 PASS 21 shipped studio backend (proposals/milestones/asset-packs/kanban). This pass adds motion-video vertical.

## Mandatory scope

1. **Motion service catalog**: explainer videos, motion graphics, video editing, 3D animation, brand stings.

2. **Intake flow** customized for video:
   - Brief: aspect ratio, duration, style refs, deadline.
   - Asset upload (existing studio asset-pack flow).
   - Storyboard collaboration.

3. **Production workflow**:
   - Storyboard sign-off.
   - Rough cut review.
   - Final delivery.

4. **Asset delivery**:
   - Multiple formats (mp4, mov, prores) via Cloudinary.
   - Watermarked previews until final payment (ANTI-CLONE Principle 5).
   - Final HD download after payment.

5. **Telemetry** — `henry.studio.motion.intake_started`, `henry.studio.motion.storyboard_signed_off`, `henry.studio.motion.delivered`.

## Out of scope
- Project suite at depth (V3-73).
- Live-streaming production (out of scope V3).

## Dependencies
V3-12.

## Inheritance
Existing studio backend; @henryco/branded-documents; Cloudinary integration.

## Trust / safety / compliance
- Asset access by buyer only (signed URL).
- IP rights documented in proposal.

## Mobile + desktop parity
Intake responsive; review on desktop.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Intake flow** smoke.
3. **Storyboard sign-off** persists.
4. **Watermarked preview** vs final download.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Motion service catalog.
- [ ] Intake + storyboard.
- [ ] Production workflow stages.
- [ ] Watermarked preview / final delivery.
- [ ] 3 new telemetry events.
- [ ] Report written.
