# Stage 100% Glisse — Gestion intelligente du remplissage

## Principe
- **Le Stage 100% Glisse est une activité dédiée** (nouvel enum `stage_100_glisse`).
- Une **journée = un seul créneau de capacité partagée** entre stages, cours à la carte et crédits météo.
- L'admin garde le contrôle (capacité, déplacement, crédit météo, libération).

## Modèle de données

### Enum `activity_type`
Ajout de la valeur `stage_100_glisse` (kitesurf reste tel quel pour les cours à la carte kitesurf).

### Table `sessions` (existante)
Une session = 1 journée × 1 créneau × 1 activité. Pour le Stage 100% Glisse, on crée **5 sessions consécutives**, une par jour, liées par un nouveau champ :
- `stage_group_id uuid` (nullable) — identifie un stage de 5 jours.
- Index sur `(stage_group_id)`.

### Capacité partagée (point clé)
Aujourd'hui, chaque (date, time_slot, activity) a sa propre `sessions.max_participants`. Pour partager la capacité entre stage et cours à la carte sur la même journée, on introduit la règle suivante :
- Pour chaque **(date, time_slot)**, l'admin fixe **une capacité unique** (4 par défaut, conforme aux règles kitesurf).
- Les sessions `kitesurf` (cours à la carte) et `stage_100_glisse` du même (date, time_slot) **partagent** cette capacité.
- Nouvelle table légère `daily_slot_capacity(date, time_slot, max_participants)` qui sert de source de vérité quand plusieurs sessions coexistent. Les `sessions.max_participants` restent pour rétrocompatibilité mais sont synchronisés via trigger.

### Marqueur "crédit météo"
- `package_bookings.booking_kind text` (valeurs : `regular`, `weather_credit`) pour distinguer le compteur admin.

## RPC

### `book_stage_100_glisse(p_code, p_start_date, p_time_slot)`
1. Verrouille le pack, vérifie qu'il est de type `Stage 100% Glisse` et a 5 crédits dispo.
2. Calcule les 5 dates consécutives à partir de `p_start_date`.
3. Pour chaque jour : trouve/refuse si la session stage n'existe pas ou si la **capacité partagée** est atteinte (somme stage + à la carte + crédits météo du même slot).
4. Insère **5 `package_bookings` dans une transaction** ; rollback complet si un jour est plein.
5. Envoie 1 seul email de confirmation listant les 5 dates.

### `book_session_with_code` (existante)
Mise à jour : la vérification de capacité utilise la capacité **partagée** du slot (stage + carte + crédits), pas seulement `sessions.max_participants` de l'activité réservée.

### `admin_grant_weather_credit_booking(p_package_id, p_session_id)`
Réservation par l'admin avec `booking_kind='weather_credit'`, ne décrémente pas les crédits du pack (compensation météo).

### Trigger capacité
Le trigger `enforce_session_capacity` existant est étendu pour compter sur **toutes les sessions du même (date, time_slot)** au lieu d'une seule session.

## Calendrier public (`Reserver.tsx`)
- Onglet/activité **« Stage 100% Glisse »** ajouté.
- Quand cette activité est sélectionnée : sélecteur de **date de début** (lundi recommandé), aperçu des 5 jours avec places restantes par jour, bouton « Réserver les 5 jours » → appelle `book_stage_100_glisse`. Désactivé si au moins une journée est complète.
- Pour les autres activités : inchangé visuellement, mais le calcul `taken` consomme la nouvelle vue de capacité partagée (ajout des places stage du même slot).

## Calendrier admin (`AdminMonthlyCalendar` + `SessionDetailPanel`)
Pour chaque journée/slot affiche un récap :
- **Stage 100% Glisse** : X / capacité
- **Cours à la carte** : Y
- **Crédits météo** : Z
- **Places restantes** : capacité − (X+Y+Z)
- Badge « Complet » si 0 restante.

Actions admin sur un slot :
- Modifier capacité partagée (±).
- Déplacer un élève vers une autre session (existant, étendu).
- Ajouter un crédit météo (nouveau bouton → `admin_grant_weather_credit_booking`).
- Libérer une place (annuler un booking existant, déjà supporté).

## Migrations / Code

### Détails techniques
1. **Migration SQL** :
   - `ALTER TYPE activity_type ADD VALUE 'stage_100_glisse'`.
   - `ALTER TABLE sessions ADD COLUMN stage_group_id uuid`.
   - `ALTER TABLE package_bookings ADD COLUMN booking_kind text NOT NULL DEFAULT 'regular' CHECK (booking_kind IN ('regular','weather_credit'))`.
   - `CREATE TABLE daily_slot_capacity (date date, time_slot time_slot, max_participants int NOT NULL DEFAULT 4, PRIMARY KEY (date, time_slot))` + GRANTs + RLS (lecture publique, écriture admin).
   - Mise à jour de `enforce_session_capacity` et `auto_close_full_session` pour utiliser la capacité partagée.
   - Mise à jour de `validate_client_package_sessions` (déjà OK pour stage 100, juste vérifier l'activité côté pack).
   - Nouvelle RPC `book_stage_100_glisse`.
   - Nouvelle RPC `admin_grant_weather_credit_booking`.
   - Mise à jour de `book_session_with_code` pour respecter la capacité partagée.

2. **Frontend** :
   - `src/pages/Reserver.tsx` : ajouter activité Stage 100% Glisse + flux de réservation 5 jours.
   - `src/pages/Tarifs.tsx` : le pack Stage 100% Glisse doit créer un `client_packages` avec `activity='stage_100_glisse'` (à vérifier dans webhook Stripe).
   - `supabase/functions/stripe-webhook/index.ts` : mapper le produit "Stage 100% Glisse" vers la nouvelle activité.
   - `src/components/admin/SessionDetailPanel.tsx` + `AdminMonthlyCalendar.tsx` : afficher la ventilation (stage / carte / météo / restantes) et le bouton crédit météo.
   - `src/components/admin/CalendarQuickSession.tsx` : permettre de créer un stage 100% glisse (génère 5 sessions liées).

## Hors périmètre (à confirmer plus tard si besoin)
- Tarification dynamique du Stage 100% Glisse en cas de placement « combiné » (mix stage + carte).
- Notification automatique si une place se libère pendant le stage.

```text
Journée 12 mai · Matin (capacité 4)
├── 2 places Stage 100% Glisse
├── 1 place Cours à la carte
├── 0 crédit météo
└── 1 place restante  →  réservable
```
