# Configuration des Règles Firestore

## Erreur Actuelle
`FirebaseError: Missing or insufficient permissions`

Cette erreur indique que les règles de sécurité Firestore bloquent l'accès aux données.

## Solution : Règles de Sécurité

### 1. Accédez à la Console Firebase
1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet
3. Dans le menu latéral : **Firestore Database**
4. Cliquez sur l'onglet **Rules**

### 2. Remplacez les Règles

Copiez et collez ces règles :

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Fonction pour vérifier si l'utilisateur est authentifié
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Fonction pour vérifier si c'est l'utilisateur lui-même
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Fonction pour vérifier si c'est l'admin
    function isAdmin() {
      return isAuthenticated() && request.auth.token.email == 'maxime.latry@gmail.com';
    }
    
    // Règles pour les crédits des utilisateurs
    match /userCredits/{userId} {
      // Lecture : utilisateur lui-même ou admin
      allow read: if isOwner(userId) || isAdmin();
      
      // Création : seulement pour un nouvel utilisateur
      allow create: if isOwner(userId);
      
      // Mise à jour : utilisateur lui-même ou admin
      allow update: if isOwner(userId) || isAdmin();
      
      // Suppression : seulement admin
      allow delete: if isAdmin();
    }
    
    // Règles pour les transactions de crédits
    match /creditTransactions/{transactionId} {
      // Lecture : utilisateur concerné ou admin
      allow read: if isAuthenticated() && 
        (resource.data.uid == request.auth.uid || isAdmin());
      
      // Création : utilisateur authentifié
      allow create: if isAuthenticated();
      
      // Pas de modification ni suppression
      allow update: if false;
      allow delete: if false;
    }
    
    // Règles pour les logs admin (optionnel)
    match /adminLogs/{logId} {
      allow read, write: if isAdmin();
    }
  }
}
```

### 3. Publiez les Règles
Cliquez sur **Publish** pour activer les nouvelles règles.

## Règles Alternatives (Pour Tester)

Si vous voulez tester rapidement (⚠️ **PAS POUR LA PRODUCTION**) :

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Permet tout pour les utilisateurs authentifiés
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Vérification

Après avoir publié les règles :
1. Rafraîchissez votre application
2. Reconnectez-vous avec Google
3. Les crédits devraient s'afficher correctement

## Notes sur les Erreurs COOP

Les erreurs `Cross-Origin-Opener-Policy` sont des avertissements du navigateur liés à la popup Google. Elles n'empêchent pas l'authentification de fonctionner et peuvent être ignorées.

## Structure des Collections

Votre Firestore devrait avoir ces collections :
- `userCredits` : Stocke les crédits de chaque utilisateur
- `creditTransactions` : Historique des transactions

## Debug

Pour vérifier si les règles fonctionnent :
1. Dans la console Firebase, allez dans **Firestore Database**
2. Essayez de créer manuellement un document dans `userCredits`
3. Utilisez le **Rules Playground** pour tester vos règles 