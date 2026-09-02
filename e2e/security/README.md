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
