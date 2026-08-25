# LOT C-2 — CLÔTURE DE SÉCURITÉ (CLOSED / FROZEN)

**Date de gel :** 2026-08-25 · **Statut :** 🟢 CLOSED / FROZEN
**Base de référence validée.** Toute évolution ultérieure exige l'ouverture d'un nouveau lot
(snapshot → périmètre → migration → tests → rollback → audit post-migration).

---

## 1. Objectif C-2

Supprimer l'authentification métier par `package_code` seul. Avant C-2, la connaissance d'un
code de pack (chaîne devinable, transmise par e-mail, présente dans des URL) donnait un accès
complet au portefeuille client : identité, e-mail, historique, crédits, réservation et
annulation. C-2 introduit un second facteur e-mail (OTP) et un modèle de session opaque
côté serveur.

## 2. Architecture finale

```text
package_code
  -> request_otp(p_code)              (rate-limits IP + code_hash + OTP)
  -> OTP 6 chiffres par e-mail        (CSPRNG, haché, TTL 10 min, 5 essais)
  -> verify_otp(p_code, p_otp)        (anti-replay, consommation unique)
  -> jeton de session opaque 32 o     (hex, stocké haché uniquement)
  -> validate_otp_session(token)      (TTL glissant 30 min / absolu 4 h)
  -> package_id résolu SERVEUR
  -> RPC métier *_by_session / *_with_session
```

Règle figée : **le `package_code` n'est plus une authentification métier.** Il n'est qu'un
identifiant d'entrée du premier facteur.

## 3. Sous-lots

