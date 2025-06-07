# 🔧 Debug Firebase Functions - Erreur CORS/Internal

## Problème Actuel

Vous avez une erreur "internal" avec les Firebase Functions. Voici comment la résoudre.

## 1. Vérifier la Configuration OpenAI

La cause la plus probable est que la clé OpenAI n'est pas configurée dans Firebase Functions.

### Vérifier la configuration actuelle :
```bash
firebase functions:config:get
```

Si vous ne voyez pas `openai.key`, c'est le problème !

### Configurer la clé :
```bash
firebase functions:config:set openai.key="sk-..."
```

### Redéployer après configuration :
```bash
firebase deploy --only functions
```

## 2. Vérifier les Logs

Pour voir l'erreur exacte :
```bash
firebase functions:log
```

Ou dans la console Firebase :
1. Allez sur https://console.firebase.google.com
2. Functions → Logs
3. Cherchez l'erreur détaillée

## 3. Test Rapide

### Option A : Utiliser une variable d'environnement
Dans `firebase-functions/index.js`, remplacez temporairement :
```javascript
const OPENAI_API_KEY = functions.config().openai?.key || process.env.OPENAI_API_KEY;
```

Par :
```javascript
const OPENAI_API_KEY = "sk-..." // Votre clé directement (temporaire!)
```

Puis redéployez. **⚠️ N'oubliez pas de retirer la clé après !**

### Option B : Utiliser les variables d'environnement
```bash
cd firebase-functions
echo "OPENAI_API_KEY=sk-..." > .env
firebase deploy --only functions
```

## 4. Vérifier le Déploiement

```bash
firebase list
```

Vérifiez que votre projet est bien sélectionné.

## 5. Solution Alternative Rapide

Si rien ne marche, utilisez temporairement cette configuration dans `firebase-functions/index.js` :

```javascript
// Au début du fichier, après les imports
if (!OPENAI_API_KEY) {
  console.error('ATTENTION: Clé OpenAI non trouvée dans config');
  // Temporairement, pour tester
  // const OPENAI_API_KEY = "sk-..."; 
}
```

## 6. CORS (normalement pas nécessaire)

Les fonctions `onCall` gèrent CORS automatiquement. Si vous avez toujours des erreurs CORS :

1. Vérifiez que vous utilisez bien `httpsCallable` côté client
2. Assurez-vous que Firebase est initialisé correctement

## Commandes Utiles

```bash
# Voir la config
firebase functions:config:get

# Définir la clé
firebase functions:config:set openai.key="votre-clé"

# Redéployer
firebase deploy --only functions

# Voir les logs
firebase functions:log --only analyzePerplexityWithGPT4Mini

# Tester localement
cd firebase-functions
npm run serve
```

## Erreur la Plus Commune

**"Clé API OpenAI non configurée sur le serveur"**

Solution :
1. `firebase functions:config:set openai.key="sk-..."`
2. `firebase deploy --only functions`
3. Attendez 1-2 minutes
4. Réessayez 