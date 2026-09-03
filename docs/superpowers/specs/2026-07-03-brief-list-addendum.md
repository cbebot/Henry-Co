# Addendum — multi-brief copilot, honest AI, cost rules (2026-07-03)

Extends `2026-07-02-chat-thread-design.md` after owner feedback on PR #370.

## 1. Composer blink (bug)

`ChatComposer`'s draft-persist effect depended on the hook's result object
(fresh identity per render) while `persist()` re-renders through its own
state cycle — an infinite `dirty → saving → saved → idle` loop that pulsed
the draft pill and jittered the Send/Discard row on every surface. Fixed by
depending on the stable `persist` callback. (Pre-existing engine bug, newly
prominent on the full-viewport chat.)

## 2. Briefs as conversations (feature)

The copilot becomes a WhatsApp-style thread manager, all client-side (the
surface is anonymous/public):

- **Store**: one draft envelope `studio-copilot-chats` v1 —
  `{ conversations: StoredBriefChat[], activeId }`;
  `StoredBriefChat = { id, title, messages, createdAt, updatedAt, ready,
  progress, finalizedAt }`. Pure module `brief-conversations.ts` (TDD, 9
  tests): create (reuses an empty active thread so "new" can't farm empties),
  update (title re-derives), delete (repoints active), sort by `updatedAt`,
  prune at 30, one-time migration from the legacy single-transcript key.
- **Title = the brief itself**: first user message, whitespace-collapsed,
  clamped at 60 chars.
- **UI**: the chat header gains a briefs-list action (count badge) and a
  New-brief action. The list view lives inside the same fixed stage: compact
  bar (back → `/request`, "Your briefs", New brief), scrollable rows
  (title / latest line / date / progress % or **Ready** / **Brief built**
  badge / delete), empty state, escape-hatch footer ("Build it yourself →").
  Back from chat goes to the list when briefs exist, else `/request`.
- **Ready semantics**: per-conversation `ready`/`progress` persist. The
  1.4s auto-handoff fires only on a ready transition in the live session;
  reopening an already-ready brief shows "This brief is ready." + the manual
  Build-my-brief chip (composer stays locked).

## 3. Real AI, never fake (verification)

Post-#369 the engine is model-only: every turn goes through the governed
gateway; refusals return calm honest copy (offline / daily limit / didn't
come through) — no scripted coach exists in the codebase. This pass keeps
that guarantee visible per message: a refused turn stays on the user's
bubble with the honest reason and inline retry. Deploy note: the gateway
needs its provider env live in production — "never fake" means an honest
"offline right now" when it isn't.

## 4. Cost rules (anti-abuse), coach lane

No canned fallback means rules do all the limiting:

| Guard | Value | Defeats |
|---|---|---|
| Turn ceiling / conversation | 12 (existing) | endless chats |
| Message cap | 1200 chars (existing) | payload stuffing |
| Gateway allowance / session / day | 60 calls (existing) | casual overuse |
| **Burst brake / session** | **8 turns / minute** | loops, scripts |
| **Per-IP backstop / day** | **150 turns** (salted `ip_hash`) | cookie-clear session rotation |
| **System ceiling / day** | **4000 turns** | runaway spend |

Accounting rows: `studio_brief_drafts`, intent `studio_brief_chat`, **no
transcript content** (salted hashes + status + duration). Counters fail
open — the gateway allowance still binds. The one-shot lane's counters are
now intent-scoped so the two lanes never cross-count. Multi-brief changes
nothing materially: N conversations still share the same session/IP/system
budgets.
