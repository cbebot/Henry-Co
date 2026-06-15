# V3 Dependencies Graph

**Pass:** V3 Strategic Architect (Phase D output)
**Compiled:** 2026-05-17
**Status:** Directed dependency graph. Reading row "depends on" → tells you what to finish first. Reading row "unblocks" → tells you what becomes startable when this pass closes.

This is the truth source for "what runs next". Every pass appears once. Cross-reference PASS-REGISTER.md for slug + phase + risk + effort.

---

## How to use

Two views:
- **Section A — pass → dependencies:** "I want to start V3-NN; what must close first?"
- **Section B — pass → unblocks:** "I just closed V3-NN; what becomes startable?"

Both views are derived from the same edges (Phase A audit edges to Phase B; Phase B edges to Phase C; etc.). When you change either section, update both.

---

## Section A — pass → dependencies

| Pass | Depends on (must close first) | Owner gate |
|---|---|---|
| V3-01 | (Phase A audit) | — |
| V3-02 | V3-01 | — |
| V3-03 | (Phase A audit) | — |
| V3-04 | V3-02 | — |
| V3-05 | (Phase A audit) | — |
| V3-06 | V3-05 | — |
| V3-07 | (Phase A audit) | — |
| V3-08 | V3-03 | — |
| V3-09 | (Phase A audit) | — |
| V3-10 | (Phase A audit) | — |
| V3-11 | V3-04 | — |
| V3-12 | V3-01..V3-11 | D11 |
| V3-13 | V3-12 | — |
| V3-14 | V3-13 | D1 |
| V3-15 | V3-13 | D1 |
| V3-16 | V3-13 | D1 |
| V3-17 | V3-13 | — |
| V3-18 | V3-17 | — |
| V3-19 | V3-14, V3-15, V3-16, V3-17 | — |
| V3-20 | V3-13, V3-17 | D9 (partial) |
| V3-21 | V3-13, V3-17 | D5 |
| V3-22 | V3-17, V3-19, V3-20 | — |
| V3-23 | V3-14 | D8 (partial) |
| V3-24 | V3-12 | D6 |
| V3-25 | V3-12 | — |
| V3-26 | V3-12 | D3 |
| V3-27 | V3-26, V3-17 | D4 |
| V3-28 | V3-26, V3-27 | — |
| V3-29 | V3-28 | — |
| V3-30 | V3-28 | — |
| V3-31 | V3-28 | — |
| V3-32 | V3-28 | — |
| V3-33 | V3-26, V3-27 | — |
| V3-34 | V3-12, V3-26 | — |
| V3-35 | V3-34 | — |
| V3-36 | V3-34, V3-26 | — |
| V3-37 | V3-34 | — |
| V3-38 | V3-34 | — |
| V3-39 | V3-34 | — |
| V3-40 | V3-26 | — |
| V3-41 | V3-26 | — |
| V3-42 | V3-40, V3-41 | — |
| V3-43 | V3-10 | — |
| V3-44 | V3-43 | — |
| V3-45 | V3-43, V3-37 | — |
| V3-46 | V3-43 | — |
| V3-47 | V3-43, V3-44 | — |
| V3-48 | V3-43, V3-35 | — |
| V3-49 | V3-12 | — |
| V3-50 | V3-49, V3-24 | — |
| V3-51 | V3-49, V3-50 | — |
| V3-52 | V3-12 | — |
| V3-53 | V3-12 | — |
| V3-54 | V3-12 | — |
| V3-55 | V3-12 | — |
| V3-56 | V3-12 | — |
| V3-57 | V3-12 | — |
| V3-58 | V3-56, V3-57 | — |
| V3-59 | V3-28 | — |
| V3-60 | V3-12 | — |
| V3-61 | V3-48 | — |
| V3-62 | V3-35 | — |
| V3-63 | V3-49, V3-50, V3-38 | — |
| V3-64 | V3-12 | — |
| V3-65 | V3-13, V3-17, V3-24 | D2 |
| V3-66 | V3-65 | D2 |
| V3-67 | V3-50, V3-24 | — |
| V3-68 | V3-67 | — |
| V3-69 | V3-67, V3-14, V3-15, V3-16 | — |
| V3-70 | V3-57 | — |
| V3-71 | V3-57, V3-58 | — |
| V3-72 | V3-50, V3-57 | — |
| V3-73 | V3-57 | — |
| V3-74 | V3-57, V3-64 | — |
| V3-75 | V3-18, V3-57 | — |
| V3-76 | V3-02 | — |
| V3-77 | V3-76, V3-71 | — |
| V3-78 | V3-76, V3-74 | — |
| V3-79 | V3-76, V3-51 | — |
| V3-80 | V3-76, V3-75 | — |
| V3-81 | V3-76 | — |
| V3-82 | V3-90 | — |
| V3-83 | V3-77, V3-78, V3-79, V3-80 | — |
| V3-84 | V3-12, V3-21 | D10 |
| V3-85 | V3-13, V3-84 | — |
| V3-86 | V3-12 | D8 |
| V3-87 | V3-86, V3-03, V3-04 | — |
| V3-88 | V3-87, V3-23 | — |
| V3-89 | V3-10 | — |
| V3-90 | V3-43 | — |
| V3-91 | V3-90 | — |
| V3-92 | V3-90 | — |
| V3-93 | V3-24, V3-90 | — |
| V3-94 | V3-13..V3-93 | — |
| V3-95 | V3-94 | **D18 (W1 multi-currency close-blocker)** |
| V3-96 | V3-95 | **D18 (W1 multi-currency close-blocker)** |

