# LOT 0 — Stabilisation de la plateforme

Date : 31/07/2026 — Aucune évolution fonctionnelle, aucun changement visible utilisateur.

## 1. Saturation des journaux cron (résolu)

### Rapport d'analyse (avant intervention)
| Mesure | Valeur |
|---|---|
| Taille `cron.job_run_details` | **7 220 Mo** |
| Nombre d'exécutions journalisées | **1 924 143** |
| Historique | 13/03/2026 → 31/07/2026 (140 jours) |
| Croissance moyenne | ~13 700 lignes/jour, ~51 Mo/jour (~360 Mo/semaine) |
| Taille moyenne d'une ligne | ~3,9 Ko |
| Cadence actuelle réelle | ~20 exécutions/heure (480/jour) |
| Job le plus consommateur | historique : ancien dispatch email toutes les 5 s (désormais événementiel). Actuel : `dispatch-admin-alerts-every-5min` (288/j) |
| Historique réellement utile | 7 jours de succès + 30 jours d'erreurs |

Le volume était **historique** : l'ancien worker email tournait toutes les 5 secondes. La cadence actuelle est faible, le risque venait donc uniquement de l'absence de purge.

### Correctifs appliqués
- Purge initiale par reconstruction (`TRUNCATE` + réinsertion des lignes à conserver) → restitution disque immédiate.
- Fonction `public.purge_cron_run_details(success_days=7, error_days=30)` (SECURITY DEFINER, `EXECUTE` réservé à `service_role`).
- Job `purge-cron-run-details-daily` (`25 3 * * *`).

### Résultat
| | Avant | Après |
|---|---|---|
| Taille | 7 220 Mo | **1,9 Mo** |
| Lignes | 1 924 143 | **3 528** |

Projection à l'équilibre : ~4 000 lignes / ~15 Mo maximum. Risque de saturation supprimé.

### Rollback
`SELECT cron.unschedule('purge-cron-run-details-daily'); DROP FUNCTION public.purge_cron_run_details(int,int);`
(l'historique purgé n'est restaurable que via une sauvegarde PITR antérieure au 31/07/2026 12h30 UTC).

## 2. Sécurité des SECURITY DEFINER critiques

| Fonction | Usage réel | Action |
|---|---|---|
| `enqueue_booking_confirmation(uuid)` | appelée uniquement par `book_session_with_code` / triggers | `REVOKE EXECUTE` anon + authenticated |
| `enqueue_low_credit_warning(uuid)` | appelée par la maintenance crédits | `REVOKE EXECUTE` anon + authenticated |
| `enqueue_day_cancelled_notification(...)` | appelée par l'annulation de journée (admin RPC) | `REVOKE EXECUTE` anon + authenticated |
| `enqueue_reschedule_notification(...)` | appelée par le report de journée | `REVOKE EXECUTE` anon + authenticated |
| `get_marketing_segment(jsonb,int)` | UI admin (SegmentBuilder) — déjà protégée par `marketing_is_internal_caller()` | `REVOKE` anon ; `authenticated` conservé (nécessaire à l'UI admin) |
| `marketing_segment_estimate(jsonb)` | idem | idem |
| `marketing_segment_base()` | interne uniquement | `REVOKE` anon + authenticated (déjà `service_role` seul) |

Vérification d'absence de régression : aucun appel `rpc('enqueue_*')` dans `src/` ni dans les Edge Functions (recherche exhaustive) — uniquement des `PERFORM` internes exécutés en contexte SECURITY DEFINER.

### Rollback
`GRANT EXECUTE ON FUNCTION public.<fonction> TO authenticated, anon;`

## 3. Migration des derniers secrets

JWT `service_role` en clair trouvés dans 5 jobs : `weather-alerts-hourly` (8), `weekly-summary-email` (9), `cleanup-404-logs-weekly` (10), `send-package-reminders-daily` (11), `resubmit-sitemap-gsc-daily` (12).

- Helper commun `public.cron_invoke_edge_function(nom, body)` : lit la clé dans `vault.decrypted_secrets` (`email_queue_service_role_key`), `EXECUTE` réservé à `service_role`, lève une erreur explicite si le secret manque.
- Les 5 jobs ont été réécrits via `cron.alter_job` (planification inchangée, corps de requête identique).

**Contrôle final : `SELECT count(*) FROM cron.job WHERE command ~* 'eyJ...'` → 0 sur 15 jobs.** ✔

### Rollback
Réécrire les commandes précédentes via `cron.alter_job` (les JWT ne sont plus stockés : régénérer depuis le Vault).

## 4. Environnement de staging — **non réalisable en l'état**

La plateforme est hébergée sur Lovable Cloud, qui expose **un seul projet backend** (une base, un jeu de secrets, un déploiement d'Edge Functions). Il n'est pas possible de provisionner un second projet, de cloner la base ni de dupliquer les Edge Functions depuis cet environnement.

Options possibles, à arbitrer :
1. **Projet Lovable dédié « staging »** (duplication du dépôt + nouveau backend Cloud) : isolation complète, secrets Stripe test / Brevo sandbox propres. Recommandé.
2. **Base locale Supabase CLI** (`supabase start`) alimentée par `supabase/migrations/` : couvre les tests SQL, Deno et Playwright, sans données de production.

En attendant, les tests exécutables sans staging : Playwright (front, aucune écriture métier), tests Deno des Edge Functions, lint SQL.

## 5. Sauvegarde et restauration

- **Sauvegardes automatiques** : quotidiennes, gérées par la plateforme (Cloud → Sauvegardes).
- **PITR** : disponible selon le plan ; à activer explicitement pour une restauration à la seconde près.
- **Procédure de restauration complète** : Cloud → Sauvegardes → sélectionner le point de restauration → restaurer. Coupure de service pendant l'opération.
- **Restauration ponctuelle (une table)** : restaurer une copie, exporter la table concernée en CSV, réimporter.
- **Rollback d'une migration** : chaque migration de ce lot dispose d'une commande de rollback documentée ci-dessus. Toujours exécuter une nouvelle migration inverse plutôt que de modifier l'historique.
- **Export de données** : Cloud → Paramètres avancés → Export des données.

## 6. Observabilité

Nouvelle RPC `public.admin_platform_health()` (admin uniquement) + onglet **Santé** dans l'administration :
- taille base / journaux cron
- jobs actifs, exécutions et échecs 24 h, contrôle « aucun secret en clair »
- profondeur des files pgmq et des DLQ
- volumes d'emails et taux d'erreur 24 h

Complète les modules existants : File email, Alertes, 404, Dédup.

## 7. Validation

| Critère | État |
|---|---|
| Aucun JWT `service_role` en clair | ✔ 0/15 jobs |
| 7 SECURITY DEFINER critiques sécurisées | ✔ |
| Politique de rétention active | ✔ job quotidien |
| Risque de saturation supprimé | ✔ 7,2 Go → 1,9 Mo |
| Environnement de staging opérationnel | ✖ impossible sur un backend unique (cf. §4) |
| Tests Playwright | à exécuter |
| Edge Functions critiques opérationnelles | ✔ inchangées |
| Régression fonctionnelle | aucune détectée |
| Changement visible utilisateur | aucun |
