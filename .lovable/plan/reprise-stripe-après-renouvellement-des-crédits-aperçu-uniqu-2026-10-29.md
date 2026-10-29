# Reprise Stripe — après renouvellement des crédits (aperçu uniquement)

Objectif : reprendre la correction des acomptes à partir de l'état réel du projet, sans rien refaire ni écraser, et livrer un rapport honnête. Aucun déploiement, publication, migration, paiement, remboursement ni modification de réservation historique. Lots gelés F-27/F-28 intouchés sauf autorisation séparée.

## Étapes

1. **État réel** — lister les fichiers modifiés depuis le dernier passage des 116 tests (diff en lecture seule), noter les ajustements non retestés.
2. **Tests sur la version actuelle** — tests ciblés paiement (Deno : checkout, webhook, journal ; Bun : comptabilité), puis régression pertinente (confirmation de paiement, Stage, CRM). Résultats réels documentés, échecs corrigés uniquement dans les fichiers de la correction en cours. Contrôle de typage serveur tenté sans `--no-check` ; s'il échoue, le signaler.
3. **Rapprochement des 14 commandes (lecture seule)** — réservations multi-participants × sessions Stripe via les outils Stripe autorisés uniquement ; tableau commande / attendu / encaissé / note / admin ; expliquer l'écart 12 vs 14 (commandes vs écarts comptables, Stage antérieures au lot S3, remboursement).
4. **Incidents et reprise** — analyser les paiements sans réservation et la reprise des événements indéterminés : idempotence, aucune double réservation, aucune double confirmation ou e-mail. Si la reprise atomique exige une modification de fonction gelée ou une migration, la décrire en brouillon sans l'appliquer.
5. **Commande Stage remboursée** — vérifier dans Stripe le paiement et le remboursement, le statut de la réservation/forfait et l'affichage comptable (encaissé net, pas de solde fictif), sans rien modifier.
6. **CRM et assistant** — vérifier la séparation encaissé / attendu / solde et le masquage « inconnu, jamais zéro » partout (fiche, résumé, tableau revenus, outils assistant).
7. **Rapport final** — fichiers modifiés, tests exécutés et résultats, risques résiduels, points non résolus, mise à jour de la liste des tâches. Rester en aperçu et attendre une autorisation distincte avant tout déploiement.

Si les crédits ou un blocage technique interrompent le travail : arrêt immédiat avec la prochaine opération précise, sans annoncer le lot terminé.