| Sous-lot | Contenu |
|---|---|
| C-2 Phase 1 | Journalisation `code_access_attempts`, pepper `code_access_secret`, guard anti-énumération, réponses uniformes |
| C-2.2-A | Colmatage de l'oracle `get_credit_reminders` / `set_credit_reminders` (GAP-4) |
| C-2.2-B | Second axe de rate-limit par `code_hash` (anti-rotation d'IP) |
| C-2.2-C | Socle OTP : `otp_challenges`, `otp_sessions`, génération CSPRNG, hachage, RLS |
| C-2.2-D | Flux OTP complet, 8 RPC `*_by_session`, suppression des RPC `*_with_code`, frontend |
| C-2.2-D-FIX | Caviardage des OTP dans la DLQ + rollback dédié |
| F1 / F2 / F4 | Bypass stage, bypass préférences marketing, durcissement GRANTs DLQ |

## 4. Vulnérabilités initiales

1. **P0 — Énumération et exposition de données via `package_code`** : toutes les RPC clientes
   (`get_wallet_by_code`, `get_package_by_code`, `book_daily_with_code`, …) exposaient PII et
   opérations métier sans second facteur ni limitation.
2. **P0 — Oracle de validité** : `get_credit_reminders` distinguait code valide / invalide.
3. **P0 — Bypass stage** : `book_stage_100_glisse(p_code, …)` réservait 5 jours avec le seul code.
4. **P0 — Bypass marketing** : `get_marketing_preferences` / `save_marketing_preferences`
   acceptaient `p_code` et retournaient / modifiaient des données liées à l'e-mail client.
5. **P1 — DLQ** : OTP conservés en clair dans les payloads en file d'échec (7 jours) ;
   `retry_dlq_messages` / `run_dlq_retry_cycle` exécutables publiquement.

## 5. Correctifs appliqués

- Guard `code_access_guard` + journal `code_access_attempts` (aucune PII, hachages peppered).
- Réponses uniformes (`NULL`, `[]`, objets par défaut) : plus aucun oracle valide/invalide.
- Socle OTP + sessions opaques, RPC métier réécrites en `*_by_session` / `*_with_session`.
- Suppression physique des 8 RPC `*_with_code` / `*_by_code` et de `book_stage_100_glisse`.
- Façades stage et marketing adossées à `validate_otp_session`, fonctions internes
  (`book_stage_for_package`, `resolve_marketing_email`) sans `EXECUTE` public.
- Caviardage OTP dans `move_to_dlq` + interdiction de rejeu automatique.
- `REVOKE` des fonctions de maintenance DLQ vers `service_role` uniquement.

## 6. Rate-limits (vérifiés en lecture)

| Axe | Seuil | Fenêtre | Portée |
|---|---|---|---|
| IP — codes distincts | 10 | 10 min | `code_access_guard` |
| IP — échecs totaux | 60 | 10 min | `code_access_guard` |
| `code_hash` — échecs | 30 | 1 h | toutes IP confondues (C-2.2-B) |
| OTP — demandes par IP | plafonné | 15 min | `request_otp` |

Verrous `pg_advisory_xact_lock` sur l'IP et le code : pas de course sur les compteurs.

## 7. OTP

- 6 chiffres, CSPRNG (`otp_generate_code`), **jamais stocké en clair** :
  `code_access_hash('otp:' || code)`.
- TTL 10 minutes (`expires_at`), invalidation des challenges antérieurs à chaque demande.
- **5 tentatives maximum** (`attempt_count < 5`), incrément atomique.
- Anti-replay : `consumed_at` positionné en une seule instruction conditionnelle.
- Jamais journalisé, jamais renvoyé au client, caviardé en DLQ.

## 8. Sessions

- Jeton = 32 octets `gen_random_bytes` encodés hex ; **seul le hash est persisté**.
- TTL glissant : `last_seen_at > now() - interval '30 minutes'`.
- TTL absolu : `absolute_expires_at = now() + interval '4 hours'`.
- Révocation serveur : `revoke_otp_session(token)`.
- Stockage navigateur : `sessionStorage` uniquement (`kp_espace_session`).
  Aucun jeton en URL, localStorage, cookie, analytics ou `console.log`.

## 9. Protection des RPC

Toutes les RPC métier client sont désormais `*_by_session` / `*_with_session` et démarrent par
`validate_otp_session`. Retour uniforme en cas d'échec : `session_invalid` / valeur vide.
`admin_get_wallet_by_code` reste la seule RPC par code : **non exposée à `anon`**, réservée aux
administrateurs (contrôle `has_role`).

## 10. Protection Stage

`book_stage_100_glisse` supprimée. `book_stage_with_session(p_session_token, p_start_date)`
valide la session puis délègue à `book_stage_for_package(uuid, date)`, interne
(`EXECUTE` refusé à `anon` / `authenticated`).

## 11. Protection Marketing

`get_marketing_preferences` / `save_marketing_preferences` n'acceptent plus que le token
d'e-mail (`uuid`, non devinable, lié à l'abonnement). Variantes `*_by_session` pour l'espace
client. `resolve_marketing_email` est interne. Aucun lien e-mail ne transporte de `package_code`.

## 12. Protection DLQ

- `move_to_dlq` caviarde les payloads OTP (`dlq_redacted = true`) et bloque leur rejeu.
- `retry_dlq_messages` et `run_dlq_retry_cycle` : `EXECUTE` retiré à `PUBLIC` / `anon` /
  `authenticated`, conservé pour `service_role`.

## 13. Preuves — API publique, clé anon

| # | Appel | Résultat observé |
|---|---|---|
| A | `book_stage_100_glisse` | **404 PGRST202** — RPC supprimée |
| B | `book_stage_with_session` (token vide / invalide) | `{"ok":false,"error":"session_invalid"}` |
| C | `get_marketing_preferences` ancienne signature (`p_code`) | **404 PGRST202** |
| D | `save_marketing_preferences` ancienne signature (`p_code`) | **404 PGRST202** |
| E | RPC `*_by_session` avec token invalide | `session_invalid`, **aucune PII** |
| F | `retry_dlq_messages` / `run_dlq_retry_cycle` | **401 permission denied** |
| G | `book_stage_for_package` / `resolve_marketing_email` | **401 permission denied** |

Tests exécutés via `POST /rest/v1/rpc/...` avec la clé anon publique.

## 14. Tests