> ### ⚠️ Closure is gated on W1 — international multi-currency
> **V3-95 (launch-readiness) and V3-96 (showcase) CANNOT close until W1 (international multi-currency) is done** — the owner's hard rule: customers worldwide see prices, pay, and get paid in their own currency. Launch NGN-first, but do not declare V3 "finished" without it. W1 spans passes V3-14, V3-16, V3-21, V3-69, V3-84, V3-85 **plus** the non-code banking/regulatory buildout (`L19`/`L20` — forex accounts, cross-border licensing, per-market tax registration; longest lead time — start early). This edge is NOT a numbered-pass dependency, so it does not appear as a row above; it is a **close-blocker gate** recorded via `D18`. Full record: `DEFERRED-STRATEGIC-WORKSTREAMS.md` §W1.

---

## Section B — pass → unblocks

| Pass closes | Unblocks |
|---|---|
| V3-01 | V3-02 |
| V3-02 | V3-04, V3-76 |
| V3-03 | V3-08, V3-87 |
| V3-04 | V3-11, V3-87 |
| V3-05 | V3-06 |
| V3-06 | — |
| V3-07 | — |
| V3-08 | — |
| V3-09 | — |
| V3-10 | V3-43, V3-89 |
| V3-11 | (contributes to V3-12) |
| V3-12 | V3-13, V3-24, V3-25, V3-26, V3-34, V3-49, V3-52, V3-53, V3-54, V3-55, V3-56, V3-57, V3-60, V3-64, V3-84, V3-86 |
| V3-13 | V3-14, V3-15, V3-16, V3-17, V3-19, V3-20, V3-21, V3-65, V3-85 |
| V3-14 | V3-19, V3-23, V3-69 |
| V3-15 | V3-19, V3-69 |
| V3-16 | V3-19, V3-69 |
| V3-17 | V3-18, V3-19, V3-20, V3-21, V3-22, V3-27, V3-65 |
| V3-18 | V3-75 |
| V3-19 | V3-22 |
| V3-20 | V3-22 |
| V3-21 | V3-84 |
| V3-22 | — |
| V3-23 | V3-88 |
| V3-24 | V3-50, V3-65, V3-67, V3-93 |
| V3-25 | — |
| V3-26 | V3-27, V3-28, V3-33, V3-34, V3-36, V3-40, V3-41 |
| V3-27 | V3-28, V3-33 |
| V3-28 | V3-29, V3-30, V3-31, V3-32, V3-59 |
| V3-29 | — |
| V3-30 | — |
| V3-31 | — |
| V3-32 | — |
| V3-33 | — |
| V3-34 | V3-35, V3-36, V3-37, V3-38, V3-39 |
| V3-35 | V3-48, V3-62 |
| V3-36 | — |
| V3-37 | V3-45 |
| V3-38 | V3-63 |
| V3-39 | — |
| V3-40 | V3-42 |
| V3-41 | V3-42 |
| V3-42 | — |
| V3-43 | V3-44, V3-45, V3-46, V3-47, V3-48, V3-90 |
| V3-44 | V3-47 |
| V3-45 | — |
| V3-46 | — |
| V3-47 | — |
| V3-48 | V3-61 |
| V3-49 | V3-50, V3-51, V3-63 |
| V3-50 | V3-51, V3-63, V3-67, V3-72 |
| V3-51 | V3-79 |
| V3-52 | — |
| V3-53 | — |
| V3-54 | — |
| V3-55 | — |
| V3-56 | V3-58 |
| V3-57 | V3-58, V3-70, V3-71, V3-72, V3-73, V3-74, V3-75, V3-80 |
| V3-58 | V3-71 |
| V3-59 | — |
| V3-60 | — |
| V3-61 | — |
| V3-62 | — |
| V3-63 | — |
| V3-64 | V3-74, V3-78 |
| V3-65 | V3-66 |
| V3-66 | — |
| V3-67 | V3-68, V3-69 |
| V3-68 | — |
| V3-69 | — |
| V3-70 | — |
| V3-71 | V3-77 |
| V3-72 | — |
| V3-73 | — |
| V3-74 | V3-78 |
| V3-75 | V3-80 |
| V3-76 | V3-77, V3-78, V3-79, V3-80, V3-81 |
| V3-77 | V3-83 |
| V3-78 | V3-83 |
| V3-79 | V3-83 |
| V3-80 | V3-83 |
| V3-81 | — |
| V3-82 | — |
| V3-83 | — |
| V3-84 | V3-85 |
| V3-85 | — |
| V3-86 | V3-87 |
| V3-87 | V3-88 |
| V3-88 | — |
| V3-89 | — |
| V3-90 | V3-82, V3-91, V3-92, V3-93 |
| V3-91 | — |
| V3-92 | — |
| V3-93 | — |
| V3-94 | V3-95 |
| V3-95 | V3-96 |
| V3-96 | (end) |

