-- F-01 (OPTIONAL hardening option) — The primary F-01 fix is app-layer: require auth +
-- ownership on /track and /pay and stop rendering buyer_email + proof_url to anonymous
-- viewers. IF a public, shareable tracking link must remain, replace the guessable
-- order_no (MKT-ORD-YYYYMMDD-100..999, 900/day, brute-forceable) in the URL with an
-- unguessable token and look up by token instead of order_no.

alter table public.marketplace_orders
  add column if not exists public_token uuid not null default gen_random_uuid();

create unique index if not exists marketplace_orders_public_token_idx
  on public.marketplace_orders (public_token);

-- App change required: /track and /pay take the token, getOrderByNumber -> getOrderByToken
-- (eq("public_token", token)); the placement redirect uses the token, not order_no.
-- Even with a token, do NOT render proof_url / buyer_email unless the viewer is the owner;
-- serve proof documents via a short-lived signed URL scoped to the owner.
