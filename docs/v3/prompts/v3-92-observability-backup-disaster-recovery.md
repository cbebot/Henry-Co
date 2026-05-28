# V3-92 — Observability: Backup + Disaster Recovery

**Pass ID:** V3-92 | **Phase:** I | **Pillar:** P12, P7
**Deps:** V3-90 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** Compliance

## Role
V3 Backup + DR engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P12: "Backup, disaster recovery."

## Mandatory scope

1. **Backup strategy**:
   - Supabase: daily snapshot + WAL streaming (Supabase Pro feature; verify enabled).
   - Cloudinary: backup-folder syncing critical assets to S3 cold storage weekly.
   - Codebase: GitHub (already redundant).

2. **Restore runbooks** at `docs/v3/runbooks/restore-<scenario>.md`:
   - Full DB restore.
   - Single-table restore from PITR.
   - Cloudinary asset restore.
   - Vercel project rollback.
   - Mobile app rollback (TestFlight previous build promotion).

3. **Quarterly restore drill**: scheduled exercise; restore to a staging clone; verify.

4. **RPO/RTO targets per data class**:
   - Customer data: RPO 1h, RTO 4h.
   - Payments + ledger: RPO 5min, RTO 1h.
   - Assets: RPO 24h, RTO 24h.
   - Logs: RPO 1d, RTO 7d.

5. **Off-site replica** (geographic redundancy):
   - Supabase has built-in regional redundancy; verify region.
   - For Cloudinary, asset backup to S3 in different region.

6. **Telemetry** — `henry.backup.snapshot_succeeded`, `henry.backup.snapshot_failed`, `henry.restore.drill_completed`.

## Integration keys (per INTEGRATION-KEYS.md)

Consumed:
- Supabase keys.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BACKUP_BUCKET` — for Cloudinary → S3 sync (NEW; added to INTEGRATION-KEYS.md).

ZERO hardcoded bucket names or regions.

## Out of scope
- Customer-facing backup (per-user export; that's V3-93 privacy data rights).

## Dependencies
V3-90.

## Inheritance
@henryco/observability for backup telemetry.

## Trust / safety / compliance
- Backups encrypted at rest with separate key (ANTI-CLONE Principle 6).
- Access to backups audited (ANTI-CLONE Principle 12).

## Mobile + desktop parity
N/A.

## i18n
N/A.

## Validation gates
1. Standard CI.
2. **Backup smoke** — daily snapshot present.
3. **Restore drill** completes successfully.
4. **RPO/RTO targets** documented + reviewed.

## Deployment gate
- First quarterly drill complete.

## Final report contract
Standard.

## Self-verification
- [ ] Backup strategy live.
- [ ] Runbooks for 5 scenarios.
- [ ] First drill complete.
- [ ] RPO/RTO targets documented.
- [ ] 3 new telemetry events.
- [ ] Report written.