---

## High-leverage passes (highest unblock count)

These passes, once closed, unblock many siblings. Prioritize their quality + speed.

1. **V3-12 (Foundation Lock acceptance)** — unblocks 16 passes (every Phase C+ kickoff)
2. **V3-26 (AI provider router)** — unblocks 7 passes (every AI surface + predictive)
3. **V3-13 (Payment provider router)** — unblocks 9 passes (every payment integration)
4. **V3-17 (Ledger hardening)** — unblocks 7 passes (every payment-touching pass)
5. **V3-57 (Business profiles + tools)** — unblocks 8 passes (every enterprise + business-account API)
6. **V3-43 (Workflow engine)** — unblocks 6 passes (every automation pass + observability data lake)
7. **V3-76 (Public API foundation)** — unblocks 5 passes (every API surface)
8. **V3-90 (Data lake + event tracking)** — unblocks 4 passes (analytics + A/B + backup + privacy)
9. **V3-28 (HenryCo Intelligence chat surface)** — unblocks 5 passes (every assist surface + concierge)
10. **V3-34 (Personalized home)** — unblocks 5 passes (every personalization fan-out)

---

## Risk-class flag (M=money, I=identity, C=compliance)

Passes with risk-class M/I/C are higher-stakes and need extra review. Reading by risk:

- **M-only:** V3-22
- **I-only:** V3-01, V3-02, V3-76
- **C-only:** V3-25, V3-53, V3-84, V3-88, V3-92, V3-93
- **M + I:** V3-26, V3-27 (well, V3-27 is M+I via wallet check)
- **I + C:** V3-24, V3-40, V3-50, V3-67
- **M + I + C:** V3-65, V3-66 (gaming)
- **M + C:** V3-21, V3-69, V3-75, V3-85, V3-94, V3-95

---

## Dependency cycles

None. The graph is a DAG by construction. Verify after any edge addition.

---

## Owner-decision short-circuit map

If owner answers all 11 hard-gated decisions today, the following passes become startable immediately after Phase B closes:

- **D1 answered:** V3-14, V3-15, V3-16 unblocked (waiting on V3-13)
- **D2 answered:** V3-65, V3-66 unblocked (waiting on Phase C prerequisites)
- **D3 answered:** V3-26 unblocked
- **D4 answered:** V3-27 unblocked (waiting on V3-26)
- **D5 answered:** V3-21 unblocked (waiting on V3-13, V3-17)
- **D6 answered:** V3-24 unblocked
- **D8 answered:** V3-86 unblocked
- **D9 answered:** V3-20 partially unblocked
- **D10 answered:** V3-84 unblocked (waiting on V3-21)
- **D11 answered (YES):** V3-13 unblocked → Phase C cascade
- **D12 answered:** ANTI-CLONE.md application becomes prescriptive

**Plus three closure / deferred-workstream gates (NOT Phase-B-start) — recorded in `DEFERRED-STRATEGIC-WORKSTREAMS.md`:**

- **D18 answered:** ratifies W1 international multi-currency → **gates V3-95 + V3-96 CLOSE** (V3 cannot close without it; start `L19`/`L20` banking/licensing early — long lead).
- **D19 answered:** authorizes W2 Flutterwave payouts (sequenced after division checkout is live; advances V3-69).
- **D20 answered:** authorizes W3 owner's personal AI portal (Phase D+; reuses V3-26).

---

## Self-verification

- [x] All 96 passes appear in Section A
- [x] All 96 passes appear in Section B
- [x] No cycles (DAG)
- [x] Owner decisions cross-referenced
- [x] Closure gate D18 (W1 multi-currency close-blocker) recorded on V3-95/V3-96 + the deferred-workstream gates D18–D20 mapped (see DEFERRED-STRATEGIC-WORKSTREAMS.md)
- [x] High-leverage passes ranked by unblock count
- [x] Risk-class flagged per pass
