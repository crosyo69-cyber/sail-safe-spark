# F-13 — E2E Authorization & IDOR Regression Suite

Suite de non-régression d'autorisation **strictement read-only**. Aucun test de
cette suite n'écrit en base : uniquement `GET` PostgREST et RPC read-only.

## Fichiers

| Fichier | Périmètre |
| --- | --- |
| `fixtures/authorization.ts` | contextes HTTP ANON / USER_A / ADMIN, helpers de lecture |
| `authorization-anon.spec.ts` | tables sensibles, oracle `has_role`, surfaces publiques |
| `authorization-user.spec.ts` | accès légitimes de USER_A (autorisation ≠ jeu vide) |
| `authorization-idor.spec.ts` | IDOR USER_A → USER_B (user_id, e-mail, tables admin) |
| `authorization-admin-boundary.spec.ts` | RPC admin : refus ANON/USER_A, accès ADMIN |
| `authorization-public-rpc.spec.ts` | RPC `SECURITY DEFINER` publiques, tokens invalides |

## Variables d'environnement

```bash
E2E_SUPABASE_URL=...            # défaut : URL du projet
E2E_SUPABASE_ANON_KEY=...       # clé publishable (obligatoire)
E2E_USER_A_TOKEN=...            # access_token compte standard
E2E_ADMIN_TOKEN=...             # access_token compte administrateur
E2E_USER_A_ID=... E2E_USER_B_ID=...
```

Sans token, les specs concernées sont `skip` — jamais converties en PASS.

## Exécution

```bash
npx playwright test e2e/security/
```

## Hors périmètre — BLOCKED, WRITE REQUIRED

À traiter dans un lot dédié avec GO explicite (ces scénarios nécessitent des
écritures : OTP, tokens, crédits, réservations, e-mails, rate-limit) :

- `request_otp` / `verify_otp` : uniformité des réponses, anti-énumération.
- Cycle de vie d'un token de session client (valide → expiré → révoqué).
- `join_waitlist`, `save_marketing_preferences*` : validation et rate-limit.
- `book_*` / `cancel_*` : consommation et recrédit FIFO.
- Rate-limiting effectif des Edge Functions publiques.
- Escalade de privilèges par écriture sur `user_roles`.

---

## F-13 PHASE 2 — WRITE controlled

Fichiers : `authorization-write.spec.ts`, `fixtures/write-guard.ts`.

### Environnement d'exécution

Aucun projet de staging ni backend jetable n'existe : le seul backend est la
production. Les tests WRITE sont donc **SKIP par défaut** et exigent un opt-in
explicite sur un backend jetable :

```bash
E2E_ALLOW_WRITE=1 E2E_WRITE_TARGET=disposable \
E2E_USER_A_TOKEN=... npx playwright test e2e/security/authorization-write.spec.ts
```

### Périmètre autorisé

Uniquement des mutations **attendues comme refusées** (ANON, USER_A hors droits).
Aucune fixture n'est créée ⇒ aucun rollback nécessaire : si la frontière tient,
rien n'est persisté. Une mutation réussie fait échouer le test (STOP).

| ID | Surface | Mutation | Fixture requise | Rollback | Statut |
| --- | --- | --- | --- | --- | --- |
| F-13-W01 | `user_roles` | INSERT/UPDATE `role=admin` par USER_A | aucune | n/a | implémenté (gated) |
| F-13-W02 | `client_packages` | UPDATE/DELETE fixture USER_B | aucune | n/a | implémenté (gated) |
| F-13-W03 | `session_credits` | UPDATE/DELETE crédit d'autrui | aucune | n/a | implémenté (gated) |
| F-13-W04 | `reservations` | UPDATE/DELETE réservation USER_B | aucune | n/a | implémenté (gated) |
| F-13-W05 | `crm_client_profiles` | UPDATE/DELETE fiche CRM d'autrui | aucune | n/a | implémenté (gated) |
| F-13-W06 | RPC admin mutatives | `admin_adjust_package_credits`, `admin_recredit_package`, `admin_cancel_and_recredit` | aucune | n/a | implémenté (gated) |

### Toujours BLOCKED — SAFE WRITE ENVIRONMENT REQUIRED

Ces scénarios exigent la création de données réelles (OTP, tokens, crédits,
réservations, e-mails) et ne peuvent pas être exécutés en production :

- `verify_otp` : uniformité des réponses / anti-énumération (fixture challenge OTP).
- Cycle de vie d'un token de session client (valide → expiré → révoqué).
- `join_waitlist`, `save_marketing_preferences*` : validation et rate-limit.
- `book_*` / `cancel_*` : consommation et recrédit FIFO.
- Rate-limiting effectif des Edge Functions publiques.
- Exécution positive des RPC admin mutatives avec ADMIN.
