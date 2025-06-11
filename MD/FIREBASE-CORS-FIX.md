# 🔧 Guide de Résolution CORS Firebase Functions

## État actuel

✅ **Fonctions déployées** sur le projet `cas-clinique`
✅ **Plan Blaze** activé
✅ **Clé OpenAI** configurée via `firebase functions:config`

## Test rapide

1. **Vérifier les fonctions** : https://console.firebase.google.com/project/cas-clinique/functions
2. **Vérifier les logs** : https://console.firebase.google.com/project/cas-clinique/logs

## Si l'erreur CORS persiste

### 1. Vider le cache du navigateur
- Chrome : `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows)
- Ou ouvrir en navigation privée

### 2. Vérifier le déploiement de l'app
Attendez que le workflow GitHub Actions se termine :
- https://github.com/maximelat/cas-clinique/actions

### 3. Vérifier la configuration Firebase dans l'app
L'application doit utiliser le projet ID `cas-clinique`.

### 4. Test direct des fonctions
Dans la console Firebase :
1. Allez dans **Functions**
2. Cliquez sur une fonction (ex: `analyzePerplexityWithGPT4Mini`)
3. Onglet **Logs** pour voir les erreurs

## Dépannage avancé

### Vérifier la configuration locale
```bash
cd firebase-functions
firebase functions:config:get --project cas-clinique
```

Vous devriez voir :
```json
{
  "openai": {
    "key": "sk-..."
  }
}
```

### Tester localement
```bash
cd firebase-functions
firebase emulators:start --only functions
```

### Forcer le redéploiement
```bash
cd firebase-functions
firebase deploy --only functions --force --project cas-clinique
```

## Statut des services

- **Perplexity** : Appelé directement depuis le client ✅
- **OpenAI via Firebase** : Doit passer par les fonctions Firebase ✅
- **Domaine autorisé** : `https://latry.consulting` ✅

## Notes

Les fonctions Firebase `onCall` gèrent automatiquement :
- L'authentification (si configurée)
- Les CORS
- La sérialisation/désérialisation JSON

Si tout est configuré correctement, l'erreur CORS ne devrait plus apparaître. 