- Transactionnels SQL : rate-limits (axes IP et `code_hash`), 5 essais OTP, anti-replay,
  expiration, caviardage DLQ — tous exécutés en `ROLLBACK`, Δ métier = 0.
- Contrats Deno / Playwright : idempotence Stripe, file e-mail, parcours OTP.
- Audit catalogue : inventaire complet des fonctions `EXECUTE anon`.

## 15. Non-régressions

**Snapshot métier (attendu = observé, Δ = 0)**

| Objet | Valeur |
|---|---|
| `client_packages` | 83 |
| `package_bookings` | 70 |
| `session_credits` | 192 (106 available / 62 consumed / 24 expired) |
| `package_credit_history` | 116 |
| `credit_audit_log` | 97 |
| `credit_reminder_preferences` | 3 |
| `code_access_attempts` | 124 |
| `email_send_log` | 1167 |
| `otp_challenges` / `otp_sessions` | 0 / 0 |
| Backlog crédits expirables | 0 |
| Doublons de recrédit | 0 |

**C-1** — `ux_pch_recredit_once` présent ; `admin_recredit_package` à 5 paramètres
(`p_package_id, p_sessions, p_reason, p_notify, p_booking_id`) ; `restore_credit_fifo` et
`consume_credit_fifo` inchangées ; wallet / ledger / FIFO intacts.

**C-3 / C-3b** — backlog = 0, `expired` = 24, `admin_platform_health` intacte, aucune fonction
de maintenance modifiée par C-2. Lecture de `cron.job` : **NON TESTABLE AVEC LE RÔLE D'AUDIT —
déjà validé lors de C-3b.**

## 16. Rollbacks (présents, non exécutés)

| Fichier | Périmètre |
|---|---|
| `C2_phase1_rollback.sql` | Journalisation + guard |
| `C2_2A_rollback.sql` | Credit reminders |
| `C2_2B_rollback.sql` | Axe rate-limit `code_hash` |
| `C2_2C_rollback.sql` | Socle OTP |
| `C2_2D_rollback.sql` | **FIX DLQ uniquement** (`move_to_dlq`) — n'est pas le rollback complet de D |
| `C2_2D_rollback_full.sql` | Rollback complet de C-2.2-D (9 RPC par code restaurées, GRANTs, suppression des RPC session) |
| `C2_2E_rollback.sql` | Phase corrective finale F1 / F2 / F4 |

Ordre si cumul : `C2_2E_rollback.sql` puis `C2_2D_rollback_full.sql`.
Chaque fichier porte un avertissement : le rollback **réintroduit volontairement** le risque.

## 17. Risques résiduels — hors périmètre C-2

**FOLLOW-UP 1 — Hook admin `useCredits().useWallet` (gravité : faible)**
`src/hooks/services/useCredits.ts` appelle `admin_get_wallet_by_code`, RPC admin réservée aux
utilisateurs `authenticated` avec rôle. Aucun usage actuel dans l'UI, aucun accès anon possible.
*Recommandation :* nettoyage du code mort. *Lot suggéré :* lot qualité front.

**FOLLOW-UP 2 — RPC publiques à token UUID hors C-2 (gravité : faible)**
`confirm_waitlist_offer`, `get_waitlist_offer`, `confirm_last_minute_subscription`,
`unsubscribe_last_minute`, `book_daily_visitor` acceptent des tokens UUID ou des données
visiteur sans rate-limit dédié. Périmètre fonctionnel distinct (liste d'attente / newsletter /
réservation visiteur), aucune exposition de portefeuille client.
*Recommandation :* audit dédié des parcours tokenisés publics. *Lot suggéré :* lot D (parcours publics).

Ces écarts sont **hors périmètre C-2** et ne rouvrent pas le lot.

## 18. Verdict final

**🟢 GO — C-2 CLOSED / FROZEN**

Aucune anomalie critique ou haute du périmètre C-2. TypeScript : 0 erreur.
Ce document constitue la base de référence de sécurité de la plateforme.
