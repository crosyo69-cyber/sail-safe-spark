# Validation finale des exports Excel avant publication

Vérification uniquement : aucune modification de code, de données ou de composants, aucune publication.

## 1. Vérification technique
- Lire le dernier bilan de construction de l'aperçu (version actuelle) et relancer la vérification des types.
- Rechercher toute erreur liée au composant Excel (write-excel-file 4.1.1).
- Comparer les remarques du contrôle de style des fichiers modifiés avec la version précédente pour confirmer qu'elles étaient déjà présentes.
- Ouvrir les 7 écrans d'administration avec le compte admin et confirmer qu'ils se chargent sans erreur.

## 2. Vérification fonctionnelle (14 téléchargements)
Avec le compte admin dans l'aperçu, clic réel sur « Excel » puis « CSV » pour :
1. Fiche crédits d'un client
2. Liste des crédits
3. Suivi client
4. Réservations
5. Segments marketing
6. File des e-mails
7. Validateur SEO

Pour chaque fichier : téléchargement effectif, nom et extension, ouverture dans LibreOffice, en-têtes et colonnes, 0 formule, téléphones/montants/dates conservés, CSV toujours protégé.
Si un export n'a aucune donnée (probable : file des e-mails, validateur SEO), le noter comme non testable en réel, sans inventer de données.

## 3. Rapport
- Bilan construction et types
- Tableau des 14 vérifications, exports impossibles à tester
- Anomalies éventuelles
- Réserve maintenue : aucun essai dans Microsoft Excel
- Confirmation : aucun fichier ni aucune donnée modifié

Arrêt ensuite, en attente de votre autorisation de publication.
