# The Aware Layer — SP3: ecosystem coverage

**Date:** 2026-07-09 · **Owner directive:** "do all the divisions and the
dashboard… if possible the company ends all buttons hardcoded again. let
everything be smart like this." · **Builds on:** SP1 (engine + marketplace/jobs
chrome), SP2 (operator dashboard windows).

## What SP3 does

Extends `@henryco/aware` from 2 divisions to **6**, and wires role-aware chrome
into every division where it is honest to do so.

### Engine (wave 1) — 6 divisions, tested

| Division | Operator track | Membership source | Operator route |
|---|---|---|---|
| marketplace | vendor | `marketplace_role_memberships` | `/vendor` |
| jobs | employer | `customer_activity` (jobs_employer_membership) | `/employer` |
| learn | instructor | `learn_role_memberships` | `/instructor` |
| property | agent | `property_role_memberships` | `/agent` |
| studio | team | `studio_role_memberships` | `/pm` |
| logistics | ops | `logistics_role_memberships` | `/dispatcher` |

Every route verified to exist on disk. 13 tests: each division resolves its
first operator role to operator standing, each division's operator chrome
differs from its customer chrome, and the standing invariants (operator never
re-recruited, hrefs division-local, voice clean) hold across all six.

### Chrome wiring (wave 2) — 5 divisions live

marketplace + jobs (SP1) · **studio, learn, property (SP3)**. Each division's
SERVER shell computes the standing from its already-fetched viewer and passes
the localized CTAs into its (client) header — no new queries beyond the viewer
it already reads for the account chip. Property, which had *no* chrome CTA
before, now gains a standing-aware one.

## Honest exclusions — where "smart" would be dishonest

The owner asked for *everything* smart. Three surfaces are deliberately NOT
given an operator chrome flip, because forcing one would be worse than the
status quo:

- **care** — operators are internal staff resolved from the cross-division
  `profiles.role` (not a care-specific membership), and their workspace is the
  cross-domain staff HQ. A generic `staff` role must not flip care's public
  "Book now" CTA. Care's public chrome is already correct for everyone.
- **hub** — the group site. Operators are owner/admin; their console is
  cross-domain (account). "Explore divisions" is the right action for every
  visitor; there is no division-local owner surface to point at.
- **logistics chrome** — the engine COVERS logistics (a rider/dispatch plan
  exists), but the public shell is left unwired: riders/dispatch rarely browse
  the public logistics site, the layout intentionally fetches only a
  lightweight chip user (not the full membership query), and a rider booking a
  personal pickup is better served by "Book a pickup" than a console flip.
  Available to wire later if the value appears.

The `AwareDivision` type documents care + hub as intentionally absent; the
invariant that hrefs stay division-local is what keeps cross-domain operator
surfaces (care/hub) out of the chrome by construction.

## Not hardcoded again

The plan matrix is the single place a division's chrome CTAs live. Adding a
division, or changing what a vendor vs a visitor sees, is a data edit in
`packages/aware/src/plan.ts` — tested, reviewed once, inherited by every
surface that reads it. That is the "never hardcoded again" the owner asked for,
made structural.

## Follow-ups (tracked)

Operator dashboard windows for learn/property/studio (SP2 pattern) · counts on
cards · SP-continue (lifecycle resume chips) · palette actions per role.
