# 🚨 Solution Rapide - Erreur Firestore

## Le Problème
`FirebaseError: Missing or insufficient permissions`

✅ **Authentification fonctionne**  
❌ **Firestore bloque l'accès**

## Solution en 2 Minutes

### 1. Ouvrez Firebase Console
👉 https://console.firebase.google.com

### 2. Allez dans Firestore Rules
- Sélectionnez votre projet
- Menu latéral → **Firestore Database**
- Onglet **Rules**

### 3. Remplacez TOUT par :

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Cliquez sur **Publish**

### 5. Testez
- Rafraîchissez votre site
- Reconnectez-vous
- ✅ Ça devrait marcher !

## ⚠️ Important
Ces règles sont **temporaires** pour tester. Pour la production, utilisez les règles complètes dans `FIRESTORE-RULES.md`.

## Toujours des erreurs ?

Vérifiez que Firestore est activé :
1. Console Firebase → **Firestore Database**
2. Si vous voyez "Create Database", cliquez dessus
3. Choisissez le mode **Production**
4. Sélectionnez une région (eur3 pour l'Europe)
5. Créez la base de données

## Les erreurs COOP
Ignorez les erreurs `Cross-Origin-Opener-Policy`. C'est normal avec la popup Google. 