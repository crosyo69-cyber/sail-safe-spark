# Audit de sécurité post-publication (version 654c801) — lecture seule

Aucune modification : ni fichier, ni dépendance, ni fonction, ni règle, ni donnée, ni publication. Aucun e-mail, SMS, paiement ou réservation de test.

## 1. Version publiée
- Confirmer que le site en ligne sert bien 654c801 (comparaison des fichiers en ligne avec la version du projet).
- Lister les changements 83e8c5f → 654c801 et confirmer : exports Excel/CSV uniquement, aucun fichier Stripe ni réservation.

## 2. Exports administratifs (7)
- Relire le code : cellules Excel typées, aucune formule possible, protection CSV intacte.
- Vérifier que chaque export est sur une page admin et que les données viennent de fonctions réservées aux admins (essai sans compte : refus attendu).
- write-excel-file 4.1.1 : version installée, failles connues (base publique), maintenance, dépendance unique fflate, compatibilité.

## 3. Base de données et accès
- Lancer le scan rapide et le scan approfondi (ils ne modifient rien).
- Lecture des règles d'accès, tables publiques, fonctions à privilèges et fonctions appelables sans compte.
- Essais non destructifs en lecture : sans compte, puis avec un compte client, sur les tables sensibles (profils, crédits, réservations, rôles) — refus attendu.

## 4. Fonctions serveur
- Relire assistant public (limites, quotas, coût IA), assistant admin, abonnements météo, file des e-mails, réservation, crédits, Brevo.
- Appels sans compte uniquement sur les fonctions sans effet (refus attendu) ; aucune fonction Stripe appelée.
- Recherche de données personnelles dans les journaux et de secrets dans le site publié.

## 5. Reprise des alertes du 29/10
A. Abonnements météo / dernière minute — B. Assistant admin — C. E-mail dans un journal de reprise Stripe (lecture du code seulement) — D. Historiques des assistants — E. Règle de réservation trop large. Pour chacune : toujours présente, exploitable ou non, sans aucune écriture.

## 6. Protections HTTP et services chargés
- Relever les en-têtes réellement renvoyés par le site en ligne.
- Lister les services réellement chargés par la page d'accueil et /reservation (Google, Meta, polices, Windguru, cartes, base, WhatsApp, autres).

## 7. Rapport
- Fichier de rapport en Files avec le tableau demandé pour chaque alerte (gravité, avant/après, exploitabilité, impact, correction, priorité, intervention sans l'exécuter), en distinguant vulnérabilité confirmée / risque théorique / mauvaise configuration / choix volontaire / faux positif / non vérifiable.
- Conclusion : nombre total d'alertes par gravité, nouvelles alertes, alertes disparues (sans les déclarer corrigées), priorités.

Le scan approfondi prend 5 à 15 minutes ; le rapport final sera livré à son retour. Arrêt ensuite, aucune correction sans votre autorisation.
