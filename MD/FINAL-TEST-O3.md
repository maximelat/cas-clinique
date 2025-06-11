# 🧪 Test Final o3 avec API Responses

## ✅ Corrections Appliquées

1. **API Responses** au lieu de Chat Completions
2. **max_output_tokens** au lieu de max_tokens
3. **reasoning.effort** ajouté
4. **Format input/output** adapté

## Test Immédiat

### 1. Préparation
```bash
# Vider le cache navigateur
Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
```

### 2. Test sur le site
1. Allez sur : https://latry.consulting/projet/clinical-case-analyzer/demo
2. **Mode réel** activé (toggle)
3. Collez ce cas test :
   ```
   Mlle M, âgée de 19 ans, présente un tableau d'hirsutisme sévère 
   et de spanioménorrhée associé à une légère hypertrophie musculaire.
   ```
4. Cliquez sur "Analyser le cas"

### 3. Vérifier la Console

Vous devriez voir :
```
Appel Firebase analyzeWithO3, prompt longueur: XXXX
Réponse Firebase o3: {output_text: "...", usage: {...}}
Texte extrait de la réponse o3: XXXX caractères
```

### 4. Vérifier les Logs Firebase

https://console.firebase.google.com/project/cas-clinique/logs

Cherchez :
- "Appel OpenAI avec o3-2025-04-16 (Responses API)..."
- "Réponse o3 reçue, longueur: XXXX"
- "Usage: {reasoning_tokens: ...}"

## Si Erreur

### Erreur 403/401
- Vérifiez que votre organisation a accès à o3
- https://platform.openai.com/settings/organization/general

### Erreur 500
- Vérifiez les logs Firebase pour l'erreur exacte
- La clé API doit être valide dans GitHub Secrets (`OPENAI`)

### Pas de résultats
- Le parsing attend le format `## SECTION_NAME:`
- Vérifiez que o3 génère bien ce format

## Succès Attendu

✅ 7 sections complètes avec contenu médical
✅ Citations [1], [2] dans le texte
✅ Références enrichies par GPT-4o
✅ Temps d'analyse ~30-60 secondes (o3 raisonne) 