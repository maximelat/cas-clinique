# Guide de Configuration Firebase Functions

## Problème : La fonction analyzeWithO3 retourne une réponse vide

### Étapes de diagnostic et résolution

#### 1. Vérifier la clé API dans Firebase

Connectez-vous à Firebase et exécutez :

```bash
firebase functions:config:get
```

Vous devriez voir :
```json
{
  "openai": {
    "key": "sk-..."
  }
}
```

Si la clé n'est pas configurée :
```bash
firebase functions:config:set openai.key="VOTRE_CLÉ_API_OPENAI"
```

#### 2. Vérifier les logs Firebase

```bash
firebase functions:log
```

Cherchez les logs suivants :
- "Clé API présente: true/false"
- "ERREUR: Clé OpenAI non configurée"
- "Réponse API complète:"

#### 3. Vérifier le secret GitHub

Dans GitHub > Settings > Secrets :
- Le secret doit s'appeler `OPENAI` (pas `openai`)
- Format : `sk-...` (sans guillemets)

#### 4. Redéployer les fonctions

Après avoir configuré la clé :
```bash
firebase deploy --only functions
```

#### 5. Déboguer la réponse vide

Si la clé est configurée mais la réponse est vide, vérifiez :

1. **Quota/Limites** : Vérifiez votre compte OpenAI
2. **Modèle o3** : Assurez-vous d'avoir accès à o3-2025-04-16
3. **Format de réponse** : L'API Responses utilise `output_text`, pas `choices[0].message.content`

#### 6. Test local

Pour tester localement :
```bash
# Dans firebase-functions/
firebase functions:shell
```

Puis :
```javascript
analyzeWithO3({prompt: "Test prompt"})
```

## Configuration complète

1. **Firebase CLI** :
   ```bash
   firebase functions:config:set openai.key="sk-..."
   ```

2. **GitHub Secret** :
   - Nom : `OPENAI`
   - Valeur : `sk-...`

3. **Variables d'environnement locales** (.env.local) :
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=sk-...
   NEXT_PUBLIC_PERPLEXITY_API_KEY=pplx-...
   ```

4. **Déploiement** :
   ```bash
   firebase deploy --only functions
   ```

## Commandes utiles

```bash
# Voir la configuration actuelle
firebase functions:config:get

# Voir les logs en temps réel
firebase functions:log --follow

# Tester une fonction localement
firebase functions:shell

# Déployer une fonction spécifique
firebase deploy --only functions:analyzeWithO3
``` 