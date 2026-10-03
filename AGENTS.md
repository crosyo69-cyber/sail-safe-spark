# Technical decisions

- client_packages uniqueness: one package per Stripe session when participant_index is NULL, and one per (stripe_session_id, participant_index) when set (1..4) — keeps webhook double-delivery protection (P0-2) while allowing one package per participant for multi-participant stages.
