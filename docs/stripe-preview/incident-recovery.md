# Reprise des incidents — conception non activée

Le traitement actuel ne récupère pas un événement déjà réclamé. Un HTTP 500 seul n'est donc pas une reprise sûre. Aucun incident historique n'a été repris ici.

## Conditions requises avant activation
1. Nouvelle réclamation atomique avec états claimed/busy/done, jeton d'appartenance et bail borné ; tentative incrémentée ; busy répond non-2xx. Une complétion exige le même jeton ; un ancien worker ne peut terminer le travail repris.
2. Sérialiser la prestation par session Stripe, pas seulement par event_id. Relire l'existant sous verrou avant tout contrôle de capacité. Ne jamais confirmer pending/cancelled ou une réservation d'une autre session.
3. Stage : contrôler les participants attendus, indices, statut actif/paiement et cinq dates consécutives confirmées pour chaque participant avant d'annoncer les cinq jours. Le replay complet doit précéder les contrôles de capacité.
4. Incident durable unique par session, mis à jour et historisé ; persistance refusée = retryable, jamais terminal. Une alerte est une obligation séparée, pas la preuve que l'incident existe.
5. Outbox durable : clé unique session/gabarit/destinataire ; insertion du journal et mise en file dans une seule transaction. Une ligne pending seule ne prouve pas l'envoi en file.
6. Complétion seulement après prestation relue et obligations de confirmation persistées. Refus explicite n'est terminal qu'après persistance de l'incident. Réseau/timeout = indéterminé, même si la transaction a pu réussir.
7. Reprise administrative : autorisation serveur, lecture du paiement réel, prévisualisation, journal d'acteur/motif/résultat ; aucune nouvelle collecte ou remboursement automatique. Exécution réelle non autorisée.

## État de validation
Seule la vérification de réservation confirmed et liée à la session a été renforcée dans le webhook d'aperçu. Les autres points sont des prérequis non implémentés : bail/fencing, sérialisation SQL, Stage complet, outbox atomique et commande administrative. Pas de garantie de concurrence certifiée par les mocks actuels. Aucun SQL gelé n'a été modifié.