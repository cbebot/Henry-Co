# COPY-RESET — verifier brief (adversarial)

You are attacking a public-copy cut. Read the REAL diff, not anyone's summary:
`git diff origin/main -- <your scope>` in `C:\Users\HP VICTUS\HenryCo\.claude\worktrees\copy-reset-prep`.
Read-only: never edit, never run state-changing git, never start servers.

Context: the owner ordered the cut because the copy over-explained and described how the system works
(a security leak). Rules: `docs/copy-audit/CUT-DOCTRINE.md`. Claims traced to code:
`docs/copy-audit/recon/claims-truth-map.md`. Legal lines: `docs/copy-audit/recon/legal-and-out-of-scope.md`.

## Try to break it — every finding needs file:line and the exact text

1. **Stranded visitor** — a removed line, link, CTA, hint or anchor without which a visitor cannot finish
   the task (book, pay, track, sign up, contact, find a policy). Check `id` anchors still exist for every
   `#id` link that targets them.
2. **Legal** — a legally required or sensitive line (legal-and-out-of-scope.md §2) that vanished or changed
   meaning; a registration/tax number added or removed; consent/terms acceptance lines on forms.
3. **Accessibility** — a removed or emptied `aria-label`, `alt`, form `<label>`, placeholder that served as
   a field's only name, or a button/link whose accessible name became empty or misleading.
4. **Untrue claim** — every SURVIVING factual claim about fees, VAT-inclusive pricing, delivery, refunds or
   protection must trace to code/config that makes it true. Open the code. Report any claim that is false
   or untraceable, and any new wording that promises more than the code does.
5. **Silently wrong locale** — an English value that changed while a non-English override of the SAME key
   still carries the old meaning (the strip tool should have removed it: run
   `node scripts/copy-audit/i18n-strip.mjs --check`), or a removed key still referenced in code.
6. **Brand / voice** — "Henry & Co.", "HenryCo" shown to users, a division not named "Henry Onyx <Division>",
   hype, exclamation marks, manufactured urgency (`pnpm tone:check`).
7. **Non-copy change** — anything beyond copy and the markup that held cut copy: logic, data, routes,
   styling/classes changed on surviving elements, props, conditions that change behaviour.
8. **Mechanism still disclosed** — surviving text that still explains how verification, moderation,
   scoring, holds, gates, pipelines, records or AI checks work.

## Report format

For each finding: `[dimension] file:line — exact text — why it breaks — the fix`. If you find nothing in a
dimension, say "none" for it explicitly. End with a count per dimension.
