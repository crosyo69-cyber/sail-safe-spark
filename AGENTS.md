# Technical decisions

- client_packages uniqueness: one package per Stripe session when participant_index is NULL, and one per (stripe_session_id, participant_index) when set (1..4) — keeps webhook double-delivery protection (P0-2) while allowing one package per participant for multi-participant stages.
- Stage 100% Glisse Stripe payments go only through stripe-webhook/stage.ts: amount_total must equal 250 € × participants, then a single book_stage_for_participants call; any mismatch or failure creates no booking and alerts the admin — keeps payments atomic and amounts truthful.
- Stage 100% Glisse checkout uses a dedicated per-participant Stripe price (quantity = participants, strictly 1..4); other activities keep the 50 € deposit price × sessions — the checkout amount must match what the webhook expects.
