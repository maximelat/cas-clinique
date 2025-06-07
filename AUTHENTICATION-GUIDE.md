# Guide d'authentification et de crédits

## Vue d'ensemble

L'application intègre maintenant un système complet d'authentification Google et de gestion des crédits pour contrôler l'accès aux analyses en mode réel.

## 🔐 Authentification Google SSO

### Connexion
1. Cliquez sur **"Se connecter avec Google"** dans la barre de navigation
2. Choisissez votre compte Google
3. Autorisez l'application
4. Vous êtes connecté ! 

### Première connexion
- **3 crédits gratuits** sont automatiquement attribués
- Votre compte est créé dans la base de données
- Message de bienvenue avec confirmation

### Menu utilisateur
Une fois connecté, cliquez sur votre nom pour voir :
- 🪙 Nombre de crédits restants
- 📊 Total de crédits utilisés
- 🚪 Option de déconnexion
- 👨‍💼 Lien Administration (si admin)

## 💳 Système de crédits

### Comment ça marche
- **Mode démo** : Gratuit, aucun crédit nécessaire
- **Mode réel** : 1 crédit par analyse
- **Crédits initiaux** : 3 gratuits à l'inscription

### Utilisation des crédits
1. Activez le mode réel (toggle désactivé)
2. Vérifiez que vous avez des crédits disponibles
3. Lancez l'analyse
4. 1 crédit est automatiquement déduit
5. Votre solde est mis à jour en temps réel

### Plus de crédits ?
- Contactez l'administrateur (maxime.latry@gmail.com)
- L'admin peut ajouter des crédits à votre compte
- Vous recevrez une notification

## 👨‍💼 Administration (Admin seulement)

### Accès
- Réservé à : maxime.latry@gmail.com
- Accessible via : Menu utilisateur → Administration

### Fonctionnalités admin

#### 1. Vue d'ensemble
- Liste complète des utilisateurs inscrits
- Crédits disponibles par utilisateur
- Historique d'utilisation
- Identification des admins

#### 2. Ajouter des crédits
1. Sélectionnez l'utilisateur dans la liste
2. Entrez le nombre de crédits à ajouter
3. Cliquez sur "Ajouter les crédits"
4. L'utilisateur est notifié

#### 3. Réinitialiser les crédits
- Remet les crédits à 3 (valeur initiale)
- Confirmation requise
- Transaction enregistrée

#### 4. Historique
Toutes les actions sont tracées :
- Utilisation de crédits
- Ajouts par l'admin
- Réinitialisations
- Date et heure

## 🛡️ Sécurité

### Protection des données
- Authentification sécurisée via Google OAuth 2.0
- Données stockées dans Firebase Firestore
- Règles de sécurité côté serveur

### Limitations
- Seul l'admin peut modifier les crédits
- Les utilisateurs ne peuvent voir que leurs propres données
- Transactions immuables pour l'audit

## ❓ FAQ

### Je n'arrive pas à me connecter
- Vérifiez votre connexion internet
- Autorisez les popups pour le site
- Essayez un autre navigateur
- Videz le cache

### Mes crédits n'apparaissent pas
- Déconnectez-vous et reconnectez-vous
- Rafraîchissez la page
- Contactez l'admin si le problème persiste

### J'ai perdu des crédits sans analyser
- Vérifiez l'historique avec l'admin
- Les crédits ne sont déduits qu'en mode réel
- Le mode démo est toujours gratuit

### Comment devenir admin ?
- Statut réservé à maxime.latry@gmail.com
- Non transférable
- Défini lors de la création du compte

## 📞 Support

Pour toute question ou problème :
- Email : maxime.latry@gmail.com
- Incluez votre email de connexion
- Décrivez le problème rencontré
- Joignez des captures d'écran si possible 