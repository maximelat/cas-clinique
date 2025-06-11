# Corrections Finales - Réponses aux 3 points

## 1. Sources mal gérées

### Clarification
Les sources ne sont PAS générées par o3. Voici le flux correct :
1. **Perplexity** recherche et fournit les sources réelles depuis internet
2. **GPT-4o** enrichit ces sources avec plus de détails (titres, auteurs)
3. **o3** utilise ces sources dans son analyse mais n'en génère pas

### Flux des références
```
Perplexity (sonar-reasoning-pro) 
  ↓ (sources internet)
extractReferences() 
  ↓ 
analyzeReferencesWithGPT4() 
  ↓ (enrichissement)
o3 (utilise mais ne génère pas)
```

**o3 n'a pas accès à internet**, c'est correct. Il reçoit les sources de Perplexity.

## 2. Secret GitHub OPENAI

### ✅ Configuration correcte
1. **GitHub Actions** : Le secret `OPENAI` est bien utilisé dans `.github/workflows/deploy.yml`
2. **Firebase Functions** : La clé est configurée via :
   ```bash
   firebase functions:config:set openai.key="YOUR_KEY" --project cas-clinique
   ```
3. **Vérification** : La commande `firebase functions:config:get` montre que la clé est bien configurée

La transcription utilise bien cette clé via `functions.config().openai?.key`.

## 3. Deep Search Perplexity pour maladies rares

### ✅ Modèle correct
Le modèle `sonar-deep-research` est bien utilisé dans `searchRareDiseases()` avec :
- Domaines filtrés : Orphanet, OMIM, GeneReviews
- Recherche sur 5 ans (2020-2025)
- Citations obligatoires

### Position du bouton
Le bouton "Rechercher des maladies rares" apparaît actuellement :
- Au-dessus des accordions (après les boutons d'export)
- Visible seulement après l'analyse initiale
- En violet pour se distinguer

### Suggestion d'amélioration
Pour intégrer le bouton dans une section dédiée :
1. Créer une 8e section vide "Maladies rares" après l'analyse
2. Mettre le bouton à l'intérieur de cette section
3. Remplacer le contenu par les résultats après recherche

## Actions recommandées

### Pour améliorer la gestion des sources
1. Ajouter un log pour clarifier d'où viennent les sources
2. Améliorer l'extraction des titres depuis Perplexity

### Pour la position du bouton
1. Créer une section dédiée aux maladies rares dès le départ
2. Intégrer le bouton dans cette section
3. Afficher "Cliquez pour rechercher" avant la recherche

### Code à modifier
Dans `src/app/demo/page.tsx`, ajouter une 8e section après l'analyse initiale :
```typescript
// Ajouter après les 7 sections standard
sections.push({
  type: 'RARE_DISEASES',
  content: showRareDiseaseSection ? rareDiseaseData.report : 
    '<button>Rechercher des maladies rares</button>'
})
``` 