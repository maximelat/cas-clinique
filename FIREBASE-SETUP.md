# Configuration Firebase

## Variables d'environnement

Créez un fichier `.env.local` avec vos credentials Firebase:

```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APPID=your_app_id
FIREBASE_MEASUREMENTID=your_measurement_id
```

## Variables d'environnement requises

Pour activer l'authentification Google SSO et la gestion des crédits, vous devez configurer les variables suivantes dans GitHub Secrets :

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APPID
NEXT_PUBLIC_FIREBASE_MEASUREMENTID
```

## Fonctionnalités

### 1. Authentification Google SSO
- Connexion simplifiée avec un compte Google
- Session persistante
- Déconnexion sécurisée

### 2. Système de crédits
- **3 crédits gratuits** à l'inscription
- 1 crédit consommé par analyse en mode réel
- Le mode démo ne consomme pas de crédits

### 3. Administration
- Accessible uniquement à `maxime.latry@gmail.com`
- Interface pour :
  - Voir tous les utilisateurs
  - Ajouter des crédits
  - Réinitialiser les crédits (3)
  - Voir l'historique d'utilisation

## Structure Firestore

### Collection `users`
```
{
  uid: string,
  email: string,
  credits: number,
  totalCreditsUsed: number,
  lastUsed: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  isAdmin: boolean
}
```

### Collection `transactions`
```
{
  uid: string,
  email: string,
  type: 'use' | 'add' | 'reset',
  amount: number,
  description: string,
  performedBy?: string,
  timestamp: timestamp
}
```

## Configuration Firebase Console

1. **Activer Authentication**
   - Aller dans Authentication > Sign-in method
   - Activer Google comme fournisseur
   - Configurer le domaine autorisé

2. **Créer Firestore Database**
   - Créer une base de données en mode production
   - Les règles de sécurité seront gérées ultérieurement

3. **Récupérer les clés**
   - Dans Project Settings > General
   - Copier la configuration Firebase

## Utilisation

### Pour les utilisateurs
1. Cliquer sur "Se connecter avec Google"
2. Autoriser l'application
3. 3 crédits sont automatiquement attribués
4. Utiliser le mode réel consomme 1 crédit

### Pour l'administrateur
1. Se connecter avec maxime.latry@gmail.com
2. Accéder à /admin via le menu utilisateur
3. Gérer les crédits des utilisateurs

## Sécurité

- Les clés Firebase sont publiques (NEXT_PUBLIC_)
- La sécurité est gérée par les règles Firestore
- Seul l'admin peut modifier les crédits
- Les transactions sont enregistrées pour l'audit 