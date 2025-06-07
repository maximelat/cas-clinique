# Guide de Configuration Firebase avec GitHub Actions

## 1. Obtenir le Token Firebase

Pour permettre à GitHub Actions de déployer sur Firebase, vous devez obtenir un token d'authentification :

```bash
# Se connecter à Firebase
firebase login

# Générer un token CI
firebase login:ci
```

Copiez le token généré (il ressemble à : `1//0gBq...`)

## 2. Configurer les Secrets GitHub

Dans votre repository GitHub :

1. Allez dans **Settings** → **Secrets and variables** → **Actions**
2. Ajoutez les secrets suivants :

| Secret Name | Description | Valeur |
|------------|-------------|---------|
| `FIREBASE_TOKEN` | Token Firebase CI | Le token obtenu avec `firebase login:ci` |
| `openai` | Clé API OpenAI | Votre clé API OpenAI (déjà configurée) |

## 3. Initialiser Firebase localement

```bash
# Aller dans le dossier des fonctions
cd firebase-functions

# Initialiser Firebase
firebase init

# Sélectionner :
# - Functions
# - Projet existant ou créer nouveau
# - JavaScript
# - Installer dépendances : Yes
```

## 4. Configurer Firebase Functions localement

Pour tester localement avec votre clé API :

```bash
# Définir la configuration locale
firebase functions:config:set openai.key="VOTRE_CLE_OPENAI"

# Récupérer la configuration pour vérifier
firebase functions:config:get

# Pour les tests locaux, créer un fichier .runtimeconfig.json
firebase functions:config:get > .runtimeconfig.json
```

## 5. Déployer manuellement (optionnel)

```bash
# Déployer les fonctions
firebase deploy --only functions
```

## 6. Déploiement automatique

Le workflow GitHub Actions se déclenchera automatiquement lors :
- D'un push sur la branche `main` modifiant les fonctions Firebase
- D'un déclenchement manuel dans l'onglet Actions

## Structure des fonctions Firebase

Les fonctions utilisent la clé OpenAI de cette façon :
```javascript
const OPENAI_API_KEY = functions.config().openai?.key || process.env.OPENAI_API_KEY;
```

Cela permet d'utiliser :
1. La configuration Firebase (`functions.config().openai.key`) en production
2. Les variables d'environnement en développement local

## Vérification

Pour vérifier que tout fonctionne :

1. Allez dans la console Firebase
2. Vérifiez que les fonctions sont déployées
3. Consultez les logs des fonctions
4. Testez depuis votre application 