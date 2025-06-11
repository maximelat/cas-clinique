# 🔍 Guide de Débogage Firebase Functions

## Flux actuel clarifié

### Mode DEMO ✅
- Pas d'appel API
- Résultats simulés

### Mode RÉEL (problème actuel) ❌
1. **Perplexity** (API directe depuis le client) ✅
   - Modèle : `sonar-reasoning-pro`
   - Recherche académique médicale
   
2. **Firebase Function** `analyzePerplexityWithGPT4Mini` ❌
   - Modèle : `gpt-4o-mini-2024-07-18` 
   - Analyse le rapport Perplexity

### Modèles NON utilisés
- ❌ **o3** : Préparé mais pas utilisé
- ❌ **GPT-4o** : Pas utilisé

## Actions immédiates

### 1. Régénérer la clé OpenAI (URGENT)
```bash
# 1. Allez sur https://platform.openai.com/api-keys
# 2. Supprimez l'ancienne clé
# 3. Créez une nouvelle clé
# 4. Mettez à jour sur GitHub : Settings > Secrets > openai
```

### 2. Redéployer avec la nouvelle clé
```bash
cd firebase-functions
firebase functions:config:set openai.key="NOUVELLE_CLE" --project cas-clinique
firebase deploy --only functions --project cas-clinique
```

### 3. Vérifier les logs Firebase
- https://console.firebase.google.com/project/cas-clinique/logs
- Filtrer par : `analyzePerplexityWithGPT4Mini`

### 4. Test direct de la clé OpenAI
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer VOTRE_NOUVELLE_CLE"
```

## Problèmes possibles

1. **Clé OpenAI invalide ou expirée**
   - Solution : Régénérer la clé

2. **Quota OpenAI dépassé**
   - Vérifier : https://platform.openai.com/usage

3. **Erreur de déploiement**
   - Les fonctions Firebase ne se sont pas mises à jour
   - Solution : Forcer le redéploiement

4. **Problème CORS**
   - Vider le cache navigateur
   - Tester en navigation privée

## Test manuel de la fonction
```javascript
// Dans la console du navigateur sur votre site
const { getFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
const functions = getFunctions(undefined, 'europe-west1');
const analyze = httpsCallable(functions, 'analyzePerplexityWithGPT4Mini');
const result = await analyze({ perplexityData: "Test de données" });
console.log(result);
``` 