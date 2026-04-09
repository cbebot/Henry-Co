# HenryCo Support Platform Audit

**Date**: 2026-04-09
**Role**: Support-system truth correction and pre-Claude handoff note.

## Current Support Truth

- Care still contains the strongest structured support backend in the monorepo.
- Account now supports notification auto-read and manual unread persistence through `customer_notifications`.
- Account support thread pages can mark related notifications read when a thread or care booking is opened.
- Public support entry is still uneven across divisions. Care and Marketplace are ahead of the rest.

## Critical Corrections

- Support-thread unread state is not implemented as a real backend capability.
- The shared tables `support_threads` and `support_messages` still do not expose read markers such as `is_read` or `read_at`.
- Any product claim that messages themselves can be marked unread later is therefore false today.
- What exists instead is notification unread persistence layered around support activity.

## Current Gaps

- Cross-division support launcher adoption is still incomplete.
- Shared support analytics and shared intake normalization are still future work.
- Account, Learn, Jobs, Studio, and Hub still need a cleaner cross-division support operating model.
- Legacy care notification links still exist in the shared ledger and need deploy plus optional cleanup strategy.

## Reserved For Claude Or Remote Work

- Decide whether true support-thread unread state should exist, then add schema and backend support deliberately.
- Re-verify cross-division support entry in browser with real authenticated roles.
- Finish support-entry standardization only after each division has confirmed routes and ownership.
