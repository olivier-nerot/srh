# Analyse des Paiements et Abonnements SRH

## Résumé de l'Incident - Janvier 2026

**Date de l'incident**: 1er janvier 2026
**Impact**: 20 tentatives de paiement, **0 paiement réussi**

### Cause Racine Identifiée

Le bug se trouvait dans le flux de création d'abonnement:
1. Le backend créait un `SetupIntent` séparément de la `Subscription`
2. Le frontend appelait `confirmCardSetup()` qui confirmait le SetupIntent
3. **BUG**: Le moyen de paiement n'était jamais attaché à l'abonnement comme moyen de paiement par défaut

Le paramètre `save_default_payment_method: "on_subscription"` ne fonctionne que lorsqu'un paiement est effectué SUR l'abonnement lui-même (via PaymentIntent), pas lors de l'utilisation d'un SetupIntent séparé.

### Correction Appliquée

- Nouvel endpoint API `confirm-setup` ajouté
- Le frontend appelle maintenant cet endpoint après `confirmCardSetup()`
- Le moyen de paiement est correctement attaché au client et à l'abonnement

---

## Classification des Membres par Statut de Paiement

### Groupe 1: Moyen de Paiement Manquant (13 membres)

**Statut Stripe**: `requires_payment_method`
**Cause**: Carte enregistrée lors de l'inscription mais non attachée à l'abonnement
**Action requise**: Demander aux membres de mettre à jour leur moyen de paiement

| Email | Notes |
|-------|-------|
| ed.bn10@orange.fr | Pas de carte attachée |
| jppruvo@gmail.com | Pas de carte attachée |
| carette.marie-france@orange.fr | Pas de carte attachée |
| julien.frandon@chu-nimes.fr | Pas de carte attachée |
| oussama_fekihh@hotmail.fr | Pas de carte attachée |
| pascal.beroud@laposte.net | Pas de carte attachée |
| douisnicolas@gmail.com | Pas de carte attachée |
| eva.fourage@chu-bordeaux.fr | Pas de carte attachée |
| pierreantoinebarral@gmail.com | Pas de carte attachée |
| mathildefinot@yahoo.fr | Pas de carte attachée |
| Benoit.magnin@melix.net | Pas de carte attachée |

### Groupe 2: Carte Expirée ou Refusée (7 membres)

**Statut Stripe**: `Failed` - card_declined
**Cause**: Cartes expirées avant janvier 2026 ou comptes invalides
**Action requise**: Demander aux membres de mettre à jour leur carte

| Email | Expiration Carte | Raison |
|-------|------------------|--------|
| thnguyen@15-20.fr | 11/2025 | Carte expirée |
| tmartinelli@ch-valence.fr | 10/2025 | Carte expirée |
| *(autres membres)* | Diverses | Carte refusée/expirée |

### Groupe 3: Abonnements Actifs Sans Problème

**Statut Stripe**: `active` ou `trialing`
**Moyen de paiement**: Attaché et valide
**Action requise**: Aucune

---

## Statistiques Globales (Analyse CSV)

### Répartition des Clients Stripe

| Statut Abonnement | Nombre | Pourcentage |
|-------------------|--------|-------------|
| Aucun abonnement | 499 | 95.9% |
| Trialing (essai) | 21 | 4.0% |
| Active | 0 | 0% |

### Paiements Janvier 2026

| Statut | Nombre | Pourcentage |
|--------|--------|-------------|
| requires_payment_method | 13 | 65% |
| Failed (card_declined) | 7 | 35% |
| Succeeded | 0 | 0% |

---

## Procédure de Remédiation

### Étape 1: Communication aux Membres Affectés

Envoyer un email personnalisé aux membres des groupes 1 et 2 expliquant:
- La nature du problème technique
- Les instructions pour mettre à jour leur moyen de paiement
- Le lien vers leur espace membre

### Étape 2: Suivi des Mises à Jour

1. Surveiller les mises à jour de cartes dans Stripe
2. Relancer le paiement via l'API `retry-payment` une fois la carte mise à jour
3. Confirmer le succès du paiement

### Étape 3: Vérification Post-Correction

Pour les nouvelles inscriptions:
1. Vérifier dans Stripe Dashboard que le SetupIntent est `succeeded`
2. Vérifier que le client a un `default_payment_method` défini
3. Vérifier que l'abonnement a un `default_payment_method` attaché

---

## Template Email de Notification

**Objet**: Action requise - Mise à jour de votre moyen de paiement SRH

```
Cher(e) membre,

Suite à un problème technique de notre côté, votre paiement d'adhésion
prévu le 1er janvier 2026 n'a pas pu être effectué.

Nous vous prions de bien vouloir mettre à jour votre moyen de paiement
en vous connectant à votre espace membre :

[Lien vers l'espace membre]

Une fois votre carte mise à jour, votre paiement sera automatiquement
relancé.

Nous vous présentons nos excuses pour ce désagrément et vous remercions
de votre compréhension.

Cordialement,
L'équipe SRH
```

---

## Références Techniques

- **Fichier API Stripe**: `api/stripe.js`
- **Endpoint de confirmation**: `POST /api/stripe?action=confirm-setup`
- **Endpoint de relance**: `POST /api/stripe?action=retry-payment`
- **Frontend inscription**: `src/pages/JadhereAuSrh.tsx`